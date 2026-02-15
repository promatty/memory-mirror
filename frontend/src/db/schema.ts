import { pgTable, unique, integer, varchar, index } from "drizzle-orm/pg-core";

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
