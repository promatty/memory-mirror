"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import ReactPlayer from "react-player";

export default function DebugPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const searchParams = useSearchParams();

  const handleCheck = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/", {
        cache: "no-store",
        body: JSON.stringify({
          video_path: "/public/downtown.mp4",
        }),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setVideoUrl(data.hlsObject.video_url);
      setIsLoading(false);
      console.log(data);
    } catch (error) {
      console.error("Error fetching API data:", error);
      setIsLoading(false);
    }
  };

  const handleGetVideo = async () => {
    setIsLoading(true);
    try {
      const indexedAssetId = "699152f441a8303306571b49";

      const response = await fetch(
        `http://localhost:8000/api/twelvelabs/get-video`,
        {
          cache: "no-store",
          method: "POST",
          body: JSON.stringify({
            indexed_asset_id: indexedAssetId,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();
      setIsLoading(false);
      console.log(data);
    } catch (error) {
      console.error("Error fetching API data:", error);
      setIsLoading(false);
    }
  };

  console.log(videoUrl && !isLoading);

  return (
    <div style={{ padding: 20 }}>
      <h1>Debug Page</h1>

      <button type="button" onClick={handleCheck} disabled={isLoading}>
        {isLoading ? "Uploading..." : "Uploading video to backend"}
      </button>

      <button type="button" onClick={handleGetVideo} disabled={isLoading}>
        {isLoading ? "Getting video..." : "Getting video from backend"}
      </button>

      {videoUrl && !isLoading && (
        <div style={{ height: "100vh" }}>
          <ReactPlayer
            key={videoUrl}
            src={videoUrl}
            playing
            muted
            controls
            width="100%"
            height="100%"
          />
        </div>
      )}
    </div>
  );
}
