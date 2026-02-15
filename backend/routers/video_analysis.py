"""API routes for video analysis operations."""

from fastapi import APIRouter, HTTPException, status
from typing import List

from ..models.schemas import (
    CreateVideoAnalysisRequest,
    UpdateVideoAnalysisRequest,
    VideoAnalysisResponse,
    VideoAnalysisListResponse,
)
from ..core.database import db_service

router = APIRouter(
    prefix="/video-analysis",
    tags=["video-analysis"]
)


@router.post("/", response_model=VideoAnalysisResponse, status_code=status.HTTP_201_CREATED)
async def create_video_analysis(request: CreateVideoAnalysisRequest):
    """
    Create a new video analysis record.
    
    This endpoint stores the results of a video analysis, including the video ID
    from Twelve Labs and the AI-generated description.
    """
    try:
        analysis = await db_service.create_video_analysis(
            video_id=request.video_id,
            description=request.description
        )
        
        return VideoAnalysisResponse(
            id=analysis.id,
            video_id=analysis.videoId,
            description=analysis.description,
            created_at=analysis.createdAt,
            updated_at=analysis.updatedAt
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create video analysis: {str(e)}"
        )


@router.get("/{video_id}", response_model=VideoAnalysisResponse)
async def get_video_analysis(video_id: str):
    """
    Get a video analysis by video ID.
    
    Returns the stored analysis for a specific video from Twelve Labs.
    """
    analysis = await db_service.get_video_analysis(video_id)
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video analysis not found for video_id: {video_id}"
        )
    
    return VideoAnalysisResponse(
        id=analysis.id,
        video_id=analysis.videoId,
        description=analysis.description,
        created_at=analysis.createdAt,
        updated_at=analysis.updatedAt
    )


@router.put("/{video_id}", response_model=VideoAnalysisResponse)
async def update_video_analysis(video_id: str, request: UpdateVideoAnalysisRequest):
    """
    Update an existing video analysis.
    
    Updates the description for an existing video analysis record.
    """
    try:
        analysis = await db_service.update_video_analysis(
            video_id=video_id,
            description=request.description
        )
        
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Video analysis not found for video_id: {video_id}"
            )
        
        return VideoAnalysisResponse(
            id=analysis.id,
            video_id=analysis.videoId,
            description=analysis.description,
            created_at=analysis.createdAt,
            updated_at=analysis.updatedAt
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update video analysis: {str(e)}"
        )


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video_analysis(video_id: str):
    """
    Delete a video analysis record.
    
    Removes the stored analysis for a specific video.
    """
    success = await db_service.delete_video_analysis(video_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video analysis not found for video_id: {video_id}"
        )
    
    return None


@router.get("/", response_model=VideoAnalysisListResponse)
async def list_video_analyses(limit: int = 100):
    """
    List all video analyses.
    
    Returns a paginated list of all stored video analyses, ordered by creation date
    (newest first).
    """
    try:
        analyses = await db_service.list_video_analyses(limit=limit)
        
        return VideoAnalysisListResponse(
            analyses=[
                VideoAnalysisResponse(
                    id=a.id,
                    video_id=a.videoId,
                    description=a.description,
                    created_at=a.createdAt,
                    updated_at=a.updatedAt
                )
                for a in analyses
            ],
            count=len(analyses)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list video analyses: {str(e)}"
        )
