# Memory Mirror - Hackathon Project Instructions

## Project Overview

**Memory Mirror** is a platform to upload and view personal information about your life, featuring an AI clone with your voice so users can have conversations about their memories and life experiences.

### Core Concept
When someone wants to get to know you (or yourself) better, they can talk to your AI clone that has access to all your uploaded memories, videos, and personal context. Think of it as an interactive, conversational autobiography.

---

## Tech Stack (Final)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Video Intelligence** | Twelve Labs | Video upload, embedding generation, semantic search, metadata storage |
| **Voice Cloning & TTS** | ElevenLabs | Clone user's voice and generate audio responses |
| **Video Storage** | Twelve Labs (streaming enabled) | Store and serve video playback |
| **LLM Orchestration** | Claude API or GPT-4 | Generate conversational responses using retrieved context |
| **Frontend** | Your choice (React, Next.js, etc.) | User interface |

**Note:** We're NOT using ChromaDB or VideoDB - Twelve Labs handles all video intelligence and storage needs.

---

## Understanding Embeddings in Memory Mirror

### What Are Embeddings?
Embeddings are numerical vector representations of your video content that capture semantic meaning. Think of them as a way to convert visual scenes, audio, and speech into numbers that a computer can compare and search through.

### How Twelve Labs Uses Embeddings

**Automatic Embedding Generation:**
- When you upload a video to Twelve Labs, the platform automatically generates embeddings using the Marengo 3.0 model
- These embeddings capture:
  - **Visual information**: objects, scenes, actions, people, settings
  - **Audio information**: sounds, music, ambient noise
  - **Transcription**: spoken words and dialogue
