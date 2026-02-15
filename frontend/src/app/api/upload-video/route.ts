import {
  getVideoIfExists,
  insertVideoIntoDbIfNotExists,
} from "@/app/lib/helpers";
import { NextResponse } from "next/server";

const backendBaseUrl = process.env.BACKEND_BASE_URL || "http://127.0.0.1:8000";

// Proxy the upload to backend /upload-video endpoint
export async function POST(request: Request) {
  // Get the form data from the request
  const formData = await request.formData();
  // Prepare a new FormData to send to backend
  const backendForm = new FormData();
  for (const [key, value] of formData.entries()) {
    backendForm.append(key, value);
  }

  // Send to backend using env variable
  const backendRes = await fetch(
    `${backendBaseUrl}/api/twelvelabs/upload-video`,
    {
      method: "POST",
      body: backendForm,
    },
  );

  const data = await backendRes.json();

  const existingVideo = await getVideoIfExists(data.indexed_asset_id);

  if (!existingVideo) {
      // Defensive: handle missing hlsObject or video_url
      const videoUrl = data?.hlsObject?.video_url || null;
      const insertResult = await insertVideoIntoDbIfNotExists(
        data.analysis_text,
        data.indexed_asset_id,
        videoUrl,
      );

    if (!insertResult.success) {
      console.warn("Failed to insert video into DB");
    }
  }

  return NextResponse.json(data, { status: backendRes.status });
}
