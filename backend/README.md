# Memory Mirror Backend

FastAPI backend for the Memory Mirror platform - a system for uploading personal video memories and conversing with an AI clone that speaks in your own voice.

## Quick Start

### Prerequisites
- Python 3.11+
- uv package manager: https://docs.astral.sh/uv/getting-started/installation/

### Installation

1. **Install dependencies**:
   ```bash
   uv sync
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

3. **Set up database**:
   ```bash
   # Install Prisma
   pip install prisma
   
   # Generate Prisma client
   python -m prisma generate
   
   # Create database
   DATABASE_URL="file:./dev.db" python -m prisma db push
   ```

4. **Run the development server**:
   ```bash
   uv run fastapi dev main.py
   ```

5. **View API documentation**:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Python Interpreter Setup (VS Code)

1. Open command palette (Ctrl+Shift+P)
2. Search for "Python: Select Interpreter"
3. Choose "Enter interpreter path"
4. Navigate to `.venv/Scripts/python.exe` (Windows) or `.venv/bin/python` (Unix)

## Project Structure

```
backend/
├── core/
│   ├── config.py          # Configuration and settings
│   ├── database.py        # Database service layer
│   └── models.py          # Core data models
├── models/
│   └── schemas.py         # Pydantic request/response schemas
├── routers/
│   ├── test.py           # Test endpoints
│   └── video_analysis.py # Video analysis CRUD endpoints
├── prisma/
│   └── schema.prisma     # Database schema definition
├── main.py               # FastAPI application entry point
└── pyproject.toml        # Project dependencies
```

## Features

### Video Analysis Database (Prisma)
Store and manage AI-generated descriptions of video memories.

**API Endpoints:**
- `POST /api/video-analysis/` - Create new video analysis
- `GET /api/video-analysis/{video_id}` - Get analysis by video ID
- `PUT /api/video-analysis/{video_id}` - Update analysis
- `DELETE /api/video-analysis/{video_id}` - Delete analysis
- `GET /api/video-analysis/` - List all analyses

**Example:**
```bash
# Create a video analysis
curl -X POST http://localhost:8000/api/video-analysis/ \
  -H "Content-Type: application/json" \
  -d '{"video_id": "video123", "description": "A beautiful sunset"}'
```

### External Service Integration
- **Twelve Labs**: Video intelligence and semantic search
- **ElevenLabs**: Voice cloning and text-to-speech
- **Claude/GPT-4**: LLM response generation

## Documentation

- 📄 [Database Setup Guide](DATABASE_SETUP.md) - Prisma configuration and usage
- 📄 [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Detailed implementation overview
- 📄 [Architecture](ARCHITECTURE.md) - System architecture and data flow diagrams

## Database Configuration

### Development (SQLite)
```bash
DATABASE_URL=file:./dev.db
```

### Production (PostgreSQL)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/memory_mirror
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Environment Variables

See `.env.example` for all available configuration options:

```bash
# Server
API_PREFIX=/api
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000

# Database
DATABASE_URL=file:./dev.db

# External APIs
TWELVE_LABS_API_KEY=your_key_here
TWELVE_LABS_INDEX_ID=your_index_id_here
ELEVENLABS_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here  # If using Claude
OPENAI_API_KEY=your_key_here     # If using GPT-4
```

## Development

### Adding Dependencies
```bash
uv add <package-name>
```

### Database Migrations
```bash
# Generate migration
python -m prisma migrate dev --name description_of_change

# Apply migrations
python -m prisma migrate deploy
```

### Code Style
- Follow FastAPI best practices
- Use async/await for all route handlers
- Use Pydantic models for validation
- Add type hints throughout

## Testing

Run the health check endpoint:
```bash
curl http://localhost:8000/api/test/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-15T01:50:48.155146"
}
```

## Troubleshooting

### Database Connection Issues
If you encounter "Unable to open the database file":
- Ensure `DATABASE_URL` is set correctly
- Use absolute paths for SQLite: `file:/absolute/path/to/dev.db`
- Check file permissions

### Import Errors
If you get module import errors:
1. Ensure you're in the project root directory
2. Run `uv sync` to install dependencies
3. Verify Python interpreter is set to the venv

### Prisma Client Not Found
```bash
pip install prisma
python -m prisma generate
```

## Production Deployment

1. Switch from SQLite to PostgreSQL
2. Set proper environment variables
3. Use production-grade server (Gunicorn/Uvicorn)
4. Enable HTTPS
5. Set up database backups
6. Configure monitoring and logging

## Contributing

This is a hackathon project for CalgaryHacks. Prioritize working demos over perfect abstractions.

## License

[Your License Here]

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Prisma Python Client](https://prisma-client-py.readthedocs.io/)
- [Twelve Labs API](https://docs.twelvelabs.io/)
- [ElevenLabs API](https://elevenlabs.io/docs/)

