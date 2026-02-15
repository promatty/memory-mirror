"use client";

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { Play, Pause, Copy, Check } from "lucide-react";
import type { AlignmentData } from "@/types/memory";

interface TranscriptViewerProps {
  text: string;
  audioSrc: string | null;
  alignment: AlignmentData | null;
  isPlaying: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  onAudioElementReady?: (element: HTMLAudioElement | null) => void;
}

export interface TranscriptViewerRef {
  audioElement: HTMLAudioElement | null;
}

interface WordSegment {
  word: string;
  startTime: number;
  endTime: number;
  index: number;
}

export const TranscriptViewer = forwardRef<TranscriptViewerRef, TranscriptViewerProps>(
  function TranscriptViewer(
    {
      text,
      audioSrc,
      alignment,
      isPlaying,
      onPlayStateChange,
      onAudioElementReady,
    }: TranscriptViewerProps,
    ref
  ) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [copied, setCopied] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose audio element to parent via ref
    useImperativeHandle(ref, () => ({
      audioElement: audioRef.current,
    }));

    // Notify parent when audio element is ready
    useEffect(() => {
      if (audioRef.current && onAudioElementReady) {
        onAudioElementReady(audioRef.current);
      }
      return () => {
        if (onAudioElementReady) {
          onAudioElementReady(null);
        }
      };
    }, [audioSrc, onAudioElementReady]);

  // Parse alignment data into word segments
  const wordSegments = useCallback((): WordSegment[] => {
    if (!alignment) {
      // Fallback: split text into words without timing
      return text.split(/\s+/).map((word, index) => ({
        word,
        startTime: 0,
        endTime: 0,
        index,
      }));
    }

    // Prefer word-level timing if available (from forced alignment)
    if (alignment.words && alignment.words.length > 0) {
      return alignment.words.map((word, index) => ({
        word: word.text,
        startTime: word.start,
        endTime: word.end,
        index,
      }));
    }

    // Fallback to character-level timing
    if (!alignment.characters || alignment.characters.length === 0) {
      return text.split(/\s+/).map((word, index) => ({
        word,
        startTime: 0,
        endTime: 0,
        index,
      }));
    }

    const words: WordSegment[] = [];
    let currentWord = "";
    let wordStartTime = 0;
    let wordIndex = 0;

    alignment.characters.forEach((char, i) => {
      const startTimeMs = alignment.character_start_times_ms[i];
      const endTimeMs = alignment.character_end_times_ms[i];

      if (char === " " || char === "\n") {
        if (currentWord.trim()) {
          words.push({
            word: currentWord.trim(),
            startTime: wordStartTime / 1000, // Convert ms to seconds
            endTime: endTimeMs / 1000,
            index: wordIndex++,
          });
          currentWord = "";
        }
      } else {
        if (currentWord === "") {
          wordStartTime = startTimeMs;
        }
        currentWord += char;
      }
    });

    // Add last word
    if (currentWord.trim()) {
      const lastEndTime = alignment.character_end_times_ms[alignment.characters.length - 1];
      words.push({
        word: currentWord.trim(),
        startTime: wordStartTime / 1000,
        endTime: lastEndTime / 1000,
        index: wordIndex,
      });
    }

    return words;
  }, [alignment, text]);

  const words = wordSegments();

  // Update current word based on playback time
  useEffect(() => {
    if (!alignment) return;

    const currentIndex = words.findIndex(
      (word) => currentTime >= word.startTime && currentTime < word.endTime
    );
    setCurrentWordIndex(currentIndex);
  }, [currentTime, words, alignment]);

  // Sync audio playback with isPlaying prop
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Handle time updates
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      onPlayStateChange?.(!isPlaying);
    }
  };

  const handleWordClick = (word: WordSegment) => {
    if (audioRef.current && alignment) {
      audioRef.current.currentTime = word.startTime;
      if (!isPlaying) {
        audioRef.current.play().catch(console.error);
        onPlayStateChange?.(true);
      }
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!text) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Transcript will appear here during playback...
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Hidden audio element */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => onPlayStateChange?.(false)}
        />
      )}

      {/* Header with controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          transcript
        </h3>
        <div className="flex items-center gap-2">
          {alignment && (
            <button
              onClick={handlePlayPause}
              className="p-2 rounded-lg hover:bg-surface transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-surface transition-colors"
            aria-label="Copy transcript"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Transcript content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 rounded-lg border border-border bg-background"
      >
        <div className="text-sm leading-relaxed">
          {words.map((word, index) => {
            const isCurrent = index === currentWordIndex;
            const isSpoken = alignment && currentTime > word.endTime;
            const isClickable = alignment && word.startTime > 0;

            return (
              <span
                key={index}
                onClick={() => isClickable && handleWordClick(word)}
                className={`
                  inline-block mr-1 transition-all duration-200
                  ${isCurrent ? "text-primary font-semibold scale-110" : ""}
                  ${isSpoken && !isCurrent ? "text-muted-foreground" : ""}
                  ${!isSpoken && !isCurrent ? "text-foreground" : ""}
                  ${isClickable ? "cursor-pointer hover:text-primary hover:underline" : ""}
                `}
              >
                {word.word}
              </span>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      {alignment && duration > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="h-1 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
});


