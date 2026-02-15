from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional, Literal, Union
from datetime import datetime
from fastapi import Form, Path, Query
from twelvelabs import HlsObject

class Asset(BaseModel):
    id: Optional[str] = None
    method: Optional[Literal["direct", "url"]] = None
    status: Optional[Literal["failed", "processing", "ready"]] = None
    filename: Optional[str] = None
    file_type: Optional[str] = None
    created_at: Optional[datetime] = None

class GetVideoRequest(BaseModel):
    indexed_asset_id: str

class GetVideoResponse(BaseModel):
    hlsObject: HlsObject
class UploadVideoRequest(BaseModel):
    video_path: str

class UploadVideoResponse(BaseModel):
    status: str
    hlsObject: HlsObject
    indexed_asset_id: str
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

# Embedding-related schemas
class StoreKeywordsRequest(BaseModel):
    indexed_asset_id: str
    keywords: List[str]
    metadata: Optional[Dict[str, Any]] = None

class StoreKeywordsResponse(BaseModel):
    status: str
    doc_id: Optional[str] = None
    error: Optional[str] = None

class DimensionalityReductionRequest(BaseModel):
    method: Literal["tsne", "pca", "mds"] = "mds"  # Default to MDS for optimal distance preservation
    n_components: int = 3
    random_state: int = 42
    normalize_embeddings: bool = True  # Enable normalization for better clustering
    cluster_after_reduction: bool = False  # Enable KMeans clustering after reduction
    n_clusters: Optional[int] = None  # Auto-determine if None

class Point3D(BaseModel):
    x: float
    y: float
    z: float
    indexed_asset_id: str
    keywords: List[str]
    metadata: Optional[Dict[str, Any]] = None

class DimensionalityReductionResponse(BaseModel):
    status: str
    points: Optional[List[Point3D]] = None
    method: Optional[str] = None
    total_videos: Optional[int] = None
    error: Optional[str] = None

class SearchSimilarRequest(BaseModel):
    query: str
    n_results: int = 10

class SearchByVectorRequest(BaseModel):
    vector: List[float]
    n_results: int = 10

class VectorData(BaseModel):
    id: str
    vector: List[float]
    document: str
    metadata: Dict[str, Any]

class GetVectorsResponse(BaseModel):
    status: str
    vectors: Optional[List[VectorData]] = None
    total: Optional[int] = None
    error: Optional[str] = None

class SearchSimilarResponse(BaseModel):
    status: str
    results: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None

class CollectionStatsResponse(BaseModel):
    status: str
    stats: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class VideoInfo(BaseModel):
    id: str
    indexed_asset_id: str
    title: str

class SimilarityMatrixResponse(BaseModel):
    status: str
    similarity_matrix: Optional[List[List[float]]] = None
    videos: Optional[List[VideoInfo]] = None
    count: Optional[int] = None
    error: Optional[str] = None
