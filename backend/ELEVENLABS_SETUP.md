# ElevenLabs TTS Integration

## Setup Complete ✅

The ElevenLabs Text-to-Speech API has been successfully integrated into the memory-mirror backend.

## Structure

```
backend/
├── services/
│   └── elevenlabs_service.py    # Main TTS service
├── tests/
│   └── test_tts.py              # Test suite
├── examples/
│   └── elevenlabs_example.py    # Usage examples
├── output/                      # Generated audio files (MP3)
└── .env                         # API keys (ELEVENLABS_API_KEY)
```

## Configuration

### Environment Variables
Add to `backend/.env`:
```bash
ELEVENLABS_API_KEY=your_api_key_here
```

### Dependencies
- `elevenlabs>=1.0.0` (installed via pyproject.toml)

## Usage

### Basic Usage

```python
from services.elevenlabs_service import get_elevenlabs_service

# Get service instance
service = get_elevenlabs_service()

# Convert text to speech
audio_path = service.text_to_speech(
    text="Hello from memory-mirror",
    output_filename="my_audio"  # Optional
)

print(f"Audio saved to: {audio_path}")
```

### Parameters

- `text` (str): The text to convert to speech
- `voice` (str): Voice ID (default: "21m00Tcm4TlvDq8ikWAM" - Rachel)
- `model` (str): Model to use (default: "eleven_multilingual_v2")
- `output_filename` (str): Custom filename without extension (optional)

### Output

- Format: MP3 (44.1kHz, 128kbps)
- Location: `backend/output/`
- Auto-generated filename if not specified

## Testing

Run the test suite:
```bash
cd backend
uv run python -m tests.test_tts
```

Run examples:
```bash
cd backend
uv run python -m examples.elevenlabs_example
```

## Test Results

✅ All tests passed:
- Basic TTS: ✅ PASSED
- Custom Text: ✅ PASSED

Generated files:
- `test_hello.mp3` (26 KB)
- `test_custom.mp3` (123 KB)

## Integration with Memory Mirror

The TTS service can be used in the conversation flow:

```
User Question → Twelve Labs Search → LLM Response → ElevenLabs TTS → Audio Playback
```

Example integration:
```python
# Generate LLM response
response_text = llm.generate_response(context)

# Convert to speech
audio_path = service.text_to_speech(
    text=response_text,
    output_filename=f"response_{timestamp}"
)

# Return audio path to frontend for playback
return {"audio_url": str(audio_path)}
```

## Notes

- Voice cloning is NOT implemented (as per requirements)
- Using preset voice ID: `21m00Tcm4TlvDq8ikWAM` (Rachel)
- SSL certificates fixed for macOS Python 3.14
- Singleton pattern for service instance
- Proper error handling and logging

## Troubleshooting

### SSL Certificate Error
If you encounter SSL certificate errors on macOS:
```bash
bash "/Applications/Python 3.14/Install Certificates.command"
```

### Voice Not Found
Make sure you're using a valid voice ID. The default voice ID is `21m00Tcm4TlvDq8ikWAM`.

### API Key Issues
Verify your API key is set in `.env` and has the necessary permissions for TTS.

