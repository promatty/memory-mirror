// Type definitions for Memory Mirror conversation flow

export interface QueryMemoryRequest {
  userPrompt: string;
}

export interface QueryMemoryResponse {
  success: boolean;
  videoUrl?: string;
  audioBase64?: string;
  narrative?: string;
  message?: string;
}

export interface TwelveLabsSearchResult {
  id: string;
  confidence: number;
  start: number;
  end: number;
  metadata?: Record<string, unknown>;
  video_id: string;
}

export interface TwelveLabsSearchResponse {
  data: TwelveLabsSearchResult[];
  page_info?: {
    limit_per_page: number;
    page: number;
    total_page: number;
    total_results: number;
  };
}

export interface VideoData {
  id: number;
  indexedAssetId: string;
  url: string;
  analysisText: string;
}

