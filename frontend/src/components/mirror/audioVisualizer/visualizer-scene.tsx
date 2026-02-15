"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ParticleSphere } from "@/components/mirror/audioVisualizer/particle-sphere";

interface VisualizerSceneProps {
  bassFrequency: number;
  midFrequency: number;
  trebleFrequency: number;
  averageFrequency: number;
  frequencyData: Uint8Array;
  isPlaying: boolean;
}

export function VisualizerScene({
  bassFrequency,
  midFrequency,
  trebleFrequency,
  averageFrequency,
  frequencyData,
  isPlaying,
}: VisualizerSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 55 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      dpr={[1, 2]}
      style={{ background: "#050710" }}
    >
      <color attach="background" args={["#050710"]} />
      <fog attach="fog" args={["#050710", 18, 35]} />

      <ambientLight intensity={0.05} />

      <ParticleSphere
        bassFrequency={bassFrequency}
        midFrequency={midFrequency}
        trebleFrequency={trebleFrequency}
        averageFrequency={averageFrequency}
        frequencyData={frequencyData}
        isPlaying={isPlaying}
      />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={5}
        maxDistance={18}
        autoRotate={!isPlaying}
        autoRotateSpeed={0.2}
        enableDamping
        dampingFactor={0.05}
      />
    </Canvas>
  );
}
