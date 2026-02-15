"use client";

import { FileText, MessageSquare } from "lucide-react";

interface MemoryInfoViewProps {
  narrative?: string;
  userPrompt?: string;
}

export function MemoryInfoView({ narrative, userPrompt }: MemoryInfoViewProps) {
  if (!narrative && !userPrompt) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No memory information available</p>
          <p className="text-sm mt-2">Ask a question to see memory details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* User Question */}
        {userPrompt && (
          <div className="bg-surface rounded-lg border border-border p-6">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Your Question
                </h3>
                <p className="text-base leading-relaxed">{userPrompt}</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Narrative */}
        {narrative && (
          <div className="bg-surface rounded-lg border border-border p-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Memory Narrative
                </h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {narrative}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

