"""
Embedding service for creating and managing vector embeddings
"""
from typing import List, Dict, Any, Optional, Tuple
import chromadb
from ..core.config import settings
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.manifold import TSNE
import os
import json
import uuid

class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')  # Fast, good quality model
        self.chroma_client = None
        self.collection = None
        self.initialize_chromadb()
    
    def initialize_chromadb(self):
        """Initialize ChromaDB client and collection"""
        try:
            # Create ChromaDB cloud client
            self.chroma_client = chromadb.CloudClient(
                api_key=settings.CHROMA_API_KEY,
                tenant=settings.CHROMA_TENANT,
                database=settings.CHROMA_DATABASE
            )
            # Test client connection
            try:
                collections = self.chroma_client.list_collections()
                print(f"✅ ChromaDB client connected. Existing collections: {[c.name for c in collections]}")
            except Exception as e:
                print(f"❌ Failed to connect to ChromaDB client: {e}")
                self.chroma_client = None
                self.collection = None
                return

            # Create or get collection for video keywords
            collection_name = "video_keywords"
            try:
                self.collection = self.chroma_client.get_collection(name=collection_name)
                print(f"✅ Connected to existing ChromaDB collection: {collection_name}")
            except Exception:
                print(f"Collection {collection_name} does not exist, creating...")
                try:
                    self.collection = self.chroma_client.create_collection(
                        name=collection_name,
                        metadata={"description": "Video keyword embeddings from Twelve Labs"}
                    )
                    print(f"✅ Created new ChromaDB collection: {collection_name}")
                except Exception as ce:
                    print(f"❌ Failed to create ChromaDB collection: {ce}")
                    self.collection = None
        except Exception as e:
            print(f"❌ Error initializing ChromaDB: {str(e)}")
            self.chroma_client = None
            self.collection = None
    
    def create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Create embeddings for a list of texts"""
        try:
            embeddings = self.model.encode(texts)
            return embeddings.tolist()
        except Exception as e:
            print(f"❌ Error creating embeddings: {str(e)}")
            raise
    
    def store_video_keywords(
        self, 
        indexed_asset_id: str, 
        keywords: List[str], 
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Store keywords and their embeddings for a video
        
        Args:
            indexed_asset_id: The Twelve Labs indexed asset ID
            keywords: List of keywords extracted from the video
            metadata: Additional metadata (title, summary, etc.)
            
        Returns:
            str: The document ID in ChromaDB
        """
        try:
            # Create embeddings for keywords
            keywords_text = " ".join(keywords)  # Combine keywords for better embedding
            embeddings = self.create_embeddings([keywords_text])
            
            # Prepare metadata
            doc_metadata = {
                "indexed_asset_id": indexed_asset_id,
                "keywords": keywords,
                "keyword_count": len(keywords),
                "created_at": str(np.datetime64('now')),
            }
            
            if metadata:
                doc_metadata.update(metadata)
            
            # Generate unique document ID
            doc_id = f"video_{indexed_asset_id}_{uuid.uuid4().hex[:8]}"
            
            # Store in ChromaDB
            self.collection.add(
                embeddings=embeddings,
                documents=[keywords_text],
                metadatas=[doc_metadata],
                ids=[doc_id]
            )
            
            print(f"✅ Stored embeddings for video {indexed_asset_id} with {len(keywords)} keywords")
            return doc_id
            
        except Exception as e:
            print(f"❌ Error storing video keywords: {str(e)}")
            raise
    
    def get_all_embeddings(self) -> Dict[str, Any]:
        """
        Retrieve all embeddings and metadata from ChromaDB
        
        Returns:
            Dict containing embeddings, metadata, and documents
        """
        try:
            # Get all items from the collection
            results = self.collection.get(
                include=["embeddings", "metadatas", "documents"]
            )
            
            print(f"✅ Retrieved {len(results['ids'])} embeddings from ChromaDB")
            return results
            
        except Exception as e:
            print(f"❌ Error retrieving embeddings: {str(e)}")
            raise
    
    def get_vectors_with_metadata(self) -> List[Dict[str, Any]]:
        """
        Get all vectors with their metadata in a structured format
        
        Returns:
            List of dicts containing vector, metadata, and document for each entry
        """
        try:
            results = self.collection.get(
                include=["embeddings", "metadatas", "documents"]
            )
            
            vectors_data = []
            for i in range(len(results['ids'])):
                vectors_data.append({
                    "id": results['ids'][i],
                    "vector": results['embeddings'][i],
                    "document": results['documents'][i],
                    "metadata": results['metadatas'][i]
                })
            
            print(f"✅ Retrieved {len(vectors_data)} vectors with metadata from ChromaDB")
            return vectors_data
            
        except Exception as e:
            print(f"❌ Error retrieving vectors with metadata: {str(e)}")
            raise
    
    def reduce_dimensions(
        self, 
        embeddings: List[List[float]], 
        method: str = "mds", 
        n_components: int = 3,
        random_state: int = 42,
        normalize_embeddings: bool = True,
        cluster_after_reduction: bool = False,
        n_clusters: Optional[int] = None
    ) -> List[List[float]]:
        """
        Reduce embedding dimensions for visualization
        
        Args:
            embeddings: High-dimensional embeddings
            method: Method to use ("tsne", "pca", "mds")
                   - tsne: Good for clustering visualization but may distort distances
                   - pca: Preserves variance, better for distance preservation
                   - mds: Specifically preserves distances between points
            n_components: Target dimensions (3 for 3D visualization)
            random_state: Random seed for reproducibility
            normalize_embeddings: Whether to normalize embeddings before reduction (improves clustering)
            cluster_after_reduction: Whether to apply KMeans clustering after dimensionality reduction
            n_clusters: Number of clusters for KMeans (auto-determined if None)
            
        Returns:
            List of reduced embeddings (with cluster info if clustering enabled)
        """
        try:
            embeddings_array = np.array(embeddings)
            
            # Check if we have any embeddings
            if embeddings_array.size == 0:
                raise ValueError("No embeddings provided for dimensionality reduction")
            
            if len(embeddings) < 2:
                raise ValueError("Need at least 2 embeddings for dimensionality reduction")
            
            # Normalize embeddings before dimensionality reduction for better clustering
            if normalize_embeddings:
                from sklearn.preprocessing import StandardScaler, normalize
                # L2 normalization - makes all vectors unit length
                embeddings_array = normalize(embeddings_array, norm='l2')
                print(f"ℹ️ Normalized embeddings using L2 normalization")
            
            # Adjust n_components based on available data
            n_samples = len(embeddings)
            n_features = embeddings_array.shape[1]
            max_components = min(n_samples, n_features)
            actual_components = min(n_components, max_components)
            
            if actual_components < n_components:
                print(f"⚠️ Reducing to {actual_components}D instead of {n_components}D (only {n_samples} samples available)")
            
            if method.lower() == "pca":
                # PCA: Preserves variance, better distance preservation than t-SNE
                from sklearn.decomposition import PCA
                reducer = PCA(
                    n_components=actual_components,
                    random_state=random_state
                )
                print(f"ℹ️ Using PCA (better distance preservation)")
                
            elif method.lower() == "mds":
                # MDS: Specifically designed to preserve distances
                from sklearn.manifold import MDS
                reducer = MDS(
                    n_components=actual_components,
                    random_state=random_state,
                    dissimilarity='euclidean'
                )
                print(f"ℹ️ Using MDS (optimal distance preservation)")
                
            elif method.lower() in ["tsne", "umap"]:
                # t-SNE: Good for visualization but may distort distances
                reducer = TSNE(
                    n_components=actual_components,
                    random_state=random_state,
                    perplexity=min(30, len(embeddings) - 1),
                    max_iter=1000
                )
                print(f"ℹ️ Using t-SNE (good for clusters, may distort distances)")
            else:
                raise ValueError("Method must be 'tsne', 'pca', or 'mds'")
            
            reduced_embeddings = reducer.fit_transform(embeddings_array)
            
            # If we reduced to fewer dimensions than requested, pad with zeros
            if actual_components < n_components:
                padding = np.zeros((len(embeddings), n_components - actual_components))
                reduced_embeddings = np.hstack([reduced_embeddings, padding])
            
            print(f"✅ Reduced {len(embeddings)} embeddings from {embeddings_array.shape[1]}D to {actual_components}D using {method.upper()}")
            
            # Apply KMeans clustering after dimensionality reduction
            if cluster_after_reduction and len(embeddings) > 1:
                from sklearn.cluster import KMeans
                from sklearn.metrics import silhouette_score
                
                # Auto-determine number of clusters if not specified
                if n_clusters is None:
                    # Calculate pairwise distances to determine if clustering is meaningful
                    from sklearn.metrics.pairwise import euclidean_distances
                    distances = euclidean_distances(reduced_embeddings)
                    mean_distance = np.mean(distances[distances > 0])  # Exclude diagonal zeros
                    std_distance = np.std(distances[distances > 0])
                    
                    # If points are very close together (low variance), use 1 cluster
                    # Or if we have very few points (<=3), be conservative about clustering
                    if (std_distance / mean_distance < 0.3) or len(embeddings) <= 3:
                        n_clusters = 1
                        print(f"ℹ️ Points are closely grouped or too few - using 1 cluster for {len(embeddings)} points")
                    else:
                        # Use elbow method heuristic: sqrt(n_samples/2) but allow single cluster
                        n_clusters = max(1, min(8, int(np.sqrt(len(embeddings) / 2))))
                        print(f"ℹ️ Auto-determined {n_clusters} clusters for {len(embeddings)} points")
                
                # Ensure we don't have more clusters than data points
                n_clusters = min(n_clusters, len(embeddings))
                
                # Handle single cluster case
                if n_clusters == 1:
                    cluster_labels = np.zeros(len(embeddings), dtype=int)
                    cluster_centers = np.array([np.mean(reduced_embeddings, axis=0)])
                    print(f"✅ All points assigned to single cluster")
                else:
                    # Perform KMeans clustering for multiple clusters
                    kmeans = KMeans(
                        n_clusters=n_clusters, 
                        random_state=random_state,
                        n_init=10
                    )
                    cluster_labels = kmeans.fit_predict(reduced_embeddings)
                    cluster_centers = kmeans.cluster_centers_
                    print(f"✅ Applied KMeans clustering with {n_clusters} clusters")
                
                # Store cluster info for later use (could be returned in metadata)
                print(f"ℹ️ Cluster centers: {cluster_centers.shape}")
                
                # Return both coordinates and cluster assignments
                return {
                    "coordinates": reduced_embeddings.tolist(),
                    "cluster_labels": cluster_labels.tolist(),
                    "cluster_centers": cluster_centers.tolist(),
                    "n_clusters": n_clusters
                }
            else:
                # No clustering applied, just return coordinates
                return {
                    "coordinates": reduced_embeddings.tolist(),
                    "cluster_labels": None,
                    "cluster_centers": None,
                    "n_clusters": 0
                }
            
        except Exception as e:
            print(f"❌ Error reducing dimensions: {str(e)}")
            raise
    
    def search_similar_videos(
        self, 
        query: str, 
        n_results: int = 10
    ) -> Dict[str, Any]:
        """
        Search for videos with similar keywords
        
        Args:
            query: Search query text
            n_results: Number of results to return
            
        Returns:
            Search results with metadata
        """
        try:
            # Create embedding for query
            query_embedding = self.create_embeddings([query])
            
            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=query_embedding,
                n_results=n_results,
                include=["metadatas", "documents", "distances"]
            )
            
            print(f"✅ Found {len(results['ids'][0])} similar videos for query: '{query}'")
            return results
            
        except Exception as e:
            print(f"❌ Error searching similar videos: {str(e)}")
            raise
    
    def search_by_vector(
        self,
        vector: List[float],
        n_results: int = 10
    ) -> Dict[str, Any]:
        """
        Search for similar videos using a raw vector
        
        Args:
            vector: Query vector embedding
            n_results: Number of results to return
            
        Returns:
            Search results with metadata
        """
        try:
            # Search in ChromaDB using the provided vector
            results = self.collection.query(
                query_embeddings=[vector],
                n_results=n_results,
                include=["metadatas", "documents", "distances", "embeddings"]
            )
            
            print(f"✅ Found {len(results['ids'][0])} similar videos for vector query")
            return results
            
        except Exception as e:
            print(f"❌ Error searching by vector: {str(e)}")
            raise
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the ChromaDB collection"""
        try:
            count = self.collection.count()
            return {
                "total_videos": count,
                "collection_name": self.collection.name,
                "model_name": "all-MiniLM-L6-v2"
            }
        except Exception as e:
            print(f"❌ Error getting collection stats: {str(e)}")
            return {"error": str(e)}
    
    def calculate_similarity_matrix(self) -> Dict[str, Any]:
        """
        Calculate cosine similarity between all videos
        
        Returns:
            Dict containing similarity matrix and video IDs
        """
        try:
            from sklearn.metrics.pairwise import cosine_similarity
            
            results = self.collection.get(
                include=["embeddings", "metadatas"]
            )
            
            if not results['embeddings'] or len(results['embeddings']) == 0:
                return {"error": "No embeddings found"}
            
            embeddings = np.array(results['embeddings'])
            similarity_matrix = cosine_similarity(embeddings)
            
            # Prepare response with metadata
            videos = []
            for i, meta in enumerate(results['metadatas']):
                videos.append({
                    "id": results['ids'][i],
                    "indexed_asset_id": meta.get('indexed_asset_id', ''),
                    "title": meta.get('title', ''),
                })
            
            print(f"✅ Calculated similarity matrix for {len(videos)} videos")
            return {
                "similarity_matrix": similarity_matrix.tolist(),
                "videos": videos,
                "count": len(videos)
            }
            
        except Exception as e:
            print(f"❌ Error calculating similarity matrix: {str(e)}")
            return {"error": str(e)}


# Global instance
embedding_service = EmbeddingService()