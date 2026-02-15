"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mic, Send, Square } from "lucide-react";
import { toast } from "sonner";
import { AudioWaveform } from "./audio-waveform";
import { VideoPlayer } from "./video-player";
import { Captions } from "./captions";
import { UploadSection } from "./upload-section";
import { useSpeechRecognition } from "../../hooks/use-speech-recognition";
import { queryMemory } from "@/app/actions/mirror-actions";
import type { QueryMemoryResponse } from "@/types/memory";

export function MirrorInterface() {
	const [inputText, setInputText] = useState("");
	const [isPlaying, setIsPlaying] = useState(false);
	const [captionText, setCaptionText] = useState("");
	const [activeTab, setActiveTab] = useState<"video" | "additional">("video");
	const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);

	const handleSpeechResult = useCallback((text: string) => {
		if (text) {
			setInputText((prev) => {
				const prefix = prev.trim() ? `${prev} ` : "";
				return prefix + text;
			});
		}
	}, []);

	const { isListening, toggleListening, interimTranscript } =
		useSpeechRecognition({
			onResult: handleSpeechResult,
		});

	const handleSpeak = () => {
		toggleListening();
	};

	// TanStack Query mutation for querying memory
	const queryMemoryMutation = useMutation({
		mutationFn: async (userPrompt: string) => {
			const result = await queryMemory({ userPrompt });

			if (!result.success || !result.data) {
				throw new Error(result.error || "Failed to query memory");
			}

			return result.data;
		},
		onMutate: () => {
			toast.loading("Searching your memories...", { id: "query-memory" });
		},
		onSuccess: (data: QueryMemoryResponse) => {
			if (data.videoUrl && data.audioBase64 && data.narrative) {
				// Success: Update UI with video, audio, and narrative
				setCurrentVideoUrl(data.videoUrl);
				setCaptionText(data.narrative);
				setIsPlaying(true);

				toast.success("Memory found!", { id: "query-memory" });

				// Play audio
				const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`);
				audio.play().catch((error) => {
					console.error("Failed to play audio:", error);
					toast.error("Failed to play audio");
				});
			}
		},
		onError: (error: Error) => {
			const errorMessage = error instanceof Error ? error.message : "Failed to query memory";
			toast.error(errorMessage, { id: "query-memory" });
		},
	});

	const handleSendMessage = () => {
		if (!inputText.trim() || queryMemoryMutation.isPending) return;

		const userQuery = inputText.trim();
		setInputText("");
		queryMemoryMutation.mutate(userQuery);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			void handleSendMessage();
		}
	};

	// calculate display value for textarea
	// if listening, we show current committed text + interim
	// we add a space if there's existing text and interim text
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
									? "bg-secondary border-secondary text-secondary-foreground"
									: "border-border hover:border-primary hover:text-primary"
							}`}
							style={{ height: "44px" }}
							aria-label="Record voice message"
						>
							{isListening ? (
								<Square className="w-5 h-5 fill-current" />
							) : (
								<Mic className="w-5 h-5" />
							)}
						</button>

						{/* text input */}
						<div className="flex-1 relative">
							<textarea
								value={displayValue}
								onChange={(e) => setInputText(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="text"
								disabled={queryMemoryMutation.isPending}
								className="w-full px-4 py-2.5 pr-12 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
								rows={1}
								style={{
									minHeight: "44px",
									maxHeight: "200px",
								}}
							/>
							<button
								onClick={() => void handleSendMessage()}
								disabled={(!inputText.trim() && !interimTranscript) || queryMemoryMutation.isPending}
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
