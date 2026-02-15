"use client";

import { useCallback, useRef, useState } from "react";

export interface AudioAnalyzerState {
  isPlaying: boolean;
  frequencyData: Uint8Array;
  averageFrequency: number;
  bassFrequency: number;
  midFrequency: number;
  trebleFrequency: number;
  fileName: string | null;
}

export function useAudioAnalyzer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number>(0);
  const dataArrayRef = useRef<Uint8Array>(new Uint8Array(128));
  const smoothBassRef = useRef(0);
  const smoothMidRef = useRef(0);
  const smoothTrebleRef = useRef(0);
  const smoothAvgRef = useRef(0);

  const [state, setState] = useState<AudioAnalyzerState>({
    isPlaying: false,
    frequencyData: new Uint8Array(128),
    averageFrequency: 0,
    bassFrequency: 0,
    midFrequency: 0,
    trebleFrequency: 0,
    fileName: null,
  });

  const getFrequencyRanges = useCallback(
    (dataArray: Uint8Array, sampleRate: number) => {
      const len = dataArray.length;
      const binWidth = sampleRate / 2 / len;

      const bassStart = Math.max(0, Math.floor(80 / binWidth));
      const bassEnd = Math.floor(500 / binWidth);
      const midEnd = Math.floor(4000 / binWidth);
      const trebleEnd = Math.min(len - 1, Math.floor(8000 / binWidth));

      let bassSum = 0,
        bassCount = 0;
      let midSum = 0,
        midCount = 0;
      let trebleSum = 0,
        trebleCount = 0;
      let totalSum = 0;

      for (let i = 0; i < len; i++) {
        totalSum += dataArray[i];
        if (i >= bassStart && i < bassEnd) {
          bassSum += dataArray[i];
          bassCount++;
        } else if (i >= bassEnd && i < midEnd) {
          midSum += dataArray[i];
          midCount++;
        } else if (i >= midEnd && i <= trebleEnd) {
          trebleSum += dataArray[i];
          trebleCount++;
        }
      }

      const rawBass = bassCount > 0 ? bassSum / bassCount / 255 : 0;
      const rawMid = midCount > 0 ? midSum / midCount / 255 : 0;
      const rawTreble = trebleCount > 0 ? trebleSum / trebleCount / 255 : 0;
      const rawAvg = totalSum / len / 255;

      const smoothing = 0.7;
      smoothBassRef.current =
        smoothBassRef.current * smoothing + rawBass * (1 - smoothing);
      smoothMidRef.current =
        smoothMidRef.current * smoothing + rawMid * (1 - smoothing);
      smoothTrebleRef.current =
        smoothTrebleRef.current * smoothing + rawTreble * (1 - smoothing);
      smoothAvgRef.current =
        smoothAvgRef.current * smoothing + rawAvg * (1 - smoothing);

      return {
        averageFrequency: smoothAvgRef.current,
        bassFrequency: smoothBassRef.current,
        midFrequency: smoothMidRef.current,
        trebleFrequency: smoothTrebleRef.current,
      };
    },
    [],
  );

  const updateFrequencyData = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    const ranges = getFrequencyRanges(
      dataArrayRef.current,
      audioContextRef.current.sampleRate,
    );

    setState((prev) => ({
      ...prev,
      frequencyData: new Uint8Array(dataArrayRef.current),
      ...ranges,
    }));

    animationFrameRef.current = requestAnimationFrame(updateFrequencyData);
  }, [getFrequencyRanges]);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.75;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    }
  }, []);

  const stopCurrent = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.remove();
      audioElementRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const connectAndPlay = useCallback(
    (audio: HTMLAudioElement, name: string) => {
      initAudio();
      stopCurrent();

      audioElementRef.current = audio;

      audio.addEventListener(
        "canplaythrough",
        () => {
          if (!audioContextRef.current || !analyserRef.current) return;

          if (audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume();
          }

          sourceRef.current =
            audioContextRef.current.createMediaElementSource(audio);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);

          audio.play();
          setState((prev) => ({
            ...prev,
            isPlaying: true,
            fileName: name,
          }));
          updateFrequencyData();
        },
        { once: true },
      );

      audio.addEventListener("ended", () => {
        setState((prev) => ({ ...prev, isPlaying: false }));
        cancelAnimationFrame(animationFrameRef.current);
      });
    },
    [initAudio, stopCurrent, updateFrequencyData],
  );

  const loadAudioFile = useCallback(
    (file: File) => {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = URL.createObjectURL(file);
      connectAndPlay(audio, file.name);
    },
    [connectAndPlay],
  );

  const loadAudioFromUrl = useCallback(
    (url: string) => {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = url;
      const name = url.split("/").pop()?.split("?")[0] || "Audio";
      connectAndPlay(audio, name);
    },
    [connectAndPlay],
  );

  const togglePlayPause = useCallback(() => {
    if (!audioElementRef.current) return;

    if (audioElementRef.current.paused) {
      audioContextRef.current?.resume();
      audioElementRef.current.play();
      setState((prev) => ({ ...prev, isPlaying: true }));
      updateFrequencyData();
    } else {
      audioElementRef.current.pause();
      setState((prev) => ({ ...prev, isPlaying: false }));
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [updateFrequencyData]);

  return {
    ...state,
    loadAudioFile,
    loadAudioFromUrl,
    togglePlayPause,
  };
}
