from services.llm_service import get_llm_service


async def personalize_prompt(raw_response: str) -> str:
    """Make LLM output sound personal (first-person)."""
    personalization_instruction = "make this sound personal, speak in first person"
    response = await get_llm_service().chat(
        system_prompt=personalization_instruction, user_prompt=raw_response
    )
    return response.content
