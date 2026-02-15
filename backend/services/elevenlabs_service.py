import time
import base64
from pathlib import Path
from typing import Iterable, Dict, Any
from elevenlabs import ElevenLabs
from ..core.config import settings

class ElevenLabsService:
    def __init__(self):
        if not settings.ELEVENLABS_API_KEY:
            raise ValueError("ELEVENLABS_API_KEY is not set in environment variables")

        self.client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
        self.output_dir = Path(__file__).parent.parent / "output"
        self.output_dir.mkdir(exist_ok=True)
    
    def text_to_speech(
        self,
        text: str,
        voice: str = "21m00Tcm4TlvDq8ikWAM",  # Default voice ID (Rachel)
        model: str = "eleven_flash_v2_5",
        output_filename: str | None = None
    ) -> Path:
        """
        Convert text to speech using ElevenLabs API.
        
        Args:
            text: The text to convert to speech
            voice: Voice name to use (default: "Rachel")
            model: Model to use (default: "eleven_flash_v2_5")
            output_filename: Optional custom filename (without extension)
        
        Returns:
            Path to the generated audio file
        """
        try:
            start_time = time.perf_counter()
            # Generate audio
            audio_generator = self.client.text_to_speech.convert(
                voice_id=voice,
                text=text,
                model_id=model,
                output_format="mp3_44100_128"
            )
            
            # Determine output filename
            if output_filename is None:
                # Create filename from first 30 chars of text
                safe_text = "".join(c for c in text[:30] if c.isalnum() or c in (' ', '-', '_')).strip()
                safe_text = safe_text.replace(' ', '_')
                output_filename = f"{safe_text}"
            
            output_path = self.output_dir / f"{output_filename}.mp3"
            
            # Write audio to file
            with open(output_path, "wb") as f:
                for chunk in audio_generator:
                    f.write(chunk)
            
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            print(f"Audio generated successfully in {elapsed_ms:.2f} ms: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"Error generating speech: {str(e)}")
            raise

    def text_to_speech_stream(
        self,
        text: str,
        voice: str = "21m00Tcm4TlvDq8ikWAM",
        model: str = "eleven_flash_v2_5",
    ) -> Iterable[bytes]:
        """
        Stream TTS audio chunks without writing to disk.

        Args:
            text: The text to convert to speech
            voice: Voice ID to use
            model: Model to use

        Returns:
            Iterable of audio byte chunks
        """
        start_time = time.perf_counter()
        audio_generator = self.client.text_to_speech.convert(
            voice_id=voice,
            text=text,
            model_id=model,
            output_format="mp3_44100_128",
        )

        def stream() -> Iterable[bytes]:
            try:
                for chunk in audio_generator:
                    yield chunk
            finally:
                elapsed_ms = (time.perf_counter() - start_time) * 1000
                print(f"Audio streamed successfully in {elapsed_ms:.2f} ms")

        return stream()
    
    def text_to_speech_with_alignment(
        self,
        text: str,
        voice: str = "21m00Tcm4TlvDq8ikWAM",
        model: str = "eleven_flash_v2_5",
    ) -> Dict[str, Any]:
        """
        Convert text to speech with word-level alignment data using forced alignment.

        This method:
        1. Generates audio using TTS
        2. Uses forced alignment to get word-level timing

        Args:
            text: The text to convert to speech
            voice: Voice ID to use
            model: Model to use

        Returns:
            Dictionary containing:
                - audio_base64: Base64 encoded audio
                - alignment: Word and character-level timing information
        """
        try:
            start_time = time.perf_counter()

            # Step 1: Generate audio using standard TTS
            print("🎤 Generating audio with TTS...")
            audio_generator = self.client.text_to_speech.convert(
                voice_id=voice,
                text=text,
                model_id=model,
                output_format="mp3_44100_128"
            )

            # Collect audio bytes
            audio_bytes = b""
            for chunk in audio_generator:
                audio_bytes += chunk

            # Convert to base64
            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

            tts_elapsed = (time.perf_counter() - start_time) * 1000
            print(f"✅ Audio generated in {tts_elapsed:.2f} ms")

            # Step 2: Use forced alignment to get timing information
            print("🔄 Running forced alignment...")
            alignment_start = time.perf_counter()

            # Create a temporary file-like object from audio bytes
            import io
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = "audio.mp3"  # Required for multipart upload

            # Call forced alignment API
            alignment_response = self.client.forced_alignment.create(
                file=audio_file,
                text=text
            )

            alignment_elapsed = (time.perf_counter() - alignment_start) * 1000
            print(f"✅ Forced alignment completed in {alignment_elapsed:.2f} ms")

            # Convert alignment response to dict
            alignment_data = None
            if alignment_response:
                # Extract character and word timing
                characters = []
                character_start_times_ms = []
                character_end_times_ms = []

                if hasattr(alignment_response, 'characters'):
                    for char in alignment_response.characters:
                        characters.append(char.text)
                        character_start_times_ms.append(int(char.start * 1000))
                        character_end_times_ms.append(int(char.end * 1000))

                # Also include word-level timing
                words = []
                if hasattr(alignment_response, 'words'):
                    for word in alignment_response.words:
                        words.append({
                            "text": word.text,
                            "start": word.start,
                            "end": word.end,
                            "confidence": 1.0 - word.loss if hasattr(word, 'loss') else 1.0
                        })

                alignment_data = {
                    "characters": characters,
                    "character_start_times_ms": character_start_times_ms,
                    "character_end_times_ms": character_end_times_ms,
                    "words": words,
                    "confidence": 1.0 - alignment_response.loss if hasattr(alignment_response, 'loss') else 1.0
                }

            total_elapsed = (time.perf_counter() - start_time) * 1000
            print(f"✅ Total time (TTS + alignment): {total_elapsed:.2f} ms")

            return {
                "audio_base64": audio_base64,
                "alignment": alignment_data
            }

        except Exception as e:
            print(f"❌ Error generating speech with alignment: {str(e)}")
            print(f"   Falling back to TTS without alignment...")

            # Fallback: return audio without alignment
            try:
                audio_generator = self.client.text_to_speech.convert(
                    voice_id=voice,
                    text=text,
                    model_id=model,
                    output_format="mp3_44100_128"
                )

                audio_bytes = b""
                for chunk in audio_generator:
                    audio_bytes += chunk

                audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

                return {
                    "audio_base64": audio_base64,
                    "alignment": None
                }
            except Exception as fallback_error:
                print(f"❌ Fallback also failed: {str(fallback_error)}")
                raise

    def list_voices(self) -> list:
        """
        List all available voices.

        Returns:
            List of available voices
        """
        try:
            voices = self.client.voices.get_all()
            return voices.voices
        except Exception as e:
            print(f"Error fetching voices: {str(e)}")
            raise

# Singleton instance
_service_instance = None

def get_elevenlabs_service() -> ElevenLabsService:
    """Get or create ElevenLabs service instance."""
    global _service_instance
    if _service_instance is None:
        _service_instance = ElevenLabsService()
    return _service_instance

