from pydantic import BaseModel
from .config import settings
from twelvelabs import TwelveLabs


class TwelveLabsModel(BaseModel):
    @classmethod
    def get_twelve_labs_client(cls):
        api_key = settings.TWELVE_LABS_API_KEY

        if api_key:
            client = TwelveLabs(api_key=api_key, timeout=180)
            return client

        raise ValueError("Twelve Labs client configuration is incomplete.")
