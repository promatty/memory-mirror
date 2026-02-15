from http import HTTPStatus
from fastapi import APIRouter
import time
from datetime import datetime

from ..models.schemas import (
    SearchResult,
    SearchVideoRequest,
    SearchVideoResponse,
    UploadVideoRequest,
    UploadVideoResponse,
    GetVideoRequest,
    GetVideoResponse,
)

from ..core.models import TwelveLabsModel

from ..core.config import settings

router = APIRouter(
    prefix="/twelvelabs",
    tags=["twelvelabs-endpoint"]
)

@router.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@router.post("/get-video", response_model=GetVideoResponse)
async def get_video(request: GetVideoRequest):
    try:
        client = TwelveLabsModel.get_twelve_labs_client()

        print("Waiting for indexing to complete.")

        indexed_asset = client.indexes.indexed_assets.retrieve(
            settings.TWELVE_LABS_INDEX_ID,
            request.indexed_asset_id
        )

        return GetVideoResponse(
            hlsObject=indexed_asset.hls,
        )
        
    except Exception as e:
        print(f"❌ Error analyzing video: {str(e)}")
        return GetVideoResponse(
            hlsObject=None,
            error=str(e)
        )

@router.post("/upload-video", response_model=UploadVideoResponse)
async def upload_video(request: UploadVideoRequest):
    try:
        client = TwelveLabsModel.get_twelve_labs_client()

        prompt = """
            can you describe whats happening in this video?
        """
        
        print(f"Uploading video from: {request.video_path}")

        index = client.indexes.retrieve(
            index_id=settings.TWELVE_LABS_INDEX_ID
        )

        path = request.video_path
        path = path.lstrip("/")
        
        asset = client.assets.create(
            method="direct",
            file=open(path, "rb")
        )
        print(f"Created asset: id={asset.id}")  
        indexed_asset = client.indexes.indexed_assets.create(
            index_id=index.id,
            asset_id=asset.id,
            enable_video_stream=True, # very important to enable video streams
        )
        print(f"Created indexed asset: id={indexed_asset.id}")

        print("Waiting for indexing to complete.")

        while True:
            indexed_asset = client.indexes.indexed_assets.retrieve(
                index.id,
                indexed_asset.id
            )
            print(f"  Status={indexed_asset.status}")
            if indexed_asset.status == "ready":
                print("Indexing complete!")
                break
            elif indexed_asset.status == "failed":
                raise RuntimeError("Indexing failed")
            time.sleep(5)

        text_stream = client.analyze_stream(video_id=indexed_asset.id, prompt=prompt)

        analysis_text = ""
        for text in text_stream:
           if text.event_type == "text_generation":
                analysis_text += text.text

        # TODO:
        # once we have the analysis text, we could store it
        # so that the next time we retrieve this specific asset
        # we can return the analysis text immediately without needing 
        # to re-analyze the video

        return UploadVideoResponse(
            status=HTTPStatus.OK,
            hlsObject=indexed_asset.hls,
            indexed_asset_id=indexed_asset.id,
            analysis_text=analysis_text,
        )
        
    except Exception as e:
        print(f"Error analyzing video: {str(e)}")
        return UploadVideoResponse(
            status=HTTPStatus.INTERNAL_SERVER_ERROR,
            error=str(e)
        )

@router.post("/search_video", response_model=SearchVideoResponse)
async def search_video(request: SearchVideoRequest):
    try:
        client = TwelveLabsModel.get_twelve_labs_client()

        query_media_type = None
        query_media_url = None
        query_media_file = None

        if request.image_url or request.image_path:
            query_media_type = "image"

        if request.image_url:
            query_media_url = request.image_url
        elif request.image_path:
            path = request.image_path
            if path.startswith("/"):
                path = path.lstrip("/")
            query_media_file = open(path, "rb")

        search_pager = client.search.query(
            index_id=settings.TWELVE_LABS_INDEX_ID,
            search_options=request.search_options,
            query_text=request.query_text,
            query_media_type=query_media_type,
            query_media_url=query_media_url,
            query_media_file=query_media_file,
            group_by="clip",
            sort_option="score",
            page_limit=1,
        )

        top_item = next(iter(search_pager), None)
        if not top_item:
            return SearchVideoResponse(status=HTTPStatus.OK, result=None)

        result = SearchResult(
            video_id=getattr(top_item, "video_id", None),
            start=getattr(top_item, "start", None),
            end=getattr(top_item, "end", None),
            score=getattr(top_item, "score", None),
            confidence=getattr(top_item, "confidence", None),
            rank=getattr(top_item, "rank", None),
            thumbnail_url=getattr(top_item, "thumbnail_url", None),
            transcription=getattr(top_item, "transcription", None),
            user_metadata=getattr(top_item, "user_metadata", None),
        )

        return SearchVideoResponse(
            status=HTTPStatus.OK,
            result=result,
        )

    except Exception as e:
        print(f"Error searching video: {str(e)}")
        return SearchVideoResponse(
            status=HTTPStatus.INTERNAL_SERVER_ERROR,
            error=str(e),
        )
    finally:
        if query_media_file:
            query_media_file.close()
