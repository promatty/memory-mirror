from typing import Any, List

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_PREFIX: str = "/api"
    DEBUG: bool = True
    ALLOWED_ORIGINS: str | List[str] = ""

    # twelve labs credentials
    TWELVE_LABS_API_KEY: str = ""
    TWELVE_LABS_INDEX_ID: str = ""

    # elevenlabs credentials
    ELEVENLABS_API_KEY: str = ""

    # watsonx credentials
    WATSONX_API_KEY: str = ""
    WATSONX_PROJECT_ID: str = ""

    # gemini credentials
    GEMINI_API_KEY: str = ""

    # mem0 (external memory store)
    MEM0_API_KEY: str = ""
    MEM0_USER_ID: str = "local_user"
    MEM0_API_URL: str | None = None


    @field_validator("ALLOWED_ORIGINS")
    @classmethod
    def parse(cls, v: Any) -> List[str]:
        if isinstance(v, list):
            return [str(x) for x in v]

        if isinstance(v, str):
            return v.split(",") if v else []

        return []
        
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = 'ignore'

settings = Settings()
