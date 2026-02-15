from http import HTTPStatus
from fastapi import APIRouter, UploadFile, File, Form
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

@router.post("/upload-video")
async def upload_video(
    video: UploadFile = File(...),
    metadata: str = Form(None)):
    """
    Upload a video file as binary using UploadFile and File.
    """
    from fastapi.responses import JSONResponse
    import json
    try:
        client = TwelveLabsModel.get_twelve_labs_client()
        import json
        # Parse metadata JSON string if provided
        if metadata:
            user_metadata = json.loads(metadata)
        else:
            user_metadata = None

        # Compose prompt with metadata
        prompt = (
            "You are an expert at summarizing personal memory videos. "
            "Please generate a detailed title, summary, and keywords for this video, "
            "and make sure to reference and incorporate the following user metadata (such as people, location, mood, date, tags, etc) into your summary and keywords as much as possible. "
            "If the metadata is relevant, mention it naturally in the summary and include it in the keywords. "
            "Here is the user metadata for this video:\n"
            f"{json.dumps(user_metadata, ensure_ascii=False, indent=2) if user_metadata else 'None'}"
        )

        print(f"Uploading video: {video.filename}")
        index = client.indexes.retrieve(
            index_id=settings.TWELVE_LABS_INDEX_ID
        )
        asset = client.assets.create(
            method="direct",
            file=video.file  # file-like object
        )
        print(f"Created asset: id={asset.id}")
        indexed_asset = client.indexes.indexed_assets.create(
            index_id=index.id,
            asset_id=asset.id,
            enable_video_stream=True # very important to enable video streams
        )
        # Attach user_metadata if provided
        if user_metadata:
            client.indexes.videos.update(
                index_id=index.id,
                video_id=indexed_asset.id,
                user_metadata=user_metadata
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

        # Add response_format for analyze_stream
        response_format = dict(
            type="json_schema",
            json_schema={
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "summary": {"type": "string"},
                    "keywords": {"type": "array", "items": {"type": "string"}},
                    "metadata": {"type": "object"},
                },
            },
        )

        text_stream = client.analyze_stream(
            video_id=indexed_asset.id,
            prompt=prompt,
            response_format=response_format
        )
        analysis_json = None
        analysis_text = ""
        for text in text_stream:
            if text.event_type == "text_generation":
                analysis_text += text.text
            elif text.event_type == "json_generation":
                analysis_json = text.json

        if analysis_json is not None:
            if "metadata" in analysis_json and isinstance(analysis_json["metadata"], dict):
                merged_metadata = dict(analysis_json["metadata"])
                if user_metadata:
                    merged_metadata.update(user_metadata)
                analysis_json["metadata"] = merged_metadata
            else:
                analysis_json["metadata"] = user_metadata if user_metadata else {}
            analysis_text = json.dumps(analysis_json, ensure_ascii=False)

        # Convert HlsObject to dict for JSON serialization
        hls_obj = indexed_asset.hls
        if hasattr(hls_obj, 'dict'):
            hls_obj = hls_obj.dict()
        elif hasattr(hls_obj, '__dict__'):
            hls_obj = dict(hls_obj.__dict__)
        return JSONResponse(
            status_code=HTTPStatus.OK,
            content={
                "status": HTTPStatus.OK,
                "hlsObject": hls_obj,
                "indexed_asset_id": indexed_asset.id,
                "analysis_text": analysis_text,
                "analysis_json": analysis_json,
                "metadata": user_metadata,
            }
        )
    except Exception as e:
        print(f"Error analyzing video: {str(e)}")
        return JSONResponse(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            content={
                "status": HTTPStatus.INTERNAL_SERVER_ERROR,
                "error": str(e)
            }
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
