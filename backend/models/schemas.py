from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional, Literal, Union
from datetime import datetime
from fastapi import Form, Path, Query

class Asset(BaseModel):
    id: Optional[str] = None
    method: Optional[Literal["direct", "url"]] = None
    status: Optional[Literal["failed", "processing", "ready"]] = None
    filename: Optional[str] = None
    file_type: Optional[str] = None
    created_at: Optional[datetime] = None

class UploadVideoRequest(BaseModel):
    video_source: str

class UploadVideoResponse(BaseModel):
    status: str
    video_id: str
    index_id: str
    analysis_text: str

class SearchVideoRequest(BaseModel):
    query_text: Optional[str] = None
    image_url: Optional[str] = None
    image_path: Optional[str] = None
    search_options: List[Literal["visual", "audio", "transcription"]] = Field(
        default_factory=lambda: ["visual", "transcription"]
    )

class SearchResult(BaseModel):
    video_id: Optional[str] = None
    start: Optional[float] = None
    end: Optional[float] = None
    score: Optional[float] = None
    confidence: Optional[str] = None
    rank: Optional[int] = None
    thumbnail_url: Optional[str] = None
    transcription: Optional[str] = None
    user_metadata: Optional[Dict[str, Optional[Any]]] = None

class SearchVideoResponse(BaseModel):
    status: str
    result: Optional[SearchResult] = None
    error: Optional[str] = None
