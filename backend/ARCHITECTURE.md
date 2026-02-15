# Prisma Database Architecture - Memory Mirror

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│                     User Interface & Interactions                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/REST API Calls
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (main.py)                     │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                API Routers & Endpoints                   │   │
│  │  • /api/test/* (test.py)                                │   │
│  │  • /api/video-analysis/* (video_analysis.py)            │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                        │
│                         ▼                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │             Database Service (database.py)              │   │
│  │  Methods:                                               │   │
│  │  • create_video_analysis(video_id, description)         │   │
│  │  • get_video_analysis(video_id)                         │   │
│  │  • update_video_analysis(video_id, description)         │   │
│  │  • delete_video_analysis(video_id)                      │   │
│  │  • list_video_analyses(limit)                           │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                        │
│                         ▼                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Prisma Client (ORM Layer)                  │   │
│  │  • Type-safe database queries                           │   │
│  │  • Automatic migrations                                 │   │
│  │  • Connection management                                │   │
│  └──────────────────────┬──────────────────────────────────┘   │
└───────────────────────┬─┴──────────────────────────────────────┘
                        │
                        │ SQL Queries
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database (SQLite/PostgreSQL)                  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            Table: video_analysis                         │   │
│  │  ┌────────────┬──────────────────────────────────────┐  │   │
│  │  │ Column     │ Type                                 │  │   │
│  │  ├────────────┼──────────────────────────────────────┤  │   │
│  │  │ id         │ String (CUID, Primary Key)          │  │   │
│  │  │ videoId    │ String (Unique, indexed)            │  │   │
│  │  │ description│ String (Video analysis text)        │  │   │
│  │  │ createdAt  │ DateTime (Auto-generated)           │  │   │
│  │  │ updatedAt  │ DateTime (Auto-updated)             │  │   │
│  │  └────────────┴──────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

                              ▲
                              │
                              │ Generated from
                              │
┌─────────────────────────────────────────────────────────────────┐
│              Prisma Schema (schema.prisma)                       │
│                                                                   │
│  datasource db {                                                 │
│    provider = "sqlite"                                           │
│    url      = env("DATABASE_URL")                               │
│  }                                                               │
│                                                                   │
│  generator client {                                              │
│    provider = "prisma-client-py"                                │
│  }                                                               │
│                                                                   │
│  model VideoAnalysis {                                           │
│    id          String   @id @default(cuid())                    │
│    videoId     String   @unique                                 │
│    description String                                            │
│    createdAt   DateTime @default(now())                         │
│    updatedAt   DateTime @updatedAt                              │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
                            API Flow Example
═══════════════════════════════════════════════════════════════════

1. CREATE VIDEO ANALYSIS
   ┌──────────┐
   │ Frontend │ POST /api/video-analysis/
   └─────┬────┘ {"video_id": "abc123", "description": "..."}
         │
         ▼
   ┌──────────────┐
   │ API Router   │ video_analysis.create_video_analysis()
   └──────┬───────┘
         │
         ▼
   ┌──────────────┐
   │ DB Service   │ db_service.create_video_analysis()
   └──────┬───────┘
         │
         ▼
   ┌──────────────┐
   │ Prisma Client│ db.videoanalysis.create()
   └──────┬───────┘
         │
         ▼
   ┌──────────────┐
   │   Database   │ INSERT INTO video_analysis ...
   └──────┬───────┘
         │
         ▼
   Response: {
     "id": "cmln...",
     "video_id": "abc123",
     "description": "...",
     "created_at": "2026-02-15T...",
     "updated_at": "2026-02-15T..."
   }

2. GET VIDEO ANALYSIS
   GET /api/video-analysis/{video_id}
   → db_service.get_video_analysis(video_id)
   → db.videoanalysis.find_unique(where={'videoId': video_id})
   → SELECT * FROM video_analysis WHERE videoId = ?
   → Returns analysis record or 404

3. UPDATE VIDEO ANALYSIS
   PUT /api/video-analysis/{video_id}
   → db_service.update_video_analysis(video_id, description)
   → db.videoanalysis.update(where={'videoId': video_id}, data={...})
   → UPDATE video_analysis SET description = ?, updatedAt = ? WHERE videoId = ?
   → Returns updated record

4. LIST ALL ANALYSES
   GET /api/video-analysis/?limit=100
   → db_service.list_video_analyses(limit)
   → db.videoanalysis.find_many(take=limit, order={'createdAt': 'desc'})
   → SELECT * FROM video_analysis ORDER BY createdAt DESC LIMIT ?
   → Returns array of analyses

═══════════════════════════════════════════════════════════════════
                        Integration Points
═══════════════════════════════════════════════════════════════════

Memory Mirror Workflow with Database:

1. Video Upload (Twelve Labs)
   ┌──────────┐     ┌──────────────┐     ┌──────────┐
   │  User    │────▶│ Twelve Labs  │────▶│ Database │
   └──────────┘     └──────────────┘     └──────────┘
                    • Upload video       • Store analysis
                    • Generate embedding • Link to video_id
                    • Extract features   • Save description

2. Conversational Query
   ┌──────────┐     ┌──────────────┐     ┌──────────┐
   │  User    │────▶│ Search Index │────▶│ Database │
   └──────────┘     └──────────────┘     └──────────┘
                    • Semantic search    • Retrieve stored
                    • Find relevant        analysis
                      videos             • Enhance context

3. LLM Response Generation
   ┌──────────┐     ┌──────────┐     ┌──────────────┐
   │ Database │────▶│   LLM    │────▶│  ElevenLabs  │
   └──────────┘     └──────────┘     └──────────────┘
   • Retrieved      • Generate       • Text-to-speech
     analysis         response       • Clone voice
   • Video context  • First person

═══════════════════════════════════════════════════════════════════
                        Configuration
═══════════════════════════════════════════════════════════════════

Environment Variables (.env):
┌────────────────────────────────────────────────────────────────┐
│ Development (SQLite):                                          │
│   DATABASE_URL=file:./dev.db                                  │
│                                                                │
│ Production (PostgreSQL):                                       │
│   DATABASE_URL=postgresql://user:pass@host:5432/memory_mirror │
└────────────────────────────────────────────────────────────────┘

Setup Commands:
┌────────────────────────────────────────────────────────────────┐
│ 1. Install: pip install prisma                                │
│ 2. Generate: python -m prisma generate                        │
│ 3. Migrate: python -m prisma db push                          │
│ 4. Start: uvicorn backend.main:app --reload                   │
└────────────────────────────────────────────────────────────────┘
```
