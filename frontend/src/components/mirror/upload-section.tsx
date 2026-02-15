"use client"

import { Upload } from "lucide-react"

export function UploadSection() {
  const handleUpload = () => {
    // TODO: Implement file upload functionality
    console.log("Upload clicked")
  }

  return (
    <button
      onClick={handleUpload}
      className="w-full px-4 py-3 rounded-lg border border-border bg-background hover:bg-surface hover:border-primary text-foreground transition-all flex items-center justify-center gap-2 group"
    >
      <Upload className="w-4 h-4 group-hover:text-primary transition-colors" />
      <span className="text-sm font-medium">upload</span>
    </button>
  )
}
