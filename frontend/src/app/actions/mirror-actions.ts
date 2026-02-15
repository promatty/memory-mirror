"use server";

import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { searchVideos, queryMemoryService } from "@/services/memory-service";
import type { QueryMemoryResponse } from "@/types/memory";

export interface QueryMemoryInput {
  userPrompt: string;
}

export interface QueryMemoryResult {
  success: boolean;
  data?: QueryMemoryResponse;
  error?: string;
}

/**
 * Server action to query user's memories
 *
 * Flow:
 * 1. Search for matching videos via Python backend (Twelve Labs)
 * 2. Query database for video metadata using indexedAssetId
 * 3. Call Python backend to generate narrative + audio (LLM + ElevenLabs)
 * 4. Return video URL, audio, and narrative
 */
export async function queryMemory(
  input: QueryMemoryInput,
): Promise<QueryMemoryResult> {
  try {
    const { userPrompt } = input;

    // Step 1: Search for matching videos via Python backend
    const searchResults = await searchVideos(userPrompt, [
      "visual",
      "transcription",
    ]);

    if (!searchResults.result) {
      return {
        success: false,
        error: "No matching memory found",
      };
    }

    const videoId = searchResults.result.video_id;

    // Step 2: Query database for analysisText using indexedAssetId
    // TODO: Replace with actual database query once DATABASE_URL is configured
    let dbVideo;
    try {
      console.log(
        "Querying database for video metadata with indexedAssetId:",
        videoId,
      );
      dbVideo = await db.query.videos.findFirst({
        where: eq(videos.indexedAssetId, videoId),
      });
    } catch (dbError) {
      console.warn("Database query failed, using mock data:", dbError);
      // Use mock data if database is not configured
      dbVideo = {
        id: 1,
        indexedAssetId: videoId,
        url: "",
        analysisText: "This is a video from your memories.",
      };
    }

    if (!dbVideo) {
      return {
        success: false,
        error: "Video data not found in database",
      };
    }

    // Step 3: Call Python backend to generate narrative + audio
    const result = await queryMemoryService({
      userPrompt,
      indexedAssetId: dbVideo.indexedAssetId,
      analysisText: dbVideo.analysisText,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.message || "Failed to generate response",
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error in queryMemory server action:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to query memory",
    };
  }
}
