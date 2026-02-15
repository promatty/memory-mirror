import type { QueryMemoryResponse } from "@/types/memory";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
const API_PREFIX = process.env.NEXT_PUBLIC_BACKEND_API_PREFIX ?? "/api";

type SearchOption = "visual" | "audio" | "transcription";

interface SearchVideoRequest {
  query_text: string;
  search_options: SearchOption[];
}

interface SearchVideoResponse {
  status: number;
  result?: {
    video_id: string;
    confidence: number;
    score: number;
    start?: number;
    end?: number;
    thumbnail_url?: string;
    transcription?: string;
  };
  error?: string;
}

interface GenerateResponseRequest {
  user_prompt: string;
  indexed_asset_id: string;
  analysis_text: string;
}

interface GenerateResponseResponse {
  success: boolean;
  video_url?: string;
  audio_base64?: string;
  narrative?: string;
  message?: string;
  error?: string;
}

interface SuggestedQuestionsRequest {
  analysis_texts: string[];
}

interface SuggestedQuestionsResponse {
  questions: string[];
}

/**
 * Search for videos using Twelve Labs semantic search via Python backend
 */
export const searchVideos = async (
  query: string,
  options: SearchOption[] = ["visual", "transcription"],
): Promise<SearchVideoResponse> => {
  const response = await fetch(
    `${BACKEND_URL}${API_PREFIX}/twelvelabs/search_video`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query_text: query,
        search_options: options,
      } satisfies SearchVideoRequest),
    },
  );

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Generate AI response with narrative and audio via Python backend
 */
export const generateResponse = async (
  userPrompt: string,
  indexedAssetId: string,
  analysisText: string,
): Promise<GenerateResponseResponse> => {
  const response = await fetch(
    `${BACKEND_URL}${API_PREFIX}/conversation/generate-response`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_prompt: userPrompt,
        indexed_asset_id: indexedAssetId,
        analysis_text: analysisText,
      } satisfies GenerateResponseRequest),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Generate response failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

/**
 * Generate suggested questions from analysis texts via Python backend
 */
export const generateSuggestedQuestions = async (
  analysisTexts: string[],
): Promise<SuggestedQuestionsResponse> => {
  const response = await fetch(
    `${BACKEND_URL}${API_PREFIX}/conversation/suggest-questions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        analysis_texts: analysisTexts,
      } satisfies SuggestedQuestionsRequest),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Generate suggested questions failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

/**
 * Complete memory query flow:
 * 1. Search for matching videos
 * 2. Validate confidence score
 * 3. Generate response with narrative and audio
 */
export interface QueryMemoryRequest {
  userPrompt: string;
  indexedAssetId: string;
  analysisText: string;
}

export const queryMemoryService = async ({
  userPrompt,
  indexedAssetId,
  analysisText,
}: QueryMemoryRequest): Promise<QueryMemoryResponse> => {
  try {
    // Call Python backend to generate narrative + audio
    const responseData = await generateResponse(
      userPrompt,
      indexedAssetId,
      analysisText,
    );

    if (!responseData.success) {
      return {
        success: false,
        message: responseData.message || "Failed to generate response",
      };
    }

    return {
      success: true,
      videoUrl: responseData.video_url,
      audioBase64: responseData.audio_base64,
      narrative: responseData.narrative,
    };
  } catch (error) {
    console.error("Error in queryMemoryService:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      success: false,
      message: `Failed to query memory: ${errorMessage}`,
    };
  }
};
