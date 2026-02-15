from pathlib import Path
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
        model: str = "eleven_multilingual_v2",
        output_filename: str | None = None
    ) -> Path:
        """
        Convert text to speech using ElevenLabs API.
        
        Args:
            text: The text to convert to speech
            voice: Voice name to use (default: "Rachel")
            model: Model to use (default: "eleven_multilingual_v2")
            output_filename: Optional custom filename (without extension)
        
        Returns:
            Path to the generated audio file
        """
        try:
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
            
            print(f"Audio generated successfully: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"Error generating speech: {str(e)}")
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

