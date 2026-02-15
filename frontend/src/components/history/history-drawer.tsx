"use client";

import { useState, useCallback, useEffect } from "react";
import { X, History } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ConversationList } from "./conversation-list";
import { SearchBar } from "./search-bar";
import {
  getConversationHistory,
  deleteConversation,
  exportConversation,
  type ConversationHistoryItem,
} from "@/app/actions/conversation-actions";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onReplayConversation: (conversation: ConversationHistoryItem) => void;
}
export const CONVERSATION_HISTORY_QUERY_KEY = "conversation-history";
export function HistoryDrawer({
  isOpen,
  onClose,
  onReplayConversation,
}: HistoryDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const queryClient = useQueryClient();

  const LIMIT = 10;

  // Fetch conversation history
  const { data, isLoading, refetch } = useQuery({
    queryKey: [CONVERSATION_HISTORY_QUERY_KEY, searchQuery, offset],
    queryFn: async () => {
      const result = await getConversationHistory({
        limit: LIMIT,
        offset,
        searchQuery,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch history");
      }

      return result;
    },
    enabled: isOpen,
  });

  // Accumulate conversations for infinite scroll
  const [allConversations, setAllConversations] = useState<
    ConversationHistoryItem[]
  >([]);

  // Update accumulated conversations when data changes
  useEffect(() => {
    if (data?.data && Array.isArray(data.data)) {
      if (offset === 0) {
        setAllConversations(data.data);
      } else {
        setAllConversations((prev) => [...prev, ...data.data]);
      }
    }
  }, [data, offset]);

  const hasMore = data ? allConversations.length < (data.total || 0) : false;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      toast.success("Conversation deleted");
      queryClient.invalidateQueries({ queryKey: ["conversation-history"] });
      setOffset(0);
      setAllConversations([]);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete conversation");
    },
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: exportConversation,
    onSuccess: (result) => {
      if (result.success && result.data) {
        // Create downloadable JSON file
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `conversation-${result.data.id}.json`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success("Conversation exported");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to export conversation");
    },
  });

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setOffset(0);
    setAllConversations([]);
  }, []);

  const handleLoadMore = useCallback(() => {
    setOffset((prev) => prev + LIMIT);
  }, []);

  const handleReplay = (conversation: ConversationHistoryItem) => {
    onReplayConversation(conversation);
    onClose();
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleExport = (id: number) => {
    exportMutation.mutate(id);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-2/3 lg:w-1/2 bg-background border-l border-border z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Conversation History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-border">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {data?.error === "Database not configured" ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="max-w-md space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <History className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Database Not Configured</h3>
                <p className="text-sm text-muted-foreground">
                  To enable conversation history, you need to configure a database connection.
                  Update the <code className="px-1.5 py-0.5 bg-muted rounded text-xs">DATABASE_URL</code> in your{" "}
                  <code className="px-1.5 py-0.5 bg-muted rounded text-xs">.env.local</code> file.
                </p>
                <p className="text-xs text-muted-foreground">
                  {`Your conversations are still working - they just won't be saved for later viewing.`}
                </p>
              </div>
            </div>
          ) : (
            <ConversationList
              conversations={offset === 0 ? data?.data || [] : allConversations}
              isLoading={isLoading}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              onReplay={handleReplay}
              onDelete={handleDelete}
              onExport={handleExport}
            />
          )}
        </div>
      </div>
    </>
  );
}

