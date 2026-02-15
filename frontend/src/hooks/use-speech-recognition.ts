import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionEvent {
	resultIndex: number;
	results: {
		[key: number]: {
			[key: number]: {
				transcript: string;
			};
			isFinal: boolean;
		};
		length: number;
	};
}

interface SpeechRecognitionErrorEvent {
	error: string;
}

interface SpeechRecognition extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	start: () => void;
	stop: () => void;
	onresult: (event: SpeechRecognitionEvent) => void;
	onerror: (event: SpeechRecognitionErrorEvent) => void;
	onend: () => void;
}

declare global {
	interface Window {
		SpeechRecognition: {
			new (): SpeechRecognition;
		};
		webkitSpeechRecognition: {
			new (): SpeechRecognition;
		};
	}
}

export interface UseSpeechRecognitionProps {
	onResult?: (transcript: string) => void;
	onEnd?: () => void;
	onError?: (error: any) => void;
}

export function useSpeechRecognition({
	onResult,
	onEnd,
	onError,
}: UseSpeechRecognitionProps = {}) {
	const [isListening, setIsListening] = useState(false);
	const [transcript, setTranscript] = useState("");
	const [interimTranscript, setInterimTranscript] = useState("");
	const [isSupported, setIsSupported] = useState(false);

	const recognitionRef = useRef<SpeechRecognition | null>(null);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const SpeechRecognition =
				window.SpeechRecognition || window.webkitSpeechRecognition;

			if (!SpeechRecognition) {
				setIsSupported(false);
				return;
			}

			setIsSupported(true);
			recognitionRef.current = new SpeechRecognition();
			recognitionRef.current.continuous = true;
			recognitionRef.current.interimResults = true;
			recognitionRef.current.lang = "en-US";

			recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
				let finalTranscript = "";
				let currentInterim = "";

				for (let i = event.resultIndex; i < event.results.length; ++i) {
					if (event.results[i].isFinal) {
						finalTranscript += event.results[i][0].transcript;
					} else {
						currentInterim += event.results[i][0].transcript;
					}
				}

				const currentTranscript = finalTranscript || currentInterim;
				setTranscript(currentTranscript);
				setInterimTranscript(currentInterim);

				if (onResult && currentTranscript) {
					if (finalTranscript) {
						onResult(finalTranscript);
						setInterimTranscript(""); // Clear interim when finalized
					}
				}
			};

			recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
				console.error("Speech recognition error", event.error);
				setIsListening(false);
				if (onError) onError(event.error);
			};

			recognitionRef.current.onend = () => {
				setIsListening(false);
				if (onEnd) onEnd();
			};
		}

		return () => {
			if (recognitionRef.current) {
				recognitionRef.current.stop();
			}
		};
	}, [onResult, onEnd, onError]);

	const startListening = useCallback(() => {
		if (recognitionRef.current && !isListening) {
			try {
				setTranscript("");
				setInterimTranscript("");
				recognitionRef.current.start();
				setIsListening(true);
			} catch (error) {
				console.error("Error starting speech recognition:", error);
			}
		}
	}, [isListening]);

	const stopListening = useCallback(() => {
		if (recognitionRef.current && isListening) {
			recognitionRef.current.stop();
			setIsListening(false);
			setInterimTranscript("");
		}
	}, [isListening]);

	const toggleListening = useCallback(() => {
		if (isListening) {
			stopListening();
		} else {
			startListening();
		}
	}, [isListening, startListening, stopListening]);

	return {
		isListening,
		transcript,
		interimTranscript,
		isSupported,
		startListening,
		stopListening,
		toggleListening,
	};
}
