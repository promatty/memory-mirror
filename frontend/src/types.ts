export type UploadVideoResponse = {
  status: string;
  hlsObject: HLSObject;
  indexed_asset_id: string;
  analysis_text: string;
};

export type GetVideoResponse = {
  hlsObject: HLSObject;
};

type HLSObject = {
  video_url: string;
  thumbnail_url: string;
  status: string;
  updated_at: string;
};
