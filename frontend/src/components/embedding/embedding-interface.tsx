"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Point3D } from "@/types/memory";
import { VideoCluster3D } from "./video-cluster-3d";
import { embeddingService, DimensionalityReductionResponse } from "@/services/embedding-service";

interface SimilarVideo {
  doc_id: string;
  distance: number;
  metadata: {
    indexed_asset_id?: string;
    title?: string;
    [key: string]: unknown;
  };
}

interface SelectedVideoDetails {
  point: Point3D;
  videoUrl?: string;
  similarVideos?: SimilarVideo[];
}

export function EmbeddingInterface() {
  const [selectedVideo, setSelectedVideo] = useState<SelectedVideoDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedKeywords, setExpandedKeywords] = useState(false);
  
  // Fixed to MDS for best distance preservation (k-nn) with normalization and clustering
  const reductionMethod = 'mds';

  // Fetch 3D coordinates for visualization (using MDS for k-nn)
  const {
    data: clusterData,
    isLoading: isLoadingClusters,
    error: clusterError,
    refetch: refetchClusters
  } = useQuery<DimensionalityReductionResponse>({
    queryKey: ['video-clusters', reductionMethod],
    queryFn: async () => {
      return embeddingService.getDimensionalityReduction({
        method: reductionMethod,
        n_components: 3,
        random_state: 42,
        normalize_embeddings: true,  // Enable normalization for better clustering
        cluster_after_reduction: true,  // Enable KMeans clustering
        n_clusters: null  // Auto-determine number of clusters
      });
    },
    refetchOnWindowFocus: false,
  });

  // Search similar videos mutation
  const searchMutation = useMutation({
    mutationFn: (query: string) => embeddingService.searchSimilar({ 
      query, 
      n_results: 10 
    }),
    onSuccess: (data) => {
      if (data.status === 'success' && data.results) {
        toast.success(`Found ${data.results.length} similar videos`);
        console.log('Search results:', data.results);
      } else {
        toast.error(data.error || 'Search failed');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Get all vectors mutation
  const vectorsMutation = useMutation({
    mutationFn: () => embeddingService.getVectors(),
    onSuccess: (data) => {
      if (data.status === 'success' && data.vectors) {
        console.log(`Retrieved ${data.total || 0} vectors from ChromaDB (k-nn ready)`);
        console.log('Vectors:', data.vectors);
      } else {
        toast.error(data.error || 'Failed to retrieve vectors');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Auto-fetch vectors on mount
  useEffect(() => {
    vectorsMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePointSelect = useCallback(async (point: Point3D) => {
    setSelectedVideo({ point });
    setExpandedKeywords(false); // Reset keyword expansion when selecting new video
    
    // Try to fetch video URL from the main API
    try {
      const res = await fetch(
      "/api/get-video",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          indexed_asset_id: point.metadata?.indexed_asset_id || point.indexed_asset_id
        }),
      },
    );
      if (!res.ok) throw new Error("Failed to retrieve video URL");
      const data = await res.json();
      setSelectedVideo(prev => prev ? { ...prev, videoUrl: data.hlsObject?.video_url } : null);
    } catch (err) {
      console.error("Error fetching video URL:", err);
      setSelectedVideo(prev => prev ? { ...prev, videoUrl: undefined } : null);
    } 

    // Fetch similar videos using keyword text search
    if (point.keywords && point.keywords.length > 0) {
      try {
        const searchQuery = point.keywords.slice(0, 5).join(' ');
        const similarResults = await embeddingService.searchSimilar({
          query: searchQuery,
          n_results: 5
        });
        
        if (similarResults.status === 'success' && similarResults.results) {
          // Filter out the current video from results
          const filteredResults = similarResults.results
            .filter(r => r.metadata?.indexed_asset_id !== point.indexed_asset_id)
            .slice(0, 3);
          
          setSelectedVideo(prev => prev ? { 
            ...prev, 
            similarVideos: filteredResults.map(r => ({
              doc_id: r.doc_id,
              distance: r.distance,
              metadata: r.metadata
            }))
          } : null);
        }
      } catch (error) {
        console.error('Error fetching similar videos:', error);
      }
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery.trim());
    }
  }, [searchQuery, searchMutation]);

  const handleRefresh = useCallback(() => {
    refetchClusters();
    toast.success('Refreshing clusters...');
  }, [refetchClusters]);

  const points = (clusterData as DimensionalityReductionResponse)?.points || [];
  const error = clusterError ? String(clusterError) : (clusterData as DimensionalityReductionResponse)?.error;

  return (
    <div className="flex flex-col h-full">
      {/* Header Controls */}
      {/* <div className="p-4 bg-surface border-b border-border space-y-4"> */}

        {/* Search and Controls */}
        {/* <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              placeholder="Search videos by keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-3 py-2 bg-background border border-border text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSearch}
              disabled={searchMutation.isPending || !searchQuery.trim()}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-background hover:bg-surface hover:border-primary text-foreground transition-all flex items-center justify-center gap-2 group"            title="Refresh 3D visualization (MDS k-nn)"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoadingClusters}
            className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-background hover:bg-surface hover:border-primary text-foreground transition-all flex items-center justify-center gap-2 group"            title="Refresh 3D visualization (MDS k-nn)"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingClusters ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div> */}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* 3D Visualization */}
        <div className="flex-1 min-h-0 h-64 lg:h-auto">
          <VideoCluster3D
            points={points}
            loading={isLoadingClusters}
            error={error}
            onPointSelect={handlePointSelect}
          />
        </div>

        {/* Side Panel for Selected Video - Mobile: Bottom panel, Desktop: Right sidebar */}
        <div className="w-full lg:w-80 bg-surface border-t lg:border-t-0 lg:border-l border-border p-4 overflow-y-auto max-h-96 lg:max-h-none">
          {selectedVideo ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Selected Video</h3>
              
              <div className="bg-card p-3 rounded-md border border-border">
                <div className="text-sm space-y-2">
                  <div>
                    <div className="font-medium text-foreground">Keywords ({selectedVideo.point.keywords && selectedVideo.point.keywords.length > 0 ? selectedVideo.point.keywords.length : 0})</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedVideo.point.keywords && selectedVideo.point.keywords.length > 0 && selectedVideo.point.keywords.slice(0, expandedKeywords ? undefined : 10).map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-iris/20 text-iris text-xs rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                      {selectedVideo.point.keywords && selectedVideo.point.keywords.length > 10 && (
                        <button
                          onClick={() => setExpandedKeywords(!expandedKeywords)}
                          className="px-2 py-1 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs rounded-full transition-colors cursor-pointer"
                        >
                          {expandedKeywords ? 'Show less' : `+${selectedVideo.point.keywords.length - 10} more`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {selectedVideo.videoUrl && (
                <div className="bg-card p-3 rounded-md border border-border">
                  <div className="font-medium text-foreground mb-2">Video Player</div>
                  <video
                    controls
                    className="w-full rounded"
                    style={{ maxHeight: '200px' }}
                  >
                    <source src={selectedVideo.videoUrl} type="application/x-mpegURL" />
                    Your browser does not support HLS video playback.
                  </video>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center text-muted-foreground mt-8">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Click on a video sphere in the 3D view to see details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}