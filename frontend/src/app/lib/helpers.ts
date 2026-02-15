import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getVideoIfExists(indexedAssetId: string) {
  try {
    const video = await db.query.videos.findFirst({
      where: eq(videos.indexedAssetId, indexedAssetId),
    });

    return video ?? null;
  } catch (err) {
    console.error("getVideoIfExists failed:", err);
    return null;
  }
}

export async function insertVideoIntoDbIfNotExists(
  analysisText: string,
  indexedAssetId: string,
  url: string,
) {
  try {
    await db
      .insert(videos)
      .values({
        analysisText: analysisText,
        indexedAssetId: indexedAssetId,
        url: url,
      })
      .onConflictDoNothing({ target: videos.indexedAssetId });

    return { success: true };
  } catch (err) {
    console.warn("insertVideoIntoDbIfNotExists failed (non-fatal):", err);
    return { success: false };
  }
}
