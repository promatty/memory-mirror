/**
 * Embedding service for handling video keyword embeddings
 */

import { Point3D } from '@/types/memory';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface StoreKeywordsRequest {
  indexed_asset_id: string;
  keywords: string[];
  metadata?: Record<string, any>;
}

export interface DimensionalityReductionRequest {
  method?: 'tsne' | 'pca' | 'mds';
  n_components?: number;
  random_state?: number;
  normalize_embeddings?: boolean;
  cluster_after_reduction?: boolean;
  n_clusters?: number | null;
}

export interface SearchSimilarRequest {
  query: string;
  n_results?: number;
}

export interface SearchByVectorRequest {
  vector: number[];
  n_results?: number;
}

export interface VectorData {
  id: string;
  vector: number[];
  document: string;
  metadata: Record<string, any>;
}

export interface GetVectorsResponse {
  status: string;
  vectors?: VectorData[];
  total?: number;
  error?: string;
}

export interface VideoInfo {
  id: string;
  indexed_asset_id: string;
  title: string;
}

export interface SimilarityMatrixResponse {
  status: string;
  similarity_matrix?: number[][];
  videos?: VideoInfo[];
  count?: number;
  error?: string;
}

export interface ApiResponse<T> {
  status: string;
  error?: string;
  data?: T;
}

export interface DimensionalityReductionResponse {
  status: string;
  points?: Point3D[];
  method?: string;
  total_videos?: number;
  error?: string;
}

export interface SearchSimilarResponse {
  status: string;
  results?: Array<{
    doc_id: string;
    distance: number;
    document: string;
    metadata: Record<string, any>;
  }>;
  error?: string;
}

export interface CollectionStatsResponse {
  status: string;
  stats?: {
    total_videos: number;
    collection_name: string;
    model_name: string;
  };
  error?: string;
}

class EmbeddingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/embeddings`;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Store keywords and their embeddings for a video
   */
  async storeKeywords(request: StoreKeywordsRequest): Promise<{ status: string; doc_id?: string; error?: string }> {
    return this.makeRequest('/store-keywords', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get all video embeddings reduced to 3D coordinates for visualization
   */
  async getDimensionalityReduction(
    request: DimensionalityReductionRequest = {}
  ): Promise<DimensionalityReductionResponse> {
    const params = {
      method: 'mds',  // Default to MDS for optimal distance preservation
      n_components: 3,
      random_state: 42,
      normalize_embeddings: true,  // Enable normalization by default
      cluster_after_reduction: false,  // Clustering optional
      n_clusters: null,  // Auto-determine clusters
      ...request,
    };

    return this.makeRequest('/reduce-dimensions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Search for videos with similar keywords
   */
  async searchSimilar(request: SearchSimilarRequest): Promise<SearchSimilarResponse> {
    return this.makeRequest('/search-similar', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Search for videos using a raw vector embedding
   */
  async searchByVector(request: SearchByVectorRequest): Promise<SearchSimilarResponse> {
    return this.makeRequest('/search-by-vector', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get all vectors with their metadata from ChromaDB
   */
  async getVectors(): Promise<GetVectorsResponse> {
    return this.makeRequest('/vectors', {
      method: 'GET',
    });
  }

  /**
   * Get statistics about the ChromaDB collection
   */
  async getCollectionStats(): Promise<CollectionStatsResponse> {
    return this.makeRequest('/stats', {
      method: 'GET',
    });
  }

  /**
   * Get the similarity matrix showing cosine similarity between all videos
   */
  async getSimilarityMatrix(): Promise<SimilarityMatrixResponse> {
    return this.makeRequest('/similarity-matrix', {
      method: 'GET',
    });
  }

  /**
   * Reset the ChromaDB collection (delete all data)
   * ⚠️ WARNING: This will delete all stored embeddings!
   */
  async resetCollection(): Promise<{ status: string; message?: string; error?: string }> {
    return this.makeRequest('/reset-collection', {
      method: 'DELETE',
    });
  }

  /**
   * Health check for the embeddings service
   */
  async healthCheck(): Promise<{ status: string; stats?: any; error?: string }> {
    return this.makeRequest('/health', {
      method: 'GET',
    });
  }
}

export const embeddingService = new EmbeddingService();