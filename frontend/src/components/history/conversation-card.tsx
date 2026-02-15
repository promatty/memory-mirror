"use client";

import { useState } from "react";
import { Play, Trash2, Download, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ConversationHistoryItem } from "@/app/actions/conversation-actions";

interface ConversationCardProps {
  conversation: ConversationHistoryItem;
  onReplay: (conversation: ConversationHistoryItem) => void;
  onDelete: (id: number) => void;
  onExport: (id: number) => void;
}

export function ConversationCard({
  conversation,
  onReplay,
  onDelete,
  onExport,
}: ConversationCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleReplay = () => {
    onReplay(conversation);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this conversation?")) {
      onDelete(conversation.id);
    }
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExport(conversation.id);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  // Truncate narrative for preview
  const narrativePreview =
    conversation.narrative.length > 100
      ? `${conversation.narrative.substring(0, 100)}...`
      : conversation.narrative;

  return (
    <div
      className="group relative bg-card border border-border/50 rounded-lg overflow-hidden hover:border-primary/50 transition-all cursor-pointer"
      onClick={handleReplay}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {conversation.thumbnailUrl && !imageError ? (
          <img
            src={conversation.thumbnailUrl}
            alt={conversation.userPrompt}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-lilac/20">
            <Play className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-primary rounded-full p-3">
            <Play className="w-6 h-6 text-primary-foreground fill-current" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-sm line-clamp-2 flex-1">
            {conversation.userPrompt}
          </h3>

          {/* Menu button */}
          <div className="relative">
            <button
              onClick={toggleMenu}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg z-20 min-w-[150px]">
                  <button
                    onClick={handleExport}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {narrativePreview}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {formatDistanceToNow(new Date(conversation.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

