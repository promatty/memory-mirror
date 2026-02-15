"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ParticleSphere } from "@/components/mirror/audioVisualizer/particle-sphere";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useMemo } from "react";

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
      style={{
        background: "radial-gradient(circle at 30% 30%, #0f172a, #020617)",
      }}
    >
      <Particles />
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

function Particles() {
  const ref = useRef<THREE.Points>(null!);

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return positions;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    ref.current.rotation.x = time * 0.02;
    ref.current.rotation.y = time * 0.03;
  });

  return (
    <Points ref={ref} positions={particlesPosition} stride={3}>
      <PointMaterial
        transparent
        color="#7dd3fc"
        size={0.03}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  );
}
