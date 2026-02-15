import {
  getVideoIfExists,
  insertVideoIntoDbIfNotExists,
} from "@/app/lib/helpers";
import { GetVideoResponse, UploadVideoResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";

type GenericNextError = {
  status: string;
  error: string;
};

export async function GET(request: NextRequest) {
  const body = await request.json();

  const baseUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
  const apiPrefix = process.env.BACKEND_API_PREFIX ?? "/api";

  try {
    const response = await fetch(
      `${baseUrl}${apiPrefix}/twelvelabs/get-video`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          indexed_asset_id: body.indexed_asset_id,
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          status: response.status.toString(),
          error: `HTTP ${response.status}`,
        } satisfies GenericNextError,
        { status: 502 },
      );
    }

    const data = (await response.json()) as GetVideoResponse;

    return NextResponse.json(
      {
        hlsObject: data.hlsObject,
      } satisfies GetVideoResponse,
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      } satisfies GenericNextError,
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const baseUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
  const apiPrefix = process.env.BACKEND_API_PREFIX ?? "/api";

  try {
    const response = await fetch(
      `${baseUrl}${apiPrefix}/twelvelabs/upload-video`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          video_path: body.video_path,
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          status: response.status.toString(),
          error: `HTTP ${response.status}`,
        } satisfies GenericNextError,
        { status: 502 },
      );
    }

    const data = (await response.json()) as UploadVideoResponse;

    const existingVideo = await getVideoIfExists(data.indexed_asset_id);

    if (!existingVideo) {
      const insertResult = await insertVideoIntoDbIfNotExists(
        data.analysis_text,
        data.indexed_asset_id,
        data.hlsObject.video_url,
      );

      if (!insertResult.success) {
        console.warn("Failed to insert video into DB");
      }
    }

    return NextResponse.json(
      {
        status: response.status.toString(),
        analysis_text: data.analysis_text,
        hlsObject: data.hlsObject,
        indexed_asset_id: data.indexed_asset_id,
      } satisfies UploadVideoResponse,
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      } satisfies GenericNextError,
      { status: 502 },
    );
  }
}
