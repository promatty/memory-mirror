from fastapi import APIRouter, HTTPException
import time
from datetime import datetime

from ..models.schemas import (
    TestRequest,
    TestResponse,
)

from ..core.models import TwelveLabsModel

router = APIRouter(
    prefix="/test",
    tags=["test-endpoint"]
)

@router.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@router.post("/test", response_model=TestResponse)
async def test_endpoint(request: TestRequest):
    """A simple test endpoint that echoes back the input"""
    # Simulate some processing time
    time.sleep(1)

    # Example of using the TwelveLabsModel to get a client (not used in this test endpoint)
    try:
        twelve_labs_client = TwelveLabsModel.get_twelve_labs_client()
        # You can add some test calls to the client here if needed
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return TestResponse(test=f"Received: {request.test}")