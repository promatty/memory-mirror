"use client";
import { Upload, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CONVERSATION_HISTORY_QUERY_KEY } from "../history/history-drawer";

interface Metadata {
  date: string;
  age: number;
  location: string;
  people: string;
  mood: string;
  tags: string;
}

interface UploadVideoRequest {
  video: File;
  metadata: Metadata;
}

interface UploadSectionProps {
  onUploadSuccess?: () => void;
}

export function UploadSection({ onUploadSuccess }: UploadSectionProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<Metadata>({
    date: "",
    age: 0,
    location: "",
    people: "",
    mood: "",
    tags: "",
  });

  // TanStack Query mutation for uploading video
  const uploadVideoMutation = useMutation({
    mutationFn: async ({ video, metadata }: UploadVideoRequest) => {
      const formData = new FormData();
      formData.append("video", video);
      formData.append("metadata", JSON.stringify(metadata));

      const response = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Upload failed");
      }

      return response.json();
    },
    onMutate: () => {
      toast.loading("Uploading video...", { id: "upload-video" });
    },
    onSuccess: () => {
      toast.success("Video uploaded successfully!", { id: "upload-video" });

      // Invalidate conversation history query to refresh the list
      void queryClient.invalidateQueries({
        queryKey: [CONVERSATION_HISTORY_QUERY_KEY],
      });

      // Close dialog and reset form
      setOpen(false);
      resetForm();

      // Reset the mirror interface
      onUploadSuccess?.();
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to upload video";
      toast.error(errorMessage, { id: "upload-video" });
    },
    retry: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideo(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!video) {
      toast.error("Please select a video file");
      return;
    }

    uploadVideoMutation.mutate({ video, metadata });
  };

  const resetForm = () => {
    setVideo(null);
    setMetadata({
      date: "",
      age: 0,
      location: "",
      people: "",
      mood: "",
      tags: "",
    });
  };

  const handleOpen = () => {
    setOpen(true);
    resetForm();
  };

  const handleClose = () => {
    if (uploadVideoMutation.isPending) {
      toast.error("Please wait for upload to complete");
      return;
    }
    setOpen(false);
    resetForm();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full px-4 py-3 rounded-lg border border-border bg-background hover:bg-surface hover:border-primary text-foreground transition-all flex items-center justify-center gap-2 group"
      >
        <Upload className="w-4 h-4 group-hover:text-primary transition-colors" />
        <span className="text-sm font-medium">upload</span>
      </button>      
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="rounded-lg border border-border bg-surface shadow-xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              onClick={handleClose}
              aria-label="Close"
              type="button"
              disabled={uploadVideoMutation.isPending}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-foreground">
              Upload a Memory Video
              {uploadVideoMutation.isPending && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  (Uploading...)
                </span>
              )}
            </h2>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block font-semibold mb-2 text-foreground">
                Video File {video && <span className="text-xs text-muted-foreground ml-1">({(video.size / 1024 / 1024).toFixed(2)} MB)</span>}
              </label>
              <div className="relative">
                <label
                  htmlFor="video-upload"
                  className={`w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground transition-all flex items-center justify-center gap-2 group ${
                    uploadVideoMutation.isPending
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-surface hover:border-primary cursor-pointer'
                  }`}
                >
                  {video ? (
                    <span className="text-sm truncate max-w-full">{video.name}</span>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Choose File</span>
                    </>
                  )}
                </label>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleFile}
                  required
                  disabled={uploadVideoMutation.isPending}
                  className="hidden"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                name="date"
                type="date"
                value={metadata.date}
                className="border border-border bg-background text-foreground p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Date"
                onChange={handleChange}
                disabled={uploadVideoMutation.isPending}
              />
              <input
                name="age"
                type="number"
                value={metadata.age || ""}
                className="border border-border bg-background text-foreground p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Age"
                onChange={handleChange}
                disabled={uploadVideoMutation.isPending}
              />
              <input
                name="location"
                value={metadata.location}
                className="border border-border bg-background text-foreground p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Location"
                onChange={handleChange}
                disabled={uploadVideoMutation.isPending}
              />
              <input
                name="people"
                value={metadata.people}
                className="border border-border bg-background text-foreground p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="People (comma separated)"
                onChange={handleChange}
                disabled={uploadVideoMutation.isPending}
              />
              <input
                name="mood"
                value={metadata.mood}
                className="border border-border bg-background text-foreground p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Mood"
                onChange={handleChange}
                disabled={uploadVideoMutation.isPending}
              />
              <input
                name="tags"
                value={metadata.tags}
                className="border border-border bg-background text-foreground p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Tags (comma separated)"
                onChange={handleChange}
                disabled={uploadVideoMutation.isPending}
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background hover:bg-surface hover:border-primary text-foreground transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={uploadVideoMutation.isPending}
            >
              {uploadVideoMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">Submit</span>
                </>
              )}
            </button>
          </form>
        </div>
        </div>
      )}
    </>
  );
}
