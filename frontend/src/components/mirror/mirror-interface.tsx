"use client";

import { useState, useRef } from "react";
import { Mic, Send } from "lucide-react";
import { AudioWaveform } from "./audio-waveform";
import { VideoPlayer } from "./video-player";
import { Captions } from "./captions";
import { UploadSection } from "./upload-section";
import { useSpeechRecognition } from "../../hooks/use-speech-recognition";

export function MirrorInterface() {
	const [inputText, setInputText] = useState("");
	const [isPlaying, setIsPlaying] = useState(false);
	const [captionText, setCaptionText] = useState("");
	const [activeTab, setActiveTab] = useState<"video" | "additional">("video");
	const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);

	const handleSpeechResult = (text: string) => {
		if (text) {
			setInputText((prev) => {
				const prefix = prev.trim() ? `${prev} ` : "";
				return prefix + text;
			});
		}
	};

	const { isListening, toggleListening, interimTranscript } =
		useSpeechRecognition({
			onResult: handleSpeechResult,
		});

	const handleSpeak = () => {
		toggleListening();
	};

	const handleSendMessage = () => {
		if (!inputText.trim()) return;

		// TODO: Send message to backend and get response
		console.log("Sending message:", inputText);
		setInputText("");
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	// Calculate display value for textarea
	// If listening, we show current committed text + interim
	// We add a space if there's existing text and interim text
	const displayValue = isListening
		? `${inputText}${inputText && interimTranscript ? " " : ""}${interimTranscript}`
		: inputText;

	return (
		<div className="h-screen flex">
			{/* left sidebar */}
			<div className="w-64 border-r border-border bg-surface flex flex-col">
				{/* audio waveform visualization */}
				<div className="p-6">
					<AudioWaveform isPlaying={isPlaying} />
				</div>

				{/* captions area */}
				<div className="flex-1 p-6 border-b border-border overflow-y-auto">
					<Captions text={captionText} />
				</div>

				{/* upload button */}
				<div className="p-6">
					<UploadSection />
				</div>
			</div>

			{/* main content area */}
			<div className="flex-1 flex flex-col">
				{/* video/additional tab toggle */}
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

				{/* video display area */}
				<div className="flex-1 p-8 overflow-y-auto">
					<VideoPlayer
						videoUrl={currentVideoUrl}
						isPlaying={isPlaying}
						onPlayStateChange={setIsPlaying}
					/>
				</div>

				{/* input controls */}
				<div className="p-5 border-t border-border bg-surface">
					<div className="max-w-4xl mx-auto flex items-center gap-4">
						{/* speak button */}
						<button
							onClick={handleSpeak}
							className={`px-6 rounded-lg border transition-all ${
								isListening
									? "bg-destructive border-destructive text-destructive-foreground animate-pulse"
									: "border-border hover:border-primary hover:text-primary"
							}`}
							style={{ height: "44px" }}
							aria-label="Record voice message"
						>
							<Mic className="w-5 h-5" />
						</button>

						{/* text input */}
						<div className="flex-1 relative">
							<textarea
								value={displayValue}
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
								disabled={!inputText.trim() && !interimTranscript}
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
	);
}
