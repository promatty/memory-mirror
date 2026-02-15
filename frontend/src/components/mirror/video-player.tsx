"use client";

import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  videoUrl: string | null;
  isPlaying: boolean;
  onPlayStateChange: (isPlaying: boolean) => void;
}

export function VideoPlayer({
  videoUrl,
  isPlaying,
  onPlayStateChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.play().catch(console.error);
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full max-w-4xl aspect-video rounded-2xl border border-border bg-surface overflow-hidden shadow-lg">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            onPlay={() => onPlayStateChange(true)}
            onPause={() => onPlayStateChange(false)}
            onEnded={() => onPlayStateChange(false)}
            loop
            controls
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <div className="text-6xl mb-4">video here</div>
              <p className="text-lg font-medium">video / additional</p>
              <p className="text-sm">Video content will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
