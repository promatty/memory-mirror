from typing import Any, Optional, Awaitable
from ..core.config import settings

from ibm_watsonx_ai.foundation_models.schema import TextChatParameters
from langchain_ibm import ChatWatsonx

class LLMService:
    """Wrapper around Watsonx `ChatWatsonx` that follows the project's
    service pattern (matches `ElevenLabsService`).

    - Validates required env vars on init
    - Exposes an async `chat` method that returns the SDK response object
    """

    DEFAULT_URL = "https://ca-tor.ml.cloud.ibm.com"
    DEFAULT_MODEL_ID = "mistralai/mistral-small-3-1-24b-instruct-2503"

    def __init__(self, model_id: str | None = None, url: Optional[str] = None):
        if not settings.WATSONX_API_KEY:
            raise ValueError("WATSONX_API_KEY is not set in environment variables")
        if not settings.WATSONX_PROJECT_ID:
            raise ValueError("WATSONX_PROJECT_ID is not set in environment variables")

        # basic sanitization of project id
        self.model_id = model_id or self.DEFAULT_MODEL_ID
        # prefer explicit setting in Settings if present
        self.url = getattr(settings, "WATSONX_URL", None) or url or self.DEFAULT_URL
        self.project_id = settings.WATSONX_PROJECT_ID
        self.apikey = settings.WATSONX_API_KEY

        # create a baseline client (call-specific params will create ephemeral clients)
        self.client = ChatWatsonx(
            model_id=self.model_id,
            url=self.url,
            project_id=self.project_id,
            apikey=self.apikey,
        )

    def chat(
        self,
        system_prompt: str,
        user_prompt: Optional[str] = None,
        *,
        top_p: float = 0.9,
        temperature: float = 0.5,
        max_completion_tokens: int = 200,
    ) -> Awaitable[Any]:
        """Return an awaitable for a Watsonx chat request.

        Callers should `await service.chat(...)` from async code or use
        `asyncio.run(service.chat(...))` from sync scripts.
        """
        params = TextChatParameters(
            top_p=top_p,
            temperature=temperature,
            max_completion_tokens=max_completion_tokens,
        )
        client = ChatWatsonx(
            model_id=self.model_id,
            url=self.url,
            project_id=self.project_id,
            params=params,
            apikey=self.apikey,
        )

        messages = [("system", system_prompt)]
        if user_prompt:
            messages.append(("user", user_prompt))

        return client.ainvoke(messages)

    async def generate_response(
        self,
        prompt: str,
        context: str,
        system_instruction: str = "Talk as if you were speaking in first person about your own memories and experiences."
    ) -> str:
        """
        Generate a conversational response using WatsonX LLM.
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

            # Await the async chat method
            response = await self.chat(
                system_prompt=full_system_prompt,
                user_prompt=prompt,
                max_completion_tokens=500,
                temperature=0.7
            )

            generated_text = response.content
            print(f"✅ Response generated successfully")

            return generated_text

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

            response = await self.chat(
                system_prompt=system_prompt,
                user_prompt=prompt,
                max_completion_tokens=300,
                temperature=0.5
            )

            generated_text = response.content

            print(f"✅ Response generated successfully")
            return generated_text

        except Exception as e:
            print(f"❌ Error generating response: {str(e)}")
            raise


# singleton instance
_service_instance: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """Get or create the LLM service instance."""
    global _service_instance
    if _service_instance is None:
        _service_instance = LLMService()
    return _service_instance


if __name__ == "__main__":
    # simple demo so module can be executed from project root
    import asyncio

    from dotenv import load_dotenv

    load_dotenv()

    svc = get_llm_service()
    system_prompt = (
        "You are a helpful assistant that provides information about the weather."
    )
    user_prompt = "What's the weather like in New York today?"

    resp = asyncio.run(svc.chat(system_prompt, user_prompt))
    print(resp)
