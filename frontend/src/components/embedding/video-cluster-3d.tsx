"use client";

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface Point3D {
  x: number;
  y: number;
  z: number;
  indexed_asset_id: string;
  keywords: string[];
  metadata?: Record<string, unknown>;
}

interface VideoPointProps {
  point: Point3D;
  isSelected: boolean;
  onSelect: (point: Point3D) => void;
  onHover: (point: Point3D | null) => void;
}

function VideoPoint({ point, isSelected, onSelect, onHover }: VideoPointProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Color based on cluster ID, then modified by interaction state
  const color = useMemo(() => {
    // Define cluster colors
    const clusterColors = [
      '#74b9ff', // Blue
      '#fd79a8', // Pink
      '#fdcb6e', // Orange
      '#6c5ce7', // Purple
      '#a29bfe', // Light purple
      '#00b894', // Green
      '#e17055', // Red-orange
      '#00cec9', // Teal
    ];
    
    // Get cluster info from metadata
    const clusterId = point.metadata?.cluster_id ?? 0;
    const totalClusters = point.metadata?.total_clusters ?? 1;
    
    // Base color from cluster
    let baseColor = clusterColors[clusterId % clusterColors.length];
    
    // For single cluster, use a unified color scheme
    if (totalClusters <= 1) {
      baseColor = '#74b9ff'; // Default blue
    }
    
    // Modify color based on interaction state
    if (isSelected) {
      // Make selected points more vibrant/red-tinted
      return totalClusters <= 1 ? '#ff6b6b' : '#ff4757';
    }
    
    if (hovered) {
      // Make hovered points brighter
      return totalClusters <= 1 ? '#4ecdc4' : '#00d2d3';
    }
    
    return baseColor;
  }, [point.metadata, isSelected, hovered]);

  // Calculate scale based on hover and selection state
  const targetScale = isSelected ? 1.5 : hovered ? 1.3 : 1;

  // Animate the sphere
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      
      // Gentle floating animation
      meshRef.current.position.y = point.y + Math.sin(state.clock.elapsedTime + point.x) * 0.1;
      
      // Smooth scale transition
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  return (
    <group position={[point.x, point.y, point.z]}>
      <Sphere
        ref={meshRef}
        args={[0.1, 16, 16]}
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
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.4 : hovered ? 0.3 : 0.1}
          roughness={0.3}
          metalness={0.6}
        />
      </Sphere>
      
      {/* Connection lines to nearby points could be added here */}
      
      {/* Hover label */}
      {hovered && (
        <Html position={[0, 0.3, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="bg-black/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-xl max-w-xs border border-white/20 animate-in fade-in duration-200">
            <div className="font-semibold text-sm mb-1">📹 Video: {point.indexed_asset_id.slice(0, 8)}...</div>
            
            <div className="text-xs text-gray-300">
              🏷️ Keywords: {point.keywords && point.keywords.length > 0 ? point.keywords.slice(0, 3).join(', ') : 'No keywords'}
              {point.keywords && point.keywords.length > 3 && ` +${point.keywords.length - 3} more`}
            </div>
            <div className="text-xs text-gray-400 mt-1 italic">Click to view details</div>
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

  // Scale and center the points for better visualization
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
    
    // Scale to fit in a reasonable space (e.g., -5 to 5)
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
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {/* Grid helper for reference */}
      <gridHelper args={[20, 20, '#444444', '#222222']} />
      
      {/* Render video points */}
      {normalizedPoints.map((point) => (
        <VideoPoint
          key={point.indexed_asset_id}
          point={point}
          isSelected={selectedPoint?.indexed_asset_id === point.indexed_asset_id}
          onSelect={handlePointSelect}
          onHover={() => {}}
        />
      ))}
      
      {/* Central reference point */}
      <Sphere args={[0.05, 8, 8]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#ffffff" opacity={0.5} transparent />
      </Sphere>
      
      {/* Title */}
      {/* <Text
        position={[0, 8, 0]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Video Keyword Clusters
      </Text> */}
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={50}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
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
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-12 w-12 border-2 border-primary/20 mx-auto"></div>
          </div>
          <p className="text-foreground font-medium">Loading video clusters...</p>
          <p className="text-muted-foreground text-sm mt-1">Creating 3D visualization</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center max-w-md p-6">
          <div className="text-destructive mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-semibold mb-2 text-foreground">Error Loading 3D Visualization</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <div className="text-xs text-muted-foreground">
            {error.includes("No embeddings found") && (
              <div>
                <p className="mb-2">This usually means no videos have been uploaded and indexed yet.</p>
                <p>Try uploading some videos first, then return to view the 3D clusters.</p>
              </div>
            )}
            {error.includes("Need at least 2 embeddings") && (
              <div>
                <p className="mb-2">You need at least 2 videos to create a meaningful visualization.</p>
                <p>Upload more videos to see the cluster relationships.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!points || points.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-muted-foreground max-w-md p-6">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 2v12a2 2 0 002 2h6a2 2 0 002-2V6M5 6h14M10 11v6M14 11v6" />
            </svg>
          </div>
          <p className="text-lg font-semibold mb-2 text-foreground">No Videos Found</p>
          <p className="text-sm">Upload some videos to see the 3D clusters and explore your memories</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full ${className}`}>
      <Canvas
        camera={{ 
          position: [10, 10, 10], 
          fov: 60 
        }}
        style={{ background: '#1a1a1a' }}
      >
        <VideoCluster points={points} onPointSelect={onPointSelect} />
      </Canvas>
    </div>
  );
}