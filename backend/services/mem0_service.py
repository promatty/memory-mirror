from typing import Any, Dict, List, Optional
from mem0 import MemoryClient
from ..core.config import settings

class Mem0Service:
    def __init__(self):
        if not settings.MEM0_API_KEY:
            raise ValueError("MEM0_API_KEY is not set in environment variables")
        self.client = MemoryClient(api_key=settings.MEM0_API_KEY)

    def add(self, messages: List[Dict[str, Any]], user_id: str = "unknown") -> Dict[str, Any]:
        """Add messages to mem0."""
        try:
            result = self.client.add(messages, user_id=user_id)
            return result
        except Exception as e:
            raise e

    def search(self, query: str, version: str = "v2", filters: Optional[Dict[str, Any]] = None, limit: int = 10) -> Dict[str, Any]:
        """Search mem0."""
        try:
            results = self.client.search(query, version=version, filters=filters, limit=limit)
            return results
        except Exception as e:
            raise e

# Singleton instance
_service_instance = None

def get_mem0_service() -> Mem0Service:
    """Get or create Mem0 service instance."""
    global _service_instance
    if _service_instance is None:
        _service_instance = Mem0Service()
    return _service_instance
