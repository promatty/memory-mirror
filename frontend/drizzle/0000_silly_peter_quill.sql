CREATE TABLE "videos" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "videos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"indexedAssetId" varchar(255) NOT NULL,
	"url" varchar(2048) NOT NULL,
	"analysisText" varchar(65535) NOT NULL,
	CONSTRAINT "videos_indexed_asset_id" UNIQUE("indexedAssetId")
);
--> statement-breakpoint
CREATE INDEX "videos_indexed_asset_id_idx" ON "videos" USING btree ("indexedAssetId");