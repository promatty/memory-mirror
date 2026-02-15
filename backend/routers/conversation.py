from http import HTTPStatus
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import base64

from ..core.models import TwelveLabsModel
from ..core.config import settings
from ..services.llm_service import get_llm_service
from ..services.elevenlabs_service import get_elevenlabs_service

router = APIRouter(
    prefix="/conversation",
    tags=["conversation-endpoint"]
)

class QueryMemoryRequest(BaseModel):
    user_prompt: str
    indexed_asset_id: str  # From Next.js after DB query
    analysis_text: str  # From Next.js after DB query

class QueryMemoryResponse(BaseModel):
    success: bool
    video_url: Optional[str] = None
    audio_base64: Optional[str] = None
    narrative: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None

@router.post("/generate-response", response_model=QueryMemoryResponse)
async def generate_response(request: QueryMemoryRequest):
    """
    Generate AI response with narrative and audio for a matched video.
    
    This endpoint:
    1. Receives indexed_asset_id and analysis_text from Next.js
    2. Gets video URL from Twelve Labs
    3. Generates first-person narrative using LLM
    4. Generates audio using ElevenLabs TTS
    5. Returns video URL, audio (base64), and narrative text
    """
    try:
        print(f"🤖 Generating response for: {request.user_prompt[:50]}...")
        
        # Step 1: Get video URL from Twelve Labs
        print(f"📹 Fetching video URL for indexed_asset_id: {request.indexed_asset_id}")
        client = TwelveLabsModel.get_twelve_labs_client()
        
        indexed_asset = client.indexes.indexed_assets.retrieve(
            settings.TWELVE_LABS_INDEX_ID,
            request.indexed_asset_id,
        )
        
        if not indexed_asset or not indexed_asset.hls:
            return QueryMemoryResponse(
                success=False,
                message="Video URL not available",
            )
        
        video_url = indexed_asset.hls.video_url
        print(f"✅ Video URL retrieved: {video_url}")
        
        # Step 2: Generate first-person narrative using LLM
        print("🤖 Generating AI narrative...")
        llm_service = get_llm_service()

        narrative = await llm_service.generate_response(
            prompt=request.user_prompt,
            context=request.analysis_text,
            system_instruction="Talk as if you were speaking in first person about your own memories and experiences."
        )

        print(f"✅ Generated narrative ({len(narrative)} chars)")
        
        # Step 3: Generate audio using ElevenLabs
        print("🎤 Generating audio...")
        tts_service = get_elevenlabs_service()
        
        
        audio_path = tts_service.text_to_speech(
            text=narrative,
            voice="wlUCbyBjJciHgW8SIZWH",  # Justin voice
            output_filename=f"response_{request.indexed_asset_id[:8]}"
        )
        
        # Read audio file and convert to base64
        with open(audio_path, "rb") as audio_file:
            audio_bytes = audio_file.read()
            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
        
        print(f"✅ Generated audio ({len(audio_base64)} chars base64)")
        
        # Step 4: Return success response
        return QueryMemoryResponse(
            success=True,
            video_url=video_url,
            audio_base64=audio_base64,
            narrative=narrative,
        )
        
    except Exception as e:
        print(f"❌ Error in generate_response: {str(e)}")
        return QueryMemoryResponse(
            success=False,
            message=f"Failed to generate response: {str(e)}",
            error=str(e),
        )

