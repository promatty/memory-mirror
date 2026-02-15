from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime

# ---------- Requests should be here ----------
class TestRequest(BaseModel):
    test: str


class CreateVideoAnalysisRequest(BaseModel):
    video_id: str
    description: str


class UpdateVideoAnalysisRequest(BaseModel):
    description: str


# ---------- Responses should be here ----------
class TestResponse(BaseModel):
    test: str


class VideoAnalysisResponse(BaseModel):
    id: str
    video_id: str
    description: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class VideoAnalysisListResponse(BaseModel):
    analyses: List[VideoAnalysisResponse]
    count: int
