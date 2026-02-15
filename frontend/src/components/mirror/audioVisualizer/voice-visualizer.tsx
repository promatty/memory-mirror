"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Play, Pause } from "lucide-react";
import { useAudioAnalyzer } from "@/hooks/use-audio-analyzer";

const VisualizerScene = dynamic(
  () =>
    import("src/components/mirror/audioVisualizer/visualizer-scene").then(
      (mod) => ({
        default: mod.VisualizerScene,
      }),
    ),
  { ssr: false },
);

interface VoiceVisualizerProps {
  /** Audio element to visualize (instead of creating a new one) */
  audioElement?: HTMLAudioElement | null;
  /** Optional CSS class for the container */
  className?: string;
}

export function VoiceVisualizer({ audioElement, className }: VoiceVisualizerProps) {
  const {
    isPlaying,
    frequencyData,
    averageFrequency,
    bassFrequency,
    midFrequency,
    trebleFrequency,
    fileName,
    connectToAudioElement,
    togglePlayPause,
  } = useAudioAnalyzer();

  useEffect(() => {
    if (!audioElement) return;
    connectToAudioElement(audioElement);
  }, [audioElement, connectToAudioElement]);

  return (
    <div className={`relative w-full h-full min-h-0 ${className ?? ""}`}>
      <VisualizerScene
        bassFrequency={bassFrequency}
        midFrequency={midFrequency}
        trebleFrequency={trebleFrequency}
        averageFrequency={averageFrequency}
        frequencyData={frequencyData}
        isPlaying={isPlaying}
      />

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-3">
          {fileName ? (
            <>
              <button
                onClick={onToggleClick}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-foreground/90 text-background backdrop-blur-xl transition-all hover:bg-foreground hover:scale-110 active:scale-95"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
            </>
          ) : (
            <div className="px-4 py-2.5 rounded-full bg-foreground/10 text-foreground text-xs font-sans">
              No audio loaded
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function onToggleClick() {
    togglePlayPause();
  }
}
