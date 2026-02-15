"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleSphereProps {
  bassFrequency: number;
  midFrequency: number;
  trebleFrequency: number;
  averageFrequency: number;
  frequencyData: Uint8Array;
  isPlaying: boolean;
}

interface SphereLayerProps {
  particleCount: number;
  baseRadius: number;
  frequency: number;
  averageFrequency: number;
  frequencyData: Uint8Array;
  isPlaying: boolean;
  color: [number, number, number];
  baseOpacity: number;
  baseSize: number;
  displacementScale: number;
  rotationSpeed: number;
  rotationDirection: number;
}

function SphereLayer({
  particleCount,
  baseRadius,
  frequency,
  averageFrequency,
  frequencyData,
  isPlaying,
  color,
  baseOpacity,
  baseSize,
  displacementScale,
  rotationSpeed,
  rotationDirection,
}: SphereLayerProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);
  const smoothedFreqRef = useRef(0);
  const smoothedAvgRef = useRef(0);

  const { positions, originalPositions, sizes, freqIndices } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const origPos = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);
    const fIdx = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / particleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      const x = Math.sin(phi) * Math.cos(theta) * baseRadius;
      const y = Math.sin(phi) * Math.sin(theta) * baseRadius;
      const z = Math.cos(phi) * baseRadius;

      const idx = i * 3;
      pos[idx] = x;
      pos[idx + 1] = y;
      pos[idx + 2] = z;
      origPos[idx] = x;
      origPos[idx + 1] = y;
      origPos[idx + 2] = z;

      sz[i] = baseSize * (0.85 + Math.random() * 0.3);
      fIdx[i] = Math.floor((phi / Math.PI) * (frequencyData.length - 1));
    }

    return {
      positions: pos,
      originalPositions: origPos,
      sizes: sz,
      freqIndices: fIdx,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vertexShader = `
    attribute float size;
    varying float vAlpha;
    uniform float uFreq;
    uniform float uBaseOpacity;

    void main() {
      vAlpha = uBaseOpacity + uFreq * (1.0 - uBaseOpacity) * 0.5;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (80.0 / -mvPosition.z) * (0.9 + uFreq * 0.25);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying float vAlpha;
    uniform vec3 uColor;

    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.3) discard;

      float circle = 1.0 - smoothstep(0.0, 0.3, dist);
      circle = pow(circle, 5.0);

      gl_FragColor = vec4(uColor, circle * vAlpha);
    }
  `;

  const uniforms = useMemo(
    () => ({
      uFreq: { value: 0 },
      uColor: { value: new THREE.Vector3(color[0], color[1], color[2]) },
      uBaseOpacity: { value: baseOpacity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!pointsRef.current || !materialRef.current) return;

    const geometry = pointsRef.current.geometry;
    const positionAttr = geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const sizeAttr = geometry.getAttribute("size") as THREE.BufferAttribute;
    const pos = positionAttr.array as Float32Array;
    const sizesArr = sizeAttr.array as Float32Array;

    // Smooth the frequency values - ramp up fast, decay slowly
    const lerpUp = 1 - Math.pow(0.001, delta);
    const lerpDown = 1 - Math.pow(0.05, delta);

    const targetFreq = isPlaying ? frequency : 0;
    const targetAvg = isPlaying ? averageFrequency : 0;

    smoothedFreqRef.current +=
      (targetFreq - smoothedFreqRef.current) *
      (targetFreq > smoothedFreqRef.current ? lerpUp : lerpDown);
    smoothedAvgRef.current +=
      (targetAvg - smoothedAvgRef.current) *
      (targetAvg > smoothedAvgRef.current ? lerpUp : lerpDown);

    const sFreq = smoothedFreqRef.current;
    const sAvg = smoothedAvgRef.current;

    materialRef.current.uniforms.uFreq.value = sFreq;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const ox = originalPositions[idx];
      const oy = originalPositions[idx + 1];
      const oz = originalPositions[idx + 2];

      const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
      const nx = ox / len;
      const ny = oy / len;
      const nz = oz / len;

      const freqIdx = freqIndices[i];
      const freqValue = isPlaying
        ? frequencyData[Math.floor(freqIdx)] / 255 || 0
        : 0;

      // Audio-driven displacement (smoothly decays to 0 when paused)
      const directFreqEffect = freqValue * 0.5;
      const bandEffect = sFreq * displacementScale;
      const audioDisplacement = directFreqEffect + bandEffect;

      const breathe =
        Math.sin(timeRef.current * 1.2 + i * 0.003) * 0.03 * (1 + sFreq);
      const micro = Math.sin(timeRef.current * 3 + ox * 4) * 0.015 * sFreq;

      // Idle breathing (always present)
      const idle = Math.sin(timeRef.current * 0.4 + i * 0.008) * 0.06;

      // Blend: audio displacement + idle, audio portion fades out smoothly
      const totalDisplacement =
        audioDisplacement +
        breathe +
        micro +
        idle * (1 - Math.min(sFreq * 2, 1));

      pos[idx] = ox + nx * totalDisplacement;
      pos[idx + 1] = oy + ny * totalDisplacement;
      pos[idx + 2] = oz + nz * totalDisplacement;

      sizesArr[i] =
        baseSize *
        (0.85 + Math.random() * 0.15) *
        (1 + audioDisplacement * 0.12);
    }

    positionAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;

    pointsRef.current.rotation.y +=
      delta *
      rotationDirection *
      (rotationSpeed * 0.3 + sAvg * (rotationSpeed + 0.2));
    pointsRef.current.rotation.x =
      Math.sin(timeRef.current * 0.08) * 0.08 * rotationDirection;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

export function ParticleSphere({
  bassFrequency,
  midFrequency,
  trebleFrequency,
  averageFrequency,
  frequencyData,
  isPlaying,
}: ParticleSphereProps) {
  return (
    <group>
      {/* Inner - BASS: bright warm white */}
      <SphereLayer
        particleCount={1200}
        baseRadius={1.2}
        frequency={bassFrequency}
        averageFrequency={averageFrequency}
        frequencyData={frequencyData}
        isPlaying={isPlaying}
        color={[1.0, 0.97, 0.92]}
        baseOpacity={0.95}
        baseSize={1.8}
        displacementScale={1.0}
        rotationSpeed={0.08}
        rotationDirection={1}
      />

      {/* Middle - MID: cool white-blue */}
      <SphereLayer
        particleCount={2000}
        baseRadius={2.2}
        frequency={midFrequency}
        averageFrequency={averageFrequency}
        frequencyData={frequencyData}
        isPlaying={isPlaying}
        color={[0.78, 0.84, 0.94]}
        baseOpacity={0.6}
        baseSize={1.3}
        displacementScale={0.8}
        rotationSpeed={0.12}
        rotationDirection={-1}
      />

      {/* Outer - TREBLE: dim blue-gray */}
      <SphereLayer
        particleCount={2500}
        baseRadius={3.3}
        frequency={trebleFrequency}
        averageFrequency={averageFrequency}
        frequencyData={frequencyData}
        isPlaying={isPlaying}
        color={[0.5, 0.56, 0.7]}
        baseOpacity={0.3}
        baseSize={0.9}
        displacementScale={0.5}
        rotationSpeed={0.18}
        rotationDirection={1}
      />
    </group>
  );
}
