"use client";
import { Upload, X } from "lucide-react";
import { useState } from "react";
interface Metadata {
  date: string;
  age: number;
  location: string;
  people: string;
  mood: string;
  tags: string;
}


export function UploadSection() {
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError("");
    setSuccess(false);
    if (!video) {
      setError("Please select a video file.");
      setUploading(false);
      return;
    }
    const formData = new FormData();
    formData.append("video", video);
    Object.entries(metadata).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    try {
      const res = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setError("");
    setSuccess(false);
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

  const handleClose = () => {
    setOpen(false);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">          <div className="rounded-lg border border-border bg-surface shadow-xl p-8 w-full max-w-md relative">
          <button
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-2xl font-bold"
            onClick={handleClose}
            aria-label="Close"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold mb-6 text-foreground">Upload a Memory Video</h2>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block font-semibold mb-2 text-foreground">Video File</label>
              <div className="relative">
                <label htmlFor="video-upload" className="w-full px-4 py-3 rounded-lg border border-border bg-background hover:bg-surface hover:border-primary text-foreground transition-all flex items-center justify-center gap-2 group">
                  {video ? video.name : "Choose File"}
                </label>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleFile}
                  required
                  className="hidden"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input name="date" type="date" className="border border-border bg-background text-foreground p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Date" onChange={handleChange} />
              <input name="age" type="number" className="border border-border bg-background text-foreground p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Age" onChange={handleChange} />
              <input name="location" className="border border-border bg-background text-foreground p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Location" onChange={handleChange} />
              <input name="people" className="border border-border bg-background text-foreground p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" placeholder="People (comma separated)" onChange={handleChange} />
              <input name="mood" className="border border-border bg-background text-foreground p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Mood" onChange={handleChange} />
              <input name="tags" className="border border-border bg-background text-foreground p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Tags (comma separated)" onChange={handleChange} />
            </div>
            <button type="submit" className="w-full px-4 py-3 rounded-lg border border-border bg-background hover:bg-surface hover:border-primary text-foreground transition-all flex items-center justify-center gap-2 group" disabled={uploading}>
              {uploading ? "Submitting..." : "Submit"}
            </button>
            {error && <div className="text-destructive mt-2">{error}</div>}
            {success && <div className="text-green-600 mt-2">Upload successful!</div>}
          </form>
        </div>
        </div>
      )}
    </>
  );
}
