# Prisma Database Setup

This document describes the Prisma database configuration for storing video analysis results in the Memory Mirror backend.

## Overview

The Memory Mirror backend uses **Prisma** as an ORM to store and manage video analysis results. Each video analysis contains:
- A unique ID (generated automatically)
- The video ID from Twelve Labs
- An AI-generated description of the video
- Timestamps for creation and updates

## Database Schema

The database schema is defined in `backend/prisma/schema.prisma`:

```prisma
model VideoAnalysis {
  id          String   @id @default(cuid())
  videoId     String   @unique
  description String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("video_analysis")
}
```

## Configuration

### Environment Variables

Add the following to your `backend/.env` file:

```bash
DATABASE_URL=file:./dev.db
```

For production with PostgreSQL:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/memory_mirror
```

### Database Provider

The default configuration uses **SQLite** for development. For production, you can switch to PostgreSQL by updating the `datasource` in `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite" to "postgresql"
  url      = env("DATABASE_URL")
}
```

## Setup Instructions

### 1. Install Dependencies

Prisma is already included in the project dependencies:

```bash
cd backend
pip install prisma
```

### 2. Generate Prisma Client

Generate the Prisma client based on the schema:

```bash
python -m prisma generate
```

### 3. Create the Database

Push the schema to create the database and tables:

```bash
DATABASE_URL="file:./dev.db" python -m prisma db push
```

For production (PostgreSQL):
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/memory_mirror" python -m prisma db push
```

## API Endpoints

The video analysis API provides the following endpoints:

### Create Video Analysis
```bash
POST /api/video-analysis/
Content-Type: application/json

{
  "video_id": "test_video_001",
  "description": "A beautiful sunset over the ocean"
}
```

### Get Video Analysis
```bash
GET /api/video-analysis/{video_id}
```

### Update Video Analysis
```bash
PUT /api/video-analysis/{video_id}
Content-Type: application/json

{
  "description": "Updated description"
}
```

### Delete Video Analysis
```bash
DELETE /api/video-analysis/{video_id}
```

### List All Video Analyses
```bash
GET /api/video-analysis/?limit=100
```

## Usage Examples

### Creating a Video Analysis

```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8000/api/video-analysis/",
        json={
            "video_id": "67890abcdef",
            "description": "Family vacation in Paris, featuring the Eiffel Tower"
        }
    )
    print(response.json())
```

### Retrieving a Video Analysis

```python
async with httpx.AsyncClient() as client:
    response = await client.get(
        "http://localhost:8000/api/video-analysis/67890abcdef"
    )
    print(response.json())
```

## Database Service

The `DatabaseService` class in `backend/core/database.py` provides methods for:
- `create_video_analysis(video_id, description)` - Create a new record
- `get_video_analysis(video_id)` - Retrieve by video ID
- `update_video_analysis(video_id, description)` - Update description
- `delete_video_analysis(video_id)` - Delete a record
- `list_video_analyses(limit)` - List all records

## Migration Strategy

For future schema changes:

1. Update the schema in `prisma/schema.prisma`
2. Generate a migration:
   ```bash
   python -m prisma migrate dev --name description_of_change
   ```
3. Apply to production:
   ```bash
   python -m prisma migrate deploy
   ```

## Testing

The implementation has been tested with the following scenarios:
- ✅ Create video analysis records
- ✅ Retrieve video analysis by video ID
- ✅ Update video analysis descriptions
- ✅ List all video analyses
- ✅ Handle non-existent video IDs gracefully

## Troubleshooting

### Database Connection Issues

If you encounter "Unable to open the database file" errors:
1. Ensure the `DATABASE_URL` environment variable is set correctly
2. Use absolute paths for SQLite: `file:/absolute/path/to/dev.db`
3. Check file permissions on the database file

### Prisma Client Not Found

If you get "Module not found: prisma":
1. Ensure Prisma is installed: `pip install prisma`
2. Generate the client: `python -m prisma generate`
3. Restart your development server

## Production Considerations

For production deployment:
1. Switch from SQLite to PostgreSQL
2. Use connection pooling
3. Set up regular database backups
4. Use migrations instead of `db push`
5. Configure proper indexes for performance
6. Set up monitoring for database health

## References

- [Prisma Python Docs](https://prisma-client-py.readthedocs.io/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [FastAPI with Prisma](https://prisma-client-py.readthedocs.io/en/stable/getting_started/setup/)
