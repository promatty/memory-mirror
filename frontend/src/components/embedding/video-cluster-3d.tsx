"use client";

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface Point3D {
  x: number;
  y: number;
  z: number;
  indexed_asset_id: string;
  keywords: string[];
  metadata?: Record<string, unknown>;
}

// Particle Background Component
function ParticleSpace() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 5000;

  // Generate particles in concentric spherical patterns
  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Create multiple concentric spheres with varying density
      const layer = Math.floor(Math.random() * 4); // 4 layers
      const radius = 8 + layer * 6; // Layers at radius 8, 14, 20, 26
      
      // Spherical coordinates
      const phi = Math.acos(-1 + (2 * Math.random()));
      const theta = Math.sqrt(particleCount) * phi;
      
      // Convert to Cartesian with some randomness
      const randomRadius = radius + (Math.random() - 0.5) * 3;
      positions[i3] = randomRadius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = randomRadius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = randomRadius * Math.cos(phi);
    }
    
    return positions;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      // Slow rotation of the entire particle system
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <Points ref={particlesRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#4f92ff"
        size={0.02}
        sizeAttenuation={true}
        alphaTest={0.001}
        opacity={0.8}
      />
    </Points>
  );
}

// Inner Core Particles (denser center)
function CoreParticles() {
  const coreRef = useRef<THREE.Points>(null);
  const coreCount = 2000;

  const positions = useMemo(() => {
    const positions = new Float32Array(coreCount * 3);
    
    for (let i = 0; i < coreCount; i++) {
      const i3 = i * 3;
      
      // Dense core within radius 6
      const phi = Math.acos(-1 + (2 * Math.random()));
      const theta = Math.sqrt(coreCount) * phi;
      const radius = Math.random() * 6;
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
    }
    
    return positions;
  }, []);

  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.y = -state.clock.elapsedTime * 0.03;
      coreRef.current.rotation.z = state.clock.elapsedTime * 0.015;
    }
  });

  return (
    <Points ref={coreRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.015}
        sizeAttenuation={true}
        alphaTest={0.001}
        opacity={0.6}
      />
    </Points>
  );
}

interface VideoVectorProps {
  point: Point3D;
  isSelected: boolean;
  onSelect: (point: Point3D) => void;
  onHover: (point: Point3D | null) => void;
}

function VideoVector({ point, isSelected, onSelect, onHover }: VideoVectorProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Enhanced color scheme for the space aesthetic
  const color = useMemo(() => {
    const clusterColors = [
      '#00d4ff', // Cyan
      '#ff4081', // Pink
      '#ffa726', // Orange  
      '#ab47bc', // Purple
      '#42a5f5', // Blue
      '#66bb6a', // Green
      '#ff7043', // Deep orange
      '#26c6da', // Cyan
    ];
    
    const clusterId = point.metadata?.cluster_id ?? 0;
    const totalClusters = point.metadata?.total_clusters ?? 1;
    
    let baseColor = clusterColors[clusterId % clusterColors.length];
    
    if (totalClusters <= 1) {
      baseColor = '#00d4ff';
    }
    
    if (isSelected) {
      return '#ffffff';
    }
    
    if (hovered) {
      return '#ff4081';
    }
    
    return baseColor;
  }, [point.metadata, isSelected, hovered]);

  const targetScale = isSelected ? 2.0 : hovered ? 1.7 : 1.2;

  useFrame((state) => {
    if (meshRef.current) {
      // Pulsing glow effect
      const pulse = Math.sin(state.clock.elapsedTime * 2 + point.x) * 0.3 + 0.7;
      meshRef.current.material.emissiveIntensity = isSelected ? 0.8 : hovered ? 0.6 : 0.2 * pulse;
      
      // Gentle floating with more space-like movement
      meshRef.current.position.y = point.y + Math.sin(state.clock.elapsedTime * 0.5 + point.x) * 0.2;
      meshRef.current.position.x = point.x + Math.cos(state.clock.elapsedTime * 0.3 + point.z) * 0.1;
      
      // Smooth scale transition
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.05
      );
    }
  });

  return (
    <group position={[point.x, point.y, point.z]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(point);
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(point);
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={(e) => {
          e.stopPropagation();
          setHovered(false);
          onHover(null);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.8 : hovered ? 0.6 : 0.2}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={isSelected ? 1.0 : hovered ? 0.9 : 0.7}
        />
      </mesh>
      
      {/* Glowing ring around selected/hovered videos */}
      {(isSelected || hovered) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.15, 0.18, 32]} />
          <meshBasicMaterial 
            color={isSelected ? '#ffffff' : '#ff4081'}
            transparent
            opacity={isSelected ? 0.8 : 0.6}
          />
        </mesh>
      )}
      
      {/* Hover info */}
      {hovered && (
        <Html position={[0, 0.4, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-black/95 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-2xl max-w-xs border border-cyan-500/30 animate-in fade-in duration-300">
            <div className="font-semibold text-sm mb-2 text-cyan-300">
              🎬 Memory Vector
            </div>
            <div className="text-xs text-gray-200 mb-2">
              ID: {point.indexed_asset_id.slice(0, 8)}...
            </div>
            <div className="text-xs text-gray-300 mb-2">
              🏷️ {point.keywords && point.keywords.length > 0 ? point.keywords.slice(0, 3).join(', ') : 'No keywords'}
              {point.keywords && point.keywords.length > 3 && ` +${point.keywords.length - 3} more`}
            </div>
            <div className="text-xs text-cyan-400 italic">Click to explore memory</div>
          </div>
        </Html>
      )}
    </group>
  );
}

