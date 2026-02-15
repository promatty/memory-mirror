"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Send } from "lucide-react"
import { AudioWaveform } from "./audio-waveform"
import { VideoPlayer } from "./video-player"
import { Captions } from "./captions"
import { UploadSection } from "./upload-section"

export function MirrorInterface() {
  const [inputText, setInputText] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [captionText, setCaptionText] = useState("")
  const [activeTab, setActiveTab] = useState<"video" | "additional">("video")
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null)
  
  const handleSpeak = () => {
    setIsRecording(!isRecording)
    // TODO: Implement speech-to-text functionality
  }

  const handleSendMessage = () => {
    if (!inputText.trim()) return
    
    // TODO: Send message to backend and get response
    console.log("Sending message:", inputText)
    setInputText("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-screen flex">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-border bg-surface flex flex-col">
        {/* Audio Waveform Visualization */}
        <div className="p-6">
          <AudioWaveform isPlaying={isPlaying} />
        </div>

        {/* Captions Area */}
        <div className="flex-1 p-6 border-b border-border overflow-y-auto">
          <Captions text={captionText} />
        </div>

        {/* Upload Button */}
        <div className="p-6">
          <UploadSection />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Video/Additional Tab Toggle */}
        <div className="flex items-center justify-center p-4">
          <div className="inline-flex rounded-lg border border-border bg-surface p-1">
            <button
              onClick={() => setActiveTab("video")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "video"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              video
            </button>
            <span className="text-muted-foreground px-2 py-2">/</span>
            <button
              onClick={() => setActiveTab("additional")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "additional"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              additional
            </button>
          </div>
        </div>

        {/* Video Display Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          <VideoPlayer 
            videoUrl={currentVideoUrl}
            isPlaying={isPlaying}
            onPlayStateChange={setIsPlaying}
          />
        </div>

        {/* Input Controls */}
        <div className="p-5 border-t border-border bg-surface">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            {/* Speak Button */}
            <button
              onClick={handleSpeak}
              className={`px-6 py-4 rounded-lg border transition-all ${
                isRecording
                  ? "bg-destructive border-destructive text-destructive-foreground"
                  : "border-border hover:border-primary hover:text-primary"
              }`}
              aria-label="Record voice message"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="text"
                className="w-full px-4 py-2.5 pr-12 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                rows={1}
                style={{
                  minHeight: "44px",
                  maxHeight: "200px",
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="absolute right-2 bottom-2 p-2 rounded-md text-primary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
