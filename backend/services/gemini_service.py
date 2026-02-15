from typing import Optional
from ..core.config import settings
import google.generativeai as genai


class GeminiService:
    """Wrapper around Google Gemini API that follows the project's
    service pattern (matches `LLMService` and `ElevenLabsService`).

    - Validates required env vars on init
    - Exposes an async `chat` method that returns the generated text
    """

    DEFAULT_MODEL_ID = "gemini-2.5-flash"

    def __init__(self, model_id: str | None = None):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set in environment variables")

        self.model_id = model_id or self.DEFAULT_MODEL_ID
        self.api_key = settings.GEMINI_API_KEY

        # Configure the Gemini API
        genai.configure(api_key=self.api_key)

        # Create the model instance
        self.model = genai.GenerativeModel(self.model_id)

    async def chat(
        self,
        system_prompt: str,
        user_prompt: Optional[str] = None,
        *,
        temperature: float = 0.5,
        max_output_tokens: int = 200,
        top_p: float = 0.9,
    ) -> str:
        """Send a chat request to Gemini API.

        Args:
            system_prompt: System instructions for the model
            user_prompt: User's message/question
            temperature: Controls randomness (0.0-1.0)
            max_output_tokens: Maximum tokens in response
            top_p: Nucleus sampling parameter

        Returns:
            Generated text response
        """
        # Combine system prompt and user prompt
        if user_prompt:
            full_prompt = f"{system_prompt}\n\nUser: {user_prompt}"
        else:
            full_prompt = system_prompt

        # Configure generation parameters
        generation_config = genai.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            top_p=top_p,
        )

        # Generate response asynchronously
        response = await self.model.generate_content_async(
            full_prompt,
            generation_config=generation_config,
        )

        return response.text

    async def generate_response(
        self,
        prompt: str,
        context: str,
        system_instruction: str = "Talk as if you were speaking in first person about your own memories and experiences."
    ) -> str:
        """
        Generate a conversational response using Gemini.
        Async method for Memory Mirror use case.

        Args:
            prompt: The user's question/prompt
            context: Video summary/context from Twelve Labs
            system_instruction: Instructions for response generation

        Returns:
            Generated text response
        """
        try:
            # Construct the full prompt with context and instructions
            full_system_prompt = f"""
{system_instruction}

Context from your memory:
{context}

Please respond naturally in first person, as if you're recalling and talking about your own memory.
"""

            print(f"🤖 Generating response for prompt: '{prompt[:50]}...'")

            # Call the chat method
            response_text = await self.chat(
                system_prompt=full_system_prompt,
                user_prompt=prompt,
                max_output_tokens=500,
                temperature=0.7
            )

            print(f"✅ Response generated successfully")

            return response_text

        except Exception as e:
            print(f"❌ Error generating response: {str(e)}")
            raise

    async def generate_simple_response(self, prompt: str) -> str:
        """
        Generate a simple response without context.
        Async method for basic text generation.

        Args:
            prompt: The user's question/prompt

        Returns:
            Generated text response
        """
        try:
            print(f"🤖 Generating simple response for: '{prompt[:50]}...'")

            system_prompt = "You are a helpful assistant. Provide clear and concise answers."

            response_text = await self.chat(
                system_prompt=system_prompt,
                user_prompt=prompt,
                max_output_tokens=300,
                temperature=0.5
            )

            print(f"✅ Response generated successfully")
            return response_text

        except Exception as e:
            print(f"❌ Error generating response: {str(e)}")
            raise


# singleton instance
_service_instance: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Get or create the Gemini service instance."""
    global _service_instance
    if _service_instance is None:
        _service_instance = GeminiService()
    return _service_instance