interface VideoClusterProps {
  points: Point3D[];
  onPointSelect?: (point: Point3D) => void;
}

function VideoCluster({ points, onPointSelect }: VideoClusterProps) {
  const [selectedPoint, setSelectedPoint] = useState<Point3D | null>(null);

  const handlePointSelect = (point: Point3D) => {
    setSelectedPoint(point);
    onPointSelect?.(point);
  };

  // Scale and center the points for the space aesthetic
  const normalizedPoints = useMemo(() => {
    if (!points || points.length === 0) return [];

    // Find bounds
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const zs = points.map(p => p.z);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    
    // Scale to fit within the inner sphere (radius ~4-5)
    const scale = 8 / Math.max(maxX - minX, maxY - minY, maxZ - minZ);
    
    return points.map(point => ({
      ...point,
      x: (point.x - (minX + maxX) / 2) * scale,
      y: (point.y - (minY + maxY) / 2) * scale,
      z: (point.z - (minZ + maxZ) / 2) * scale,
    }));
  }, [points]);

  return (
    <>
      {/* Ambient lighting for space atmosphere */}
      <ambientLight intensity={0.3} color="#0066cc" />
      
      {/* Key lighting from multiple angles */}
      <pointLight position={[15, 15, 15]} intensity={0.8} color="#00d4ff" />
      <pointLight position={[-15, -15, -15]} intensity={0.4} color="#4f92ff" />
      <pointLight position={[10, -10, 10]} intensity={0.3} color="#ffffff" />
      
      {/* Particle background layers */}
      <ParticleSpace />
      <CoreParticles />
      
      {/* Video vectors (memory points) */}
      {normalizedPoints.map((point) => (
        <VideoVector
          key={point.indexed_asset_id}
          point={point}
          isSelected={selectedPoint?.indexed_asset_id === point.indexed_asset_id}
          onSelect={handlePointSelect}
          onHover={() => {}}
        />
      ))}
      
      {/* Central reference sphere - subtle glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Orbital rings for reference */}
      {[4, 8, 12].map((radius, index) => (
        <mesh key={radius} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius - 0.02, radius + 0.02, 64]} />
          <meshBasicMaterial 
            color="#00d4ff"
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={60}
        dampingFactor={0.03}
        rotateSpeed={0.3}
        zoomSpeed={0.6}
        autoRotate={true}
        autoRotateSpeed={0.2}
      />
    </>
  );
}

interface VideoCluster3DProps {
  points: Point3D[];
  loading?: boolean;
  error?: string;
  onPointSelect?: (point: Point3D) => void;
  className?: string;
}

export function VideoCluster3D({ 
  points, 
  loading, 
  error, 
  onPointSelect,
  className = "" 
}: VideoCluster3DProps) {
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full bg-gradient-to-br from-slate-950 to-blue-950 ${className}`}>
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border border-cyan-400/20 mx-auto animate-pulse"></div>
            
            {/* Particle animation overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
            </div>
          </div>
          <p className="text-cyan-300 font-medium text-lg mb-2">Mapping Memory Vectors...</p>
          <p className="text-slate-400 text-sm">Generating dimensional space</p>
          
          {/* Loading particles effect */}
          <div className="flex justify-center mt-4 space-x-1">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-gradient-to-br from-slate-950 to-red-950 ${className}`}>
        <div className="text-center max-w-md p-6">
          <div className="text-red-400 mb-6">
            <svg className="w-20 h-20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xl font-semibold mb-3 text-red-300">Memory Space Error</p>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          
          <div className="text-xs text-slate-500 space-y-2">
            {error.includes("No embeddings found") && (
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <p className="mb-2 text-slate-300">🌌 No memories detected in the vector space</p>
                <p>Upload videos to populate your memory constellation</p>
              </div>
            )}
            {error.includes("Need at least 2 embeddings") && (
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <p className="mb-2 text-slate-300">⭐ Insufficient memory vectors</p>
                <p>Add more memories to create meaningful spatial relationships</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!points || points.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full bg-gradient-to-br from-slate-950 to-slate-900 ${className}`}>
        <div className="text-center text-slate-400 max-w-md p-6">
          <div className="mb-6">
            {/* Empty space animation */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute inset-4 bg-gradient-to-r from-cyan-300/5 to-blue-300/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              
              <svg className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 2v12a2 2 0 002 2h6a2 2 0 002-2V6M5 6h14M10 11v6M14 11v6" />
              </svg>
            </div>
          </div>
          <p className="text-lg font-semibold mb-3 text-slate-300">Empty Memory Space</p>
          <p className="text-sm text-slate-500">Upload memories to begin constructing your personal vector constellation</p>
          
          <div className="mt-6 text-xs text-slate-600">
            <p>🌟 Each memory becomes a point of light in your dimensional space</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full ${className}`}>
      <Canvas
        camera={{ 
          position: [15, 12, 15], 
          fov: 50 
        }}
        style={{ background: 'linear-gradient(135deg, #0c0a1a 0%, #1a0c2e 50%, #0f172a 100%)' }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        {/* Fog for depth and atmosphere */}
        <fog attach="fog" args={['#0c0a1a', 20, 80]} />
        
        <VideoCluster points={points} onPointSelect={onPointSelect} />
      </Canvas>
      
      {/* Overlay UI elements */}
      <div className="absolute top-4 left-4 text-cyan-300 text-xs font-mono bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-cyan-500/20">
        <div>Memory Vectors: {points.length}</div>
        <div>Dimensional Space: Active</div>
      </div>
    </div>
  );
}