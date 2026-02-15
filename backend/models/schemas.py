from pydantic import BaseModel
from typing import Optional, List, Literal

# ---------- Requests should be here ----------
class TestRequest(BaseModel):
    test: str


# ---------- Responses should be here ----------
class TestResponse(BaseModel):
    test: str
