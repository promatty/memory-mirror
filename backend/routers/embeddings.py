"""
Embeddings router for handling vector embeddings and ChromaDB operations
"""
from http import HTTPStatus
from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from ..models.schemas import (
    StoreKeywordsRequest,
    StoreKeywordsResponse,
    DimensionalityReductionRequest, 
    DimensionalityReductionResponse,
    Point3D,
    SearchSimilarRequest,
    SearchSimilarResponse,
    SearchByVectorRequest,
    GetVectorsResponse,
    VectorData,
    CollectionStatsResponse,
    SimilarityMatrixResponse,
)

from ..services.embedding_service import embedding_service

router = APIRouter(
    prefix="/embeddings",
    tags=["embeddings"]
)

@router.get("/health")
async def health_check():
    """Health check endpoint for embeddings service"""
    try:
        stats = embedding_service.get_collection_stats()
        return {"status": "healthy", "stats": stats}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@router.post("/store-keywords", response_model=StoreKeywordsResponse)
async def store_keywords(request: StoreKeywordsRequest):
    """
    Store keywords and their embeddings for a video
    
    This endpoint takes keywords extracted from a Twelve Labs video analysis
    and stores them as vector embeddings in ChromaDB for later retrieval
    and 3D visualization.
    """
    try:
        doc_id = embedding_service.store_video_keywords(
            indexed_asset_id=request.indexed_asset_id,
            keywords=request.keywords,
            metadata=request.metadata
        )
        
        return StoreKeywordsResponse(
            status="success",
            doc_id=doc_id
        )
        
    except Exception as e:
        print(f"❌ Error storing keywords: {str(e)}")
        return StoreKeywordsResponse(
            status="error",
            error=str(e)
        )

@router.post("/reduce-dimensions", response_model=DimensionalityReductionResponse)
async def reduce_dimensions(request: DimensionalityReductionRequest):
    """
    Get all video embeddings reduced to 3D coordinates for visualization
    
    This endpoint retrieves all stored embeddings from ChromaDB, applies
    dimensionality reduction (t-SNE or UMAP), and returns 3D coordinates
    suitable for Three.js visualization.
    """
    try:
        # Get all embeddings from ChromaDB
        all_data = embedding_service.get_all_embeddings()
        
        if all_data['embeddings'] is None or len(all_data['embeddings']) == 0:
            return DimensionalityReductionResponse(
                status="error",
                error="No embeddings found in database"
            )
        
        # Create 3D points with metadata
        points = []
        
        # Special case: single video - place at origin
        if len(all_data['embeddings']) == 1:
            metadata = all_data['metadatas'][0]
            point = Point3D(
                x=0.0,
                y=0.0,
                z=0.0,
                indexed_asset_id=metadata.get('indexed_asset_id', ''),
                keywords=metadata.get('keywords', []),
                metadata={k: v for k, v in metadata.items() 
                         if k not in ['indexed_asset_id', 'keywords']}
            )
            points.append(point)
        else:
            # Multiple videos - use dimensionality reduction
            reduction_result = embedding_service.reduce_dimensions(
                embeddings=all_data['embeddings'],
                method=request.method,
                n_components=request.n_components,
                random_state=request.random_state,
                normalize_embeddings=request.normalize_embeddings,
                cluster_after_reduction=request.cluster_after_reduction,
                n_clusters=request.n_clusters
            )
            
            # Extract coordinates and cluster info
            reduced_embeddings = reduction_result["coordinates"]
            cluster_labels = reduction_result.get("cluster_labels")
            cluster_centers = reduction_result.get("cluster_centers")
            n_clusters_result = reduction_result.get("n_clusters", 0)
            
            for i, coords in enumerate(reduced_embeddings):
                metadata = all_data['metadatas'][i]
                
                # Add cluster information to point metadata
                point_metadata = {k: v for k, v in metadata.items() 
                                if k not in ['indexed_asset_id', 'keywords']}
                
                if cluster_labels is not None:
                    point_metadata['cluster_id'] = int(cluster_labels[i])
                    point_metadata['total_clusters'] = n_clusters_result
                
                point = Point3D(
                    x=coords[0],
                    y=coords[1],
                    z=coords[2] if len(coords) > 2 else 0.0,
                    indexed_asset_id=metadata.get('indexed_asset_id', ''),
                    keywords=metadata.get('keywords', []),
                    metadata=point_metadata
                )
                points.append(point)
        
        return DimensionalityReductionResponse(
            status="success",
            points=points,
            method=request.method,
            total_videos=len(points)
        )
        
    except Exception as e:
        print(f"❌ Error reducing dimensions: {str(e)}")
        return DimensionalityReductionResponse(
            status="error",
            error=str(e)
        )

