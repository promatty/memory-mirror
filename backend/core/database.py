"""Database service for video analysis operations."""

from typing import Optional
from prisma import Prisma
from prisma.models import VideoAnalysis

# Global Prisma client instance
db = Prisma()


class DatabaseService:
    """Service class for database operations related to video analysis."""
    
    async def create_video_analysis(
        self, 
        video_id: str, 
        description: str
    ) -> VideoAnalysis:
        """
        Create a new video analysis record.
        
        Args:
            video_id: The unique identifier for the video from Twelve Labs
            description: The AI-generated description of the video
            
        Returns:
            VideoAnalysis: The created video analysis record
        """
        analysis = await db.videoanalysis.create(
            data={
                'videoId': video_id,
                'description': description,
            }
        )
        
        return analysis
    
    async def get_video_analysis(self, video_id: str) -> Optional[VideoAnalysis]:
        """
        Retrieve a video analysis by video ID.
        
        Args:
            video_id: The unique identifier for the video
            
        Returns:
            VideoAnalysis or None: The video analysis record if found
        """
        analysis = await db.videoanalysis.find_unique(
            where={'videoId': video_id}
        )
        
        return analysis
    
    async def update_video_analysis(
        self, 
        video_id: str, 
        description: str
    ) -> Optional[VideoAnalysis]:
        """
        Update an existing video analysis.
        
        Args:
            video_id: The unique identifier for the video
            description: The updated description
            
        Returns:
            VideoAnalysis or None: The updated video analysis record
        """
        analysis = await db.videoanalysis.update(
            where={'videoId': video_id},
            data={'description': description}
        )
        
        return analysis
    
    async def delete_video_analysis(self, video_id: str) -> bool:
        """
        Delete a video analysis record.
        
        Args:
            video_id: The unique identifier for the video
            
        Returns:
            bool: True if deleted successfully, False otherwise
        """
        try:
            await db.videoanalysis.delete(
                where={'videoId': video_id}
            )
            return True
        except Exception:
            return False
    
    async def list_video_analyses(self, limit: int = 100) -> list[VideoAnalysis]:
        """
        List all video analyses.
        
        Args:
            limit: Maximum number of records to return
            
        Returns:
            list[VideoAnalysis]: List of video analysis records
        """
        analyses = await db.videoanalysis.find_many(
            take=limit,
            order={'createdAt': 'desc'}
        )
        
        return analyses


# Global database service instance
db_service = DatabaseService()