- Embeddings are stored internally by Twelve Labs (you don't need to manage them)

**Why This Matters for Memory Mirror:**
1. **Semantic Search**: When a user asks "Tell me about my trip to China with Sarah", the query is converted to an embedding and compared against your video embeddings
2. **Context Matching**: The system finds videos where the visual content, audio, or speech match the semantic meaning of the query
3. **Personal Context**: Combined with your custom metadata (people, location, mood), embeddings enable highly relevant retrieval

### Optional: Creating Custom Embeddings for Advanced Use Cases

While Twelve Labs handles video embeddings automatically, you can also create embeddings for other content:

**When to create custom embeddings:**
- To embed user queries before searching (for more control over search)
- To create embeddings for standalone text, images, or short clips outside the index
- For similarity comparisons between content pieces

**Example - Creating a text embedding for a query:**
```python
# Create an embedding for the user's question
query_embedding = client.embed.v_2.create(
    input_type="text",
    model_name="marengo3.0",
    text={
        "input_text": "Tell me about my trip to China with Sarah"
    }
)

# The embedding can be used for custom similarity search
# Note: Twelve Labs' search API handles this automatically,
# so this is only needed for advanced custom workflows
```

**For Memory Mirror MVP, you DO NOT need to create custom embeddings.** The automatic embeddings from video uploads + the built-in search API are sufficient.

### Summary: Embeddings Workflow in Memory Mirror

```
User uploads video
    ↓
Twelve Labs generates embeddings automatically
    ↓
Embeddings stored in index with metadata
    ↓
User asks question → Search API converts query to embedding
    ↓
System compares query embedding to video embeddings
    ↓
Returns most relevant video segments
```

**Key Takeaway:** Embeddings enable semantic understanding of your videos. Twelve Labs handles all embedding generation and storage automatically - you just need to upload videos and add metadata.

---

## Core Features (MVP)

### Feature 1: Upload & Enrich Videos
**User Flow:**
1. User uploads video file
2. User adds custom metadata:
   - Date
   - Age at the time
   - Location
   - People present
   - Mood/feelings
   - Tags/labels
3. System indexes video with Twelve Labs
4. Metadata is attached to the video

**Technical Implementation:**
```python
# Step 1: Create an index (one-time setup)
index = client.index.create(
    index_name="memory-mirror",
    models=[
        {
            "model_name": "marengo3.0",  # Latest model with enhanced capabilities
            "model_options": ["visual", "audio"]  # Analyze both visual and audio
        }
    ],
    addons=["thumbnail"]  # Optional: enable thumbnail generation
)

# Step 2: Upload video with streaming enabled
task = client.task.create(
    index_id=index.id,
    file=video_path,
    enable_video_stream=True  # Important for playback later
)

# Step 3: Wait for indexing to complete
task.wait_for_done()

# Step 4: Add custom metadata to the video
client.index.video.update(
    index_id=index.id,
    id=task.video_id,
    user_metadata={
        "date": "2023-06-15",
        "age": 24,
        "location": "Beijing, China",
        "people": ["Sarah", "Mike"],
        "mood": "excited, nostalgic",
        "tags": ["travel", "food", "culture"]
    }
)
```

**Important Notes:**
- **Index creation is a one-time setup** - you create one index and upload all videos to it
- **Model options cannot be changed** after creating the index, so choose carefully
- **user_metadata supports**: strings, integers, floats, booleans, and arrays
- **Twelve Labs stores embeddings internally** - you don't need to extract or store them separately

---

### Feature 2: Conversational Clone
**User Flow:**
1. User speaks or types a question (e.g., "Tell me about that trip to China with Sarah")
2. System searches for relevant videos using semantic search + metadata filters
3. LLM generates a conversational response using retrieved video context
4. ElevenLabs speaks the response in the user's cloned voice
5. Relevant video clips are displayed

**Technical Implementation:**
```python
# Search with metadata filters
results = client.search.query(
    index_id=index_id,
    query="trip to China with Sarah",
    options=["visual", "audio"],
    filter={
        "people": "Sarah",
        "location": "China"
    }
)

# Results contain:
# - video_id
# - start/end timestamps of matching segments
# - confidence scores
# - metadata

# Retrieve video playback URL
video = client.index.video.retrieve(results[0].video_id)
playback_url = video.hls.video_url

# Generate LLM response using context
# Send to ElevenLabs for voice synthesis
# Display video at relevant timestamps
```

---

### Feature 3: Contextual Video Display
**User Flow:**
- As the AI clone speaks, the UI displays the video clips that match the conversation context
- Videos play at the specific timestamps where relevant moments occur

**Technical Notes:**
- Use HLS video player (Video.js, Plyr, or native HTML5 with HLS.js)
- Seek to specific timestamps returned by Twelve Labs search results

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│  (Upload videos, add metadata, talk to clone, view videos)  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend / API Layer                      │
└─────┬───────────────┬───────────────┬───────────────────────┘
      │               │               │
      ▼               ▼               ▼
┌──────────┐   ┌────────────┐   ┌─────────────┐
│  Twelve  │   │ ElevenLabs │   │   Claude/   │
│   Labs   │   │            │   │   GPT-4     │
└──────────┘   └────────────┘   └─────────────┘
│                                │
│ - Video storage               │ - LLM response
│ - Embedding generation        │   generation
│ - Semantic search             │
│ - Metadata storage            │ - Voice cloning
│ - Video streaming             │ - TTS
└───────────────────────────────┘
```

---

## Conversation Flow

```
Frontend → Python Backend → AI Services → Twelve Labs DB → Eleven Labs

1. User Input (userPrompt)
   Example: "Show me a video of me during school"
   Frontend → Python Backend

2. Query Database
   Python Backend → Twelve Labs DB
   Search for videos matching user prompt

3. Retrieve Results
   Twelve Labs DB → Python Backend
   Returns: Every Entry [{id: 123, summary: 'A boy is studying...'}, ...]

4. Find Matching Entry
   Python Backend searches for userPrompt in results

   IF FOUND (id: 123):
      ↓
   5a. Query Specific Video
       Python Backend → Twelve Labs DB
       Query video where id == 123

   5b. Get Video Summary
       Twelve Labs DB → AI
       Send: {Summary: 'A boy is studying', prompt: 'talk as if you were speaking in first person'}

   5c. Retrieve Video Data
       AI → Python Backend
       Returns: {id: 123, video}

   5d. Generate AI Response
       Python Backend → AI
       AI generates: newSummary: "This was during my younger school days..."

   5e. Convert to Speech
       Python Backend → Eleven Labs
       Send: newSummary: "This was during my younger school days..."

   5f. Receive Audio
       Eleven Labs → Python Backend
       Returns: [AUDIO]: "This was during my younger school days..."

   5g. Send to Frontend
       Python Backend → Frontend
       Returns: {id: 123, video, audio}

   IF NOT FOUND:
      ↓
   6. Return "None FOUND"
      Python Backend → Frontend
      User sees: "No matching videos found"

Key Components:
- Frontend: User interface for input/output
- Python Backend: Orchestrates the entire flow
- AI: Generates conversational responses in first person
- Twelve Labs DB: Video storage, search, and retrieval
- Eleven Labs: Text-to-speech conversion
```

---

## Key Technical Details

### Twelve Labs Index Management
- **One index per project**: Create one index called "memory-mirror" and upload all videos to it
- **Model selection is permanent**: You cannot change models (`marengo3.0`) or model options (`visual`, `audio`) after creating an index
- **Recommended configuration**: Use `marengo3.0` with `["visual", "audio"]` options for comprehensive video understanding
- **Addons**: Consider enabling `"thumbnail"` addon for video preview images

### Twelve Labs Metadata Constraints
- **Supported types:** `string`, `integer`, `float`, `boolean`
- **Arrays:** Supported (e.g., `"people": ["Sarah", "Mike"]`)
- **Nesting:** Keep metadata flat for easier filtering
- **Filtering in search:** Use the `filter` parameter in search queries

### Video Storage & Playback
- **Enable streaming:** Use `enable_video_stream=True` when uploading
- **Playback format:** HLS (HTTP Live Streaming)
- **URL retrieval:** `video.hls.video_url` from `client.index.video.retrieve()`
- **Player:** Use any HLS-compatible video player

### Voice Cloning with ElevenLabs
- **Voice samples needed:** At least 1-5 minutes of clear audio
- **Best practices:** 
  - Multiple recordings in different contexts
  - Clear audio, minimal background noise
  - Natural speaking style
- **API:** Use the Voice Cloning endpoint to create a voice profile

---

## Relevant Documentation & Links

### Twelve Labs
- **Main Docs:** https://docs.twelvelabs.io/
- **Python SDK:** https://github.com/twelvelabs-io/twelvelabs-python
- **Python SDK Reference:** https://docs.twelvelabs.io/v1.3/sdk-reference/python
- **Manage Indexes:** https://docs.twelvelabs.io/v1.3/sdk-reference/python/manage-indexes
- **Upload Content:** https://docs.twelvelabs.io/v1.3/sdk-reference/python/upload-content
- **Manage Videos:** https://docs.twelvelabs.io/v1.3/sdk-reference/python/manage-videos
- **Search API:** https://docs.twelvelabs.io/v1.3/sdk-reference/python/search
- **Create Embeddings (optional):** https://docs.twelvelabs.io/v1.3/sdk-reference/python/create-embeddings-v-2/create-sync-embeddings
- **Model Information (Marengo 3.0):** https://docs.twelvelabs.io/v1.3/docs/concepts/models/marengo

### ElevenLabs
- **Main Docs:** https://elevenlabs.io/docs/
- **Voice Cloning:** https://elevenlabs.io/docs/voices/voice-cloning
- **Text-to-Speech API:** https://elevenlabs.io/docs/api-reference/text-to-speech
- **Python SDK:** https://github.com/elevenlabs/elevenlabs-python

### Claude API (if using)
- **Main Docs:** https://docs.anthropic.com/
- **Messages API:** https://docs.anthropic.com/en/api/messages
- **Python SDK:** https://github.com/anthropics/anthropic-sdk-python

### OpenAI API (if using GPT-4)
- **Main Docs:** https://platform.openai.com/docs/
- **Chat Completions:** https://platform.openai.com/docs/api-reference/chat
- **Python SDK:** https://github.com/openai/openai-python

---

## Development Roadmap

### Phase 1: Setup & Basic Upload (Hours 0-4)
- [ ] Set up Twelve Labs account and API keys
- [ ] Set up ElevenLabs account and API keys
- [ ] Create ONE index with `marengo3.0` model and `["visual", "audio"]` options
- [ ] Create basic upload interface
- [ ] Test video upload with `enable_video_stream=True`
- [ ] Test adding `user_metadata` to uploaded videos
- [ ] Verify metadata can be retrieved with the video

### Phase 2: Search & Retrieval (Hours 4-8)
- [ ] Implement semantic search with Twelve Labs
- [ ] Test metadata filtering
- [ ] Verify video playback URLs work
- [ ] Build simple video player interface

### Phase 3: Voice Integration (Hours 8-12)
- [ ] Clone voice with ElevenLabs
- [ ] Implement speech-to-text for user input
- [ ] Implement TTS for AI responses
- [ ] Test full voice interaction loop

### Phase 4: LLM Integration (Hours 12-16)
- [ ] Set up Claude/GPT-4 API
- [ ] Create prompt template for generating responses
- [ ] Integrate retrieved video context into LLM input
- [ ] Test conversational quality

### Phase 5: UI Polish & Integration (Hours 16-24)
- [ ] Connect all components end-to-end
- [ ] Polish UI/UX
- [ ] Add video playback synchronized with audio
- [ ] Test full user flow
- [ ] Prepare demo

---

## Sample Metadata Schema

```json
{
  "video_id": "unique_video_identifier",
  "user_metadata": {
    "date": "2023-06-15",
    "age": 24,
    "location": "Beijing, China",
    "country": "China",
    "people": ["Sarah", "Mike"],
    "mood": "excited",
    "tags": ["travel", "food", "culture", "sightseeing"],
    "description": "First day exploring the Forbidden City",
    "event_type": "vacation"
  }
}
```

---

## Example Use Cases for Demo

1. **Travel Memories:**
   - "Tell me about my trip to China"
   - "What did I do with Sarah in Beijing?"
   - "Show me when I was feeling nostalgic"

2. **People-Focused:**
   - "Tell me about times with Mike"
   - "When was the last time I saw Sarah?"

3. **Time-Based:**
   - "What was I doing when I was 24?"
   - "Show me memories from 2023"

4. **Mood/Emotion:**
   - "When was I most excited?"
   - "Show me happy moments"

---

## Important Notes

### Why We're NOT Using ChromaDB
- **Twelve Labs stores embeddings internally** - you never see or manage them directly
- **Twelve Labs provides semantic search with metadata filtering** - no need for external vector database
- **Search API handles everything**: converts queries to embeddings, compares against stored embeddings, filters by metadata
- **Adding ChromaDB adds unnecessary complexity** for a hackathon timeline
- **Keep it simple**: One tool (Twelve Labs) for all video intelligence needs

**Important**: While the Twelve Labs API has an endpoint to create custom embeddings (`embed.v_2.create`), you DO NOT need to use this for basic video search. The embeddings are automatically created and stored when you upload videos to an index. The custom embeddings endpoint is only for advanced use cases like:
- Embedding standalone text/images outside your video index
- Custom similarity comparisons
- Building your own search logic (not needed for this project)

### Why We're NOT Using VideoDB
- Twelve Labs already provides comprehensive video intelligence
- VideoDB would be redundant
- Focus on depth with fewer tools rather than breadth

### Hackathon Success Factors
✅ **Focus on the wow factor:** Voice clone + semantic video search is already impressive  
✅ **Keep it simple:** Fewer technologies = less debugging  
✅ **Demo-driven:** Build for the story you want to tell  
✅ **Personal metadata is your differentiator:** This makes it deeply personal, not just a video search engine

---

## Testing Checklist

- [ ] Can upload videos successfully
- [ ] Can attach custom metadata to videos
- [ ] Can search videos semantically
- [ ] Can filter searches by metadata
- [ ] Can retrieve video playback URLs
- [ ] Can clone voice with ElevenLabs
- [ ] Can generate TTS in cloned voice
- [ ] Can generate contextual responses with LLM
- [ ] Videos play at correct timestamps
- [ ] Full conversation flow works end-to-end

---

## Questions to Resolve During Development

1. How many videos should be indexed in the demo? (Recommendation: 5-10 well-labeled videos)
2. What's the best way to capture voice samples for cloning? (Recommendation: 3-5 varied recordings)
3. Should we allow text-only input or require voice? (Recommendation: support both for flexibility)
4. How to handle multiple matching video segments? (Recommendation: show top 3, let user navigate)

---

## Emergency Fallbacks

If something doesn't work:
- **Twelve Labs streaming fails:** Host videos on S3/Backblaze, store URLs in metadata
- **Voice cloning quality poor:** Use standard ElevenLabs voice, still impressive
- **LLM responses not great:** Simplify prompts, use more explicit instructions
- **Real-time voice input issues:** Fall back to text-only input

---

## Success Metrics

Your project is successful if:
1. ✅ Users can upload videos with personal metadata
2. ✅ Users can have a natural conversation with their clone
3. ✅ The clone's voice sounds like the user
4. ✅ Relevant videos play during the conversation
5. ✅ The demo tells a compelling story about preserving memories

---

## Final Tips

- **Start with data:** Upload and label 5-10 videos FIRST
- **Test each integration separately** before connecting them
- **Keep prompts simple:** The LLM doesn't need to be fancy, just contextual
- **The voice is the magic:** Spend time getting voice cloning quality high
- **Tell a story in the demo:** "Here's me talking to my past self about China"

Good luck! 🚀
