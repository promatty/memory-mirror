import { pgTable, unique, integer, varchar, index, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const videos = pgTable(
  "videos",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity({
      name: "videos_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    indexedAssetId: varchar({ length: 255 }).notNull(),
    url: varchar({ length: 2048 }).notNull(),
    analysisText: varchar({ length: 65535 }).notNull(),
  },
  (table) => [
    unique("videos_indexed_asset_id").on(table.indexedAssetId),
    index("videos_indexed_asset_id_idx").on(table.indexedAssetId),
  ],
);

export const conversations = pgTable(
  "conversations",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity({
      name: "conversations_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    userPrompt: text("user_prompt").notNull(),
    videoId: varchar("video_id", { length: 255 }).notNull(),
    narrative: text().notNull(),
    audioBase64: text("audio_base64").notNull(),
    alignment: jsonb("alignment"), // Word-level timing data from ElevenLabs
    thumbnailUrl: varchar("thumbnail_url", { length: 2048 }),
    videoUrl: varchar("video_url", { length: 2048 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("conversations_created_at_idx").on(table.createdAt),
    index("conversations_video_id_idx").on(table.videoId),
  ],
);
