"use client";

import { useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { ConversationCard } from "./conversation-card";
import type { ConversationHistoryItem } from "@/app/actions/conversation-actions";

interface ConversationListProps {
  conversations: ConversationHistoryItem[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onReplay: (conversation: ConversationHistoryItem) => void;
  onDelete: (id: number) => void;
  onExport: (id: number) => void;
}

export function ConversationList({
  conversations,
  isLoading,
  hasMore,
  onLoadMore,
  onReplay,
  onDelete,
  onExport,
}: ConversationListProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [handleObserver]);

  if (conversations.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground mb-2">No conversations yet</p>
        <p className="text-sm text-muted-foreground">
          Start by asking about your memories
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {conversations.map((conversation) => (
          <ConversationCard
            key={conversation.id}
            conversation={conversation}
            onReplay={onReplay}
            onDelete={onDelete}
            onExport={onExport}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="h-4" />

      {/* End of list message */}
      {!hasMore && conversations.length > 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No more conversations
        </div>
      )}
    </div>
  );
}

