from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import time

from ..core.config import settings

# mem0 Python client (synchronous)
from ..services.mem0_service import get_mem0_service, Mem0Service

router = APIRouter(
    prefix="/mem0",
    tags=["mem0"]
)


class Mem0AddRequest(BaseModel):
    messages: Optional[List[Dict[str, Any]]] = None
    content: Optional[str] = None
    user_id: Optional[str] = None


class Mem0SearchRequest(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = None
    version: Optional[str] = "v2"
    limit: Optional[int] = 10


@router.post("/add")
def add_to_mem0(req: Mem0AddRequest):
    """Add messages (or a single content string) to mem0.
    """
    try:
        service = get_mem0_service()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    messages = req.messages
    if not messages:
        if not req.content:
            raise HTTPException(status_code=400, detail="Either 'messages' or 'content' is required")
        messages = [{"role": "user", "content": req.content}]

    try:
        start = time.perf_counter()
        result = service.add(messages, user_id=req.user_id or "unknown")
        elapsed_ms = (time.perf_counter() - start) * 1000
        print(f"timing: mem0.add took {elapsed_ms:.1f} ms for user_id={req.user_id or 'unknown'}")
        return {"success": True, "result": result}
    except Exception as e:
        print(f"timing: mem0.add failed after {(time.perf_counter() - start) * 1000:.1f} ms")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
def search_mem0(req: Mem0SearchRequest):
    """Search mem0.
    """
    try:
        service = get_mem0_service()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        start = time.perf_counter()
        results = service.search(req.query, version=req.version, filters=req.filters, limit=req.limit)
        elapsed_ms = (time.perf_counter() - start) * 1000
        print(f"timing: mem0.search took {elapsed_ms:.1f} ms for query={req.query!r} limit={req.limit}")
        return {"success": True, "result": results}
    except Exception as e:
        print(f"timing: mem0.search failed after {(time.perf_counter() - start) * 1000:.1f} ms")
        raise HTTPException(status_code=500, detail=str(e))