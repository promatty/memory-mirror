import base64
import json
import re
from http import HTTPStatus
from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from ..core.config import settings
from ..core.models import TwelveLabsModel
from ..services.elevenlabs_service import get_elevenlabs_service
from ..services.gemini_service import get_gemini_service
from ..services.llm_service import get_llm_service
from ..services.mem0_service import get_mem0_service

router = APIRouter(prefix="/conversation", tags=["conversation-endpoint"])


class QueryMemoryRequest(BaseModel):
    user_prompt: str
    indexed_asset_id: str  # From Next.js after DB query
    analysis_text: str  # From Next.js after DB query


class QueryMemoryResponse(BaseModel):
    success: bool
    video_url: Optional[str] = None
    audio_base64: Optional[str] = None
    narrative: Optional[str] = None
    alignment: Optional[Dict[str, Any]] = None  # Word-level timing data
    message: Optional[str] = None
    error: Optional[str] = None


class SuggestedQuestionsRequest(BaseModel):
    analysis_texts: List[str]


class SuggestedQuestionsResponse(BaseModel):
    questions: List[str]


def _strip_code_fence(text: str) -> str:
    lines = text.strip().splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].startswith("```"):
        lines = lines[:-1]
    return "\n".join(lines).strip()


def _parse_questions(raw_text: str) -> List[str]:
    cleaned = _strip_code_fence(raw_text)
    json_candidate = cleaned

    first_bracket = cleaned.find("[")
    last_bracket = cleaned.rfind("]")
    if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
        json_candidate = cleaned[first_bracket : last_bracket + 1]

    try:
        parsed = json.loads(json_candidate)
        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed if str(item).strip()]
    except json.JSONDecodeError:
        pass

    quoted = [match.strip() for match in re.findall(r"\"([^\"]+)\"", cleaned)]
    if quoted:
        return [item for item in quoted if item]

    lines = [line.strip("- ") for line in cleaned.splitlines()]
    return [line for line in lines if line and line not in {"[", "]"}]


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
        mem_client = get_mem0_service()

        # Assume the search result has a `memory` attribute, then log it (direct access as requested)
        memory_context = (
            mem_client.search(
                request.user_prompt,
                version="v2",
                filters={"user_id": settings.MEM0_USER_ID},
                limit=5,
            )
        )

        
        print(memory_context["results"])
        newMemoryContextList = [s["memory"] + "\n" for s in memory_context["results"]]
        print(
            f"🧠 memory_context (len={len(newMemoryContextList)}): {newMemoryContextList[:500]}{'...' if len(newMemoryContextList) > 500 else ''}"
        )

        narrative = await llm_service.generate_response(
            prompt=request.user_prompt,
            context=request.analysis_text + "\n" + "".join(newMemoryContextList),
            system_instruction="Talk as if you were speaking in first person about your own memories and experiences. In your response, there will a be a bunch of keywords and metadata, "
            "shape your response around those keywords and metadata that are in the analysis text.",
        )

        mem_client.add(
            messages=[{"role": "user", "content": f"{narrative}"}],
            user_id=settings.MEM0_USER_ID,
        )

        print(f"✅ Generated narrative ({len(narrative)} chars)")

        # Step 3: Generate audio with alignment using ElevenLabs
        print("🎤 Generating audio with word-level alignment...")
        tts_service = get_elevenlabs_service()

        # Use the new method that returns alignment data
        tts_result = tts_service.text_to_speech_with_alignment(
            text=narrative,
            voice="wlUCbyBjJciHgW8SIZWH",  # Justin voice
        )

        audio_base64 = tts_result["audio_base64"]
        alignment = tts_result["alignment"]
        print(f"✅ Generated audio with alignment ({len(audio_base64)} chars base64)")

        # Step 4: Return success response
        return QueryMemoryResponse(
            success=True,
            video_url=video_url,
            audio_base64=audio_base64,
            narrative=narrative,
            alignment=alignment,
        )

    except Exception as e:
        print(f"❌ Error in generate_response: {str(e)}")
        return QueryMemoryResponse(
            success=False,
            message=f"Failed to generate response: {str(e)}",
            error=str(e),
        )


@router.post("/suggest-questions", response_model=SuggestedQuestionsResponse)
async def suggest_questions(request: SuggestedQuestionsRequest):
    """
    Generate suggested questions based on stored analysis texts.

    This endpoint:
    1. Receives a list of analysis texts from Next.js
    2. Uses Gemini to generate short, natural suggested questions
    3. Returns an array of 3 questions that are relevant to the user's memories and the video content and should be 10 words or less
    """
    prompt = (
        "You are generating suggested questions for a personal memory app. Also, for the memories, if there are any specific names, places, times, etc. Please ask them in the questions."
        "Given the memory summaries below, produce 3 short, specific questions that are 8 words or less "
        "the user might ask. Return ONLY a JSON array of strings on a single line, "
        "no extra text. Do not use code fences."
    )

    try:
        gemini_service = get_gemini_service()
        response_text = await gemini_service.chat(
            system_prompt=prompt,
            user_prompt=request.analysis_texts,
            max_output_tokens=3000,
            temperature=0.4,
        )

        print(f"Generated response: {response_text}")

        questions = _parse_questions(response_text)
        return SuggestedQuestionsResponse(questions=questions[:3])
    except Exception as e:
        print(f"❌ Error generating suggested questions: {str(e)}")
        return SuggestedQuestionsResponse(questions=[])
