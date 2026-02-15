"use server";

import { db } from "@/db";
import { conversations } from "@/db/schema";
import { desc, sql, or, ilike } from "drizzle-orm";

export interface ConversationHistoryItem {
  id: number;
  userPrompt: string;
  videoId: string;
  narrative: string;
  audioBase64: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  createdAt: Date;
}

export interface GetConversationHistoryInput {
  limit?: number;
  offset?: number;
  searchQuery?: string;
}

export interface GetConversationHistoryResult {
  success: boolean;
  data?: ConversationHistoryItem[];
  total?: number;
  error?: string;
}

/**
 * Get conversation history with pagination and search
 */
export async function getConversationHistory(
  input: GetConversationHistoryInput = {}
): Promise<GetConversationHistoryResult> {
  try {
    const { limit = 10, offset = 0, searchQuery } = input;

    // Build query with optional search
    let query = db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.createdAt))
      .limit(limit)
      .offset(offset);

    // Add search filter if provided
    if (searchQuery && searchQuery.trim()) {
      query = query.where(
        or(
          ilike(conversations.userPrompt, `%${searchQuery}%`),
          ilike(conversations.narrative, `%${searchQuery}%`)
        )
      ) as any;
    }

    const results = await query;

    // Get total count for pagination
    const countQuery = searchQuery
      ? db
        .select({ count: sql<number>`count(*)` })
        .from(conversations)
        .where(
          or(
            ilike(conversations.userPrompt, `%${searchQuery}%`),
            ilike(conversations.narrative, `%${searchQuery}%`)
          )
        )
      : db.select({ count: sql<number>`count(*)` }).from(conversations);

    const [{ count }] = await countQuery;

    return {
      success: true,
      data: results as ConversationHistoryItem[],
      total: Number(count),
    };
  } catch (error) {
    console.error("Error fetching conversation history:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch history",
    };
  }
}

/**
 * Delete a conversation by ID
 */
export async function deleteConversation(
  conversationId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(conversations).where(sql`${conversations.id} = ${conversationId}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete conversation",
    };
  }
}

/**
 * Export conversation as JSON
 */
export async function exportConversation(
  conversationId: number
): Promise<{ success: boolean; data?: ConversationHistoryItem; error?: string }> {
  try {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(sql`${conversations.id} = ${conversationId}`)
      .limit(1);

    if (!conversation) {
      return {
        success: false,
        error: "Conversation not found",
      };
    }

    return {
      success: true,
      data: conversation as ConversationHistoryItem,
    };
  } catch (error) {
    console.error("Error exporting conversation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export conversation",
    };
  }
}

/**
 * Get a single conversation by ID
 */
export async function getConversationById(
  conversationId: number
): Promise<{ success: boolean; data?: ConversationHistoryItem; error?: string }> {
  try {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(sql`${conversations.id} = ${conversationId}`)
      .limit(1);

    if (!conversation) {
      return {
        success: false,
        error: "Conversation not found",
      };
    }

    return {
      success: true,
      data: conversation as ConversationHistoryItem,
    };
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch conversation",
    };
  }
}

