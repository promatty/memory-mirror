"use client";

import type { CSSProperties } from "react";
import { MirrorInterface } from "@/components/mirror/mirror-interface";

export default function MirrorPage() {
  return (
    <main
      className="h-screen overflow-hidden bg-background w-full"
      style={{ "--visualizer-height": "220px" } as CSSProperties}
    >
      <MirrorInterface />
    </main>
  );
}
