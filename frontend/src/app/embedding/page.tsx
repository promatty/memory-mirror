"use client";

import type { CSSProperties } from "react";
import { EmbeddingInterface } from "@/components/embedding/embedding-interface";

export default function EmbeddingPage() {
  return (
    <main
      className="h-screen overflow-hidden bg-background w-full"
      style={{ "--visualizer-height": "220px" } as CSSProperties}
    >
      <EmbeddingInterface />
    </main>
  );
}