@router.post("/search-similar", response_model=SearchSimilarResponse)
async def search_similar(request: SearchSimilarRequest):
    """
    Search for videos with similar keywords
    
    This endpoint takes a text query, converts it to an embedding,
    and finds videos with similar keyword embeddings in ChromaDB.
    """
    try:
        results = embedding_service.search_similar_videos(
            query=request.query,
            n_results=request.n_results
        )
        
        # Format results for response
        formatted_results = []
        if results.get('ids') and len(results['ids']) > 0 and results['ids'][0] and len(results['ids'][0]) > 0:
            for i, doc_id in enumerate(results['ids'][0]):
                result = {
                    "doc_id": doc_id,
                    "distance": results['distances'][0][i],
                    "document": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i]
                }
                formatted_results.append(result)
        
        return SearchSimilarResponse(
            status="success",
            results=formatted_results
        )
        
    except Exception as e:
        print(f"❌ Error searching similar videos: {str(e)}")
        return SearchSimilarResponse(
            status="error",
            error=str(e)
        )

@router.post("/search-by-vector", response_model=SearchSimilarResponse)
async def search_by_vector(request: SearchByVectorRequest):
    """
    Search for videos using a raw vector embedding
    
    This endpoint takes a vector embedding directly and finds
    videos with similar embeddings in ChromaDB.
    """
    try:
        results = embedding_service.search_by_vector(
            vector=request.vector,
            n_results=request.n_results
        )
        
        # Format results for response
        formatted_results = []
        if results.get('ids') and len(results['ids']) > 0 and results['ids'][0] and len(results['ids'][0]) > 0:
            for i, doc_id in enumerate(results['ids'][0]):
                result = {
                    "doc_id": doc_id,
                    "distance": results['distances'][0][i],
                    "document": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i]
                }
                # Include the embedding if available
                if results.get('embeddings') and len(results['embeddings']) > 0:
                    result["embedding"] = results['embeddings'][0][i]
                formatted_results.append(result)
        
        return SearchSimilarResponse(
            status="success",
            results=formatted_results
        )
        
    except Exception as e:
        print(f"❌ Error searching by vector: {str(e)}")
        return SearchSimilarResponse(
            status="error",
            error=str(e)
        )

@router.get("/vectors", response_model=GetVectorsResponse)
async def get_vectors():
    """
    Get all vectors with their metadata from ChromaDB
    
    Returns raw vector embeddings along with their associated metadata,
    documents, and IDs. Useful for debugging or custom analysis.
    """
    try:
        vectors_data = embedding_service.get_vectors_with_metadata()
        
        # Convert to VectorData models
        vector_models = [
            VectorData(
                id=v["id"],
                vector=v["vector"],
                document=v["document"],
                metadata=v["metadata"]
            )
            for v in vectors_data
        ]
        
        return GetVectorsResponse(
            status="success",
            vectors=vector_models,
            total=len(vector_models)
        )
        
    except Exception as e:
        print(f"❌ Error getting vectors: {str(e)}")
        return GetVectorsResponse(
            status="error",
            error=str(e)
        )

@router.get("/stats", response_model=CollectionStatsResponse)
async def get_collection_stats():
    """
    Get statistics about the ChromaDB collection
    
    Returns information about the number of stored videos,
    collection details, and embedding model information.
    """
    try:
        stats = embedding_service.get_collection_stats()
        return CollectionStatsResponse(
            status="success",
            stats=stats
        )
        
    except Exception as e:
        print(f"❌ Error getting collection stats: {str(e)}")
        return CollectionStatsResponse(
            status="error",
            error=str(e)
        )

@router.get("/similarity-matrix", response_model=SimilarityMatrixResponse)
async def get_similarity_matrix():
    """
    Calculate and return the cosine similarity matrix between all videos
    
    This shows the actual semantic similarity between videos based on their
    keyword embeddings, regardless of their t-SNE visualization positions.
    Useful for understanding true relationships when t-SNE visualization may be misleading.
    """
    try:
        result = embedding_service.calculate_similarity_matrix()
        
        if "error" in result:
            return SimilarityMatrixResponse(
                status="error",
                error=result["error"]
            )
        
        return SimilarityMatrixResponse(
            status="success",
            similarity_matrix=result["similarity_matrix"],
            videos=result["videos"],
            count=result["count"]
        )
        
    except Exception as e:
        print(f"❌ Error calculating similarity matrix: {str(e)}")
        return SimilarityMatrixResponse(
            status="error",
            error=str(e)
        )

@router.delete("/reset-collection")
async def reset_collection():
    """
    Reset the ChromaDB collection (delete all data)
    
    ⚠️ WARNING: This will delete all stored embeddings!
    Use only for development/testing.
    """
    try:
        # Delete the collection and recreate it
        collection_name = embedding_service.collection.name
        embedding_service.chroma_client.delete_collection(name=collection_name)
        
        # Reinitialize the service
        embedding_service.initialize_chromadb()
        
        return {"status": "success", "message": "Collection reset successfully"}
        
    except Exception as e:
        print(f"❌ Error resetting collection: {str(e)}")
        return {"status": "error", "error": str(e)}