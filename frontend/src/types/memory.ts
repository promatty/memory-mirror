// Type definitions for Memory Mirror conversation flow

export interface QueryMemoryRequest {
  userPrompt: string;
}

// ElevenLabs alignment data types
export interface AlignmentWord {
  text: string;
  start: number; // seconds
  end: number; // seconds
  confidence: number; // 0-1
}

export interface AlignmentData {
  characters: string[];
  character_start_times_ms: number[];
  character_end_times_ms: number[];
  words?: AlignmentWord[]; // Word-level timing from forced alignment
  confidence?: number; // Overall alignment confidence
}

export interface QueryMemoryResponse {
  success: boolean;
  videoUrl?: string;
  audioBase64?: string;
  narrative?: string;
  alignment?: AlignmentData;
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

