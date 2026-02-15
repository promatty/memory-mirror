# Repository Rules & AI Development Guidelines

## Project Overview

**Memory Mirror** is a platform where users upload personal video memories and converse with an AI clone that speaks in their own voice. When someone wants to get to know you (or yourself) better, they talk to your AI clone, which has access to all your uploaded memories, videos, and personal context. Think of it as an interactive, conversational autobiography.

This is a **CalgaryHacks hackathon project**. Prioritize working demos and shipping speed over perfection. Keep implementations simple and functional.

For the full technical specification, API examples, and development roadmap, see `memory_mirror_instructions.md`.

---

## Monorepo Structure

```
memory-mirror/
├── frontend/          # Next.js 16 (App Router) — React 19, TypeScript, Tailwind v4
├── backend/           # FastAPI — Python 3.11+, managed with uv
├── rules/             # AI agent rules (this file)
└── memory_mirror_instructions.md   # Full project spec
```

---

## Core Technology Stack

### Frontend (`frontend/`)
- **Framework**: Next.js 16 with App Router
- **React**: 19
- **Language**: TypeScript (strict mode)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/postcss` plugin)
- **State (UI)**: React Context API + useReducer
- **State (Server)**: TanStack Query (React Query)
- **Package Manager**: Yarn
- **Path Alias**: `@/*` maps to `./src/*`

### Backend (`backend/`)
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Package Manager**: uv (`uv.lock`)
- **Server**: Uvicorn
- **Config**: pydantic-settings with `.env` file
- **Role**: API layer that orchestrates all external services

### External APIs
| Service | Purpose |
|---------|---------|
| **Twelve Labs** | Video intelligence, embedding generation, semantic search, metadata storage, video streaming (Marengo 3.0) |
| **ElevenLabs** | Voice cloning and text-to-speech |
| **Claude API / GPT-4** | LLM response generation using retrieved video context |

### Development Commands

**Frontend** (run from `frontend/`):
```bash
yarn dev      # Start Next.js dev server
yarn build    # Production build
yarn start    # Start production server
yarn lint     # Run ESLint
```

**Backend** (run from `backend/`):
```bash
uv run uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000   # Start FastAPI dev server
uv sync       # Install/sync dependencies from uv.lock
uv add <pkg>  # Add a new dependency
```

---

## System Architecture

```
Frontend (Next.js 16 — App Router)
  |
  v
FastAPI Backend (Python)
  |
  +---> Twelve Labs   — video upload, indexing, semantic search, streaming
  +---> ElevenLabs    — voice cloning, text-to-speech
  +---> Claude / GPT-4 — LLM response generation
```

### Conversation Flow
1. User speaks or types a question
2. Backend converts voice to text (if voice input)
3. Backend queries Twelve Labs Search API (semantic search + metadata filters)
4. Relevant video segments are retrieved (video_id, timestamps, context)
5. LLM generates a first-person conversational response using the retrieved context
6. ElevenLabs converts the response to audio in the user's cloned voice
7. Frontend displays: audio response + relevant video clips at matching timestamps

---

## External API Rules

### Twelve Labs
- One index per project named `"memory-mirror"` using `marengo3.0` with `["visual", "audio"]` options
- Model options and index config are **permanent** once created — choose carefully
- Always upload videos with `enable_video_stream=True` for playback support
- Twelve Labs stores embeddings internally — do **NOT** use ChromaDB, VideoDB, or any external vector database
- The Search API handles query-to-embedding conversion automatically — no custom embeddings needed for MVP
- Use HLS-compatible video player for playback (HLS.js, Video.js, or Plyr)

### ElevenLabs
- Voice cloning requires 1-5 minutes of clear audio samples
- Use multiple recordings in different contexts for best quality
- Minimal background noise in samples

### LLM (Claude / GPT-4)
- Generate responses in **first person** as the user's clone
- Input to LLM: user query + retrieved video context + metadata
- Keep prompts simple and contextual

---

## Video Metadata Schema

All videos uploaded to Twelve Labs use this flat `user_metadata` structure:

```json
{
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
```

**Constraints:**
- Supported types: `string`, `integer`, `float`, `boolean`, and arrays of these
- Keep metadata **flat** (no nested objects) for easier filtering
- Use the `filter` parameter in Twelve Labs search queries to filter by metadata fields

---

## Next.js App Router Conventions

### Directory Structure
```
frontend/src/
├── app/                # Next.js App Router (pages, layouts, routes)
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   ├── globals.css     # Global styles (Tailwind imports)
│   └── (routes)/       # Route groups and nested routes
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── features/       # Feature-specific components
│   └── layout/         # Layout components (header, sidebar, etc.)
├── context/            # React Context providers and reducers
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations (cn helper, API clients)
├── services/           # API service functions (calls to FastAPI backend)
└── types/              # TypeScript type definitions
```

### Server Components vs Client Components
- **Default is Server Component** — components in the App Router are server components by default
- Add `'use client'` directive at the top of files that need client-side interactivity (state, effects, event handlers, browser APIs)
- Keep `'use client'` boundaries as low in the tree as possible — push client components to the leaves
- Server Components cannot use hooks (`useState`, `useEffect`, etc.) or event handlers

```typescript
// Server Component (default) — no directive needed
export const VideoInfo = async ({ videoId }: { videoId: string }) => {
  const data = await fetchVideoData(videoId)
  return <div>{data.title}</div>
}

// Client Component — needs the directive
'use client'

import { useState } from 'react'

export const VideoPlayer = ({ url }: { url: string }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  return <video onClick={() => setIsPlaying(!isPlaying)} src={url} />
}
```

### Page and Layout Exports
**Exception to the named export rule**: Next.js `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, and other App Router convention files **must use default exports**.

```typescript
// app/page.tsx — default export required by Next.js
export default function HomePage() {
  return <main>...</main>
}
```

All other components use **arrow functions with named exports** (see Component Style below).

### Routing
- Use file-based routing via the `app/` directory
- Dynamic routes: `app/video/[id]/page.tsx`
- Route groups (no URL impact): `app/(dashboard)/page.tsx`
- API routes: prefer calling the FastAPI backend; use Next.js Route Handlers (`app/api/`) only for frontend-specific needs (e.g., auth callbacks)

### Data Fetching
- **Server Components**: use `async/await` directly or call server-side functions
- **Client Components**: use TanStack Query hooks to fetch from the FastAPI backend
- Never call external APIs (Twelve Labs, ElevenLabs, etc.) directly from the frontend — always go through the FastAPI backend

### Images
- Use `next/image` for all images (automatic optimization)
- Use `next/font` for font loading

---

## State Management & Data Fetching

### Global UI State — React Context + useReducer
Use React Context with `useReducer` for shared UI state (e.g., current user, theme, conversation state, playback state).

```typescript
// src/context/AppContext.tsx
'use client'

interface AppState {
  isRecording: boolean
  currentVideoId: string | null
  conversationHistory: Message[]
}

type AppAction =
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'SET_VIDEO'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: Message }

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    // ...
  }
}
```

- Place context providers in `src/context/`
- Context providers are client components — wrap them in `'use client'`
- Mount providers in the root `layout.tsx`
- Keep reducers pure and typed
- Prefer local `useState` when state does not need to be shared

### Server State — TanStack Query (React Query)
**REQUIRED**: Use TanStack Query for ALL client-side server state management, data fetching, caching, and synchronization.

#### Installation
```bash
yarn add @tanstack/react-query @tanstack/react-query-devtools
```

#### Best Practices
1. **Always use TanStack Query hooks** instead of manual fetch/axios calls in client components:
   - `useQuery` — for GET requests and data fetching
   - `useMutation` — for POST/PUT/DELETE operations
   - `useInfiniteQuery` — for paginated data
   - `useQueryClient` — for cache manipulation

2. **Query Keys Convention**:
   ```typescript
   // Use array-based hierarchical keys
   ['videos']                      // All videos
   ['videos', videoId]             // Specific video
   ['videos', videoId, 'metadata'] // Video metadata
   ['search', query]               // Search results
   ```

3. **Configuration Standards**:
   ```typescript
   useQuery({
     queryKey: ['data'],
     queryFn: fetchData,
     staleTime: 5 * 60 * 1000,  // 5 minutes
     gcTime: 10 * 60 * 1000,    // 10 minutes
   })
   ```

4. **Cache Invalidation**:
   ```typescript
   const queryClient = useQueryClient()
   await queryClient.invalidateQueries({ queryKey: ['videos'] })
   ```

5. **Error Handling**:
   - Always handle `error` and `isError` states
   - Provide user-friendly error messages
   - Use error boundaries for critical failures

6. **Loading States**:
   - Use `isLoading`, `isFetching`, `isPending` appropriately
   - Also use Next.js `loading.tsx` files for route-level loading states

### DO NOT
- Use manual `fetch()` or `axios` calls in client components for server data
- Store server state in `useState` or `useReducer`
- Implement custom caching logic
- Use alternative data fetching libraries without justification
- Call external APIs (Twelve Labs, ElevenLabs) directly from the frontend

---

## UI Components

### shadcn/ui — PRIMARY COMPONENT LIBRARY
**REQUIRED**: Use shadcn/ui as the primary component library for all UI components.

#### Installation & Setup
```bash
# Initialize shadcn/ui (if not already done)
npx shadcn@latest init

# Add components as needed
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
# etc.
```

#### Best Practices
1. **Component Installation**:
   - Install components via CLI to maintain consistency
   - Components are added to `components/ui/` directory
   - Each component is fully customizable and owned by the project

2. **Customization**:
   - Modify components in `components/ui/` when needed
   - Maintain the component's API contract
   - Document any significant customizations

3. **Composition**:
   - Build complex components by composing shadcn/ui primitives
   - Keep business logic separate from UI components
   - Create feature-specific components in `components/features/`

4. **Accessibility**:
   - shadcn/ui components are built on Radix UI (accessible by default)
   - Maintain accessibility when customizing
   - Test with keyboard navigation and screen readers

### DO NOT
- Install alternative UI libraries (Material-UI, Ant Design, etc.) without strong justification
- Copy-paste component code from other sources
- Override shadcn/ui styles with `!important`

---

## Styling

### Tailwind CSS v4 — PRIMARY STYLING APPROACH
**REQUIRED**: Use Tailwind CSS utility classes for all styling. This project uses Tailwind v4 via the `@tailwindcss/postcss` plugin.

#### Best Practices
1. **Utility-First Approach**:
   ```tsx
   // GOOD: Use Tailwind utilities
   <div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">

   // BAD: Custom CSS
   <div className="custom-card">
   ```

2. **Responsive Design**:
   ```tsx
   // Use Tailwind's responsive prefixes
   <div className="w-full md:w-1/2 lg:w-1/3">
   ```

3. **Theme Customization**:
   - Tailwind v4 uses CSS-based configuration (in `globals.css`) rather than `tailwind.config.js`
   - Use `@theme` directive and CSS variables for custom design tokens
   - Use CSS variables for dynamic theming

4. **Component Variants**:
   - Use `clsx` or `cn` utility for conditional classes
   - Consider `class-variance-authority` (CVA) for complex variants

5. **Dark Mode**:
   - Use Tailwind's dark mode utilities: `dark:bg-gray-900`

### DO NOT
- Write custom CSS files unless absolutely necessary
- Use inline styles except for dynamic values
- Install CSS-in-JS libraries (styled-components, emotion)

---

## Component Style

Use **arrow functions with named exports** for all non-route components:

```typescript
// GOOD — named export with arrow function
export const VideoUploader = ({ onUpload }: VideoUploaderProps) => {
  return <div>...</div>
}

// BAD — do not use React.FC
const VideoUploader: React.FC<Props> = () => { ... }
```

**Exception**: Next.js App Router files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`) **must use default exports** as required by the framework.

### Best Practices
1. **Component Design**:
   - Keep components small and focused (< 200 lines)
   - Use composition over inheritance
   - Extract reusable logic into custom hooks
   - Separate concerns (UI, logic, data fetching)

2. **Performance**:
   - Use `React.memo()` for expensive client components
   - Implement proper dependency arrays in hooks
   - Avoid unnecessary re-renders
   - Use `useMemo` and `useCallback` judiciously
   - Leverage Server Components (default in Next.js) to reduce client-side JS

3. **File Naming**:
   - Components: PascalCase (`VideoUploader.tsx`)
   - Hooks: camelCase with 'use' prefix (`useVideoSearch.ts`)
   - Utilities: camelCase (`formatDate.ts`)
   - Types: PascalCase (`Video.ts` or `types.ts`)
   - Context: PascalCase (`AppContext.tsx`)
   - Next.js route files: lowercase (`page.tsx`, `layout.tsx`, `loading.tsx`)

---

## Code Quality & TypeScript

### TypeScript Standards
**REQUIRED**: Maintain strict TypeScript configuration and type safety.

#### Best Practices
1. **Strict Mode**:
   - Keep `strict: true` in tsconfig.json
   - Never use `any` type (use `unknown` if necessary)
   - Provide explicit return types for functions

2. **Type Definitions**:
   ```typescript
   // GOOD: Explicit types
   interface Video {
     id: string
     title: string
     metadata: VideoMetadata
   }

   const getVideo = (id: string): Promise<Video> => {
     // ...
   }

   // BAD: Implicit any
   const getVideo = (id) => {
     // ...
   }
   ```

3. **Component Props**:
   ```typescript
   // Use interfaces with arrow function + named export
   interface VideoCardProps {
     video: Video
     onPlay: (id: string) => void
     isActive?: boolean
   }

   export const VideoCard = ({ video, onPlay, isActive = false }: VideoCardProps) => {
     // ...
   }
   ```

4. **Type Organization**:
   - Define shared types in `src/types/`
   - Co-locate component-specific types with components
   - Export types that are used across multiple files
   - Use type imports: `import type { Video } from '@/types'`

5. **Utility Types**:
   - Leverage TypeScript utility types: `Partial<T>`, `Pick<T>`, `Omit<T>`, etc.
   - Create custom utility types for common patterns
   - Use discriminated unions for complex state

### React Best Practices
1. **Hooks Rules**:
   - Only call hooks at the top level
   - Only call hooks from React functions or custom hooks
   - Hooks can only be used in Client Components (`'use client'`)

2. **Component Composition**:
   ```typescript
   // GOOD: Composition
   <Card>
     <CardHeader>
       <CardTitle>Title</CardTitle>
     </CardHeader>
     <CardContent>Content</CardContent>
   </Card>

   // BAD: Monolithic component
   <Card title="Title" content="Content" />
   ```

3. **State Management**:
   - Use `useState` for local UI state only
   - Use React Context + useReducer for shared UI state
   - Use TanStack Query for server state in client components
   - Use `async/await` directly in server components
   - Avoid prop drilling (use composition or context)

4. **Side Effects**:
   - Use `useEffect` sparingly and correctly (client components only)
   - Always specify dependency arrays
   - Clean up effects when necessary
   - Consider custom hooks for complex effects

### General Code Rules
- Use `async/await` over `.then()` chains
- No unused imports or dead code
- Use descriptive variable and function names
- Keep functions focused (single responsibility)
- Use the `@/*` path alias for imports: `import { cn } from '@/lib/utils'`

### DO NOT
- Disable TypeScript errors with `@ts-ignore` or `@ts-expect-error`
- Use `any` type
- Skip type definitions for props or function parameters
- Violate React hooks rules
- Use hooks in Server Components

---

## Backend Conventions (FastAPI)

### Project Structure
```
backend/
├── main.py             # FastAPI app entry point
├── core/
│   ├── config.py       # pydantic-settings (Settings class, .env loading)
│   └── models.py       # Shared Pydantic models
├── routers/            # API route modules
├── models/             # Data models
└── pyproject.toml      # Dependencies (managed by uv)
```

### Best Practices
- Use `pydantic-settings` for configuration (already set up in `core/config.py`)
- Use Pydantic models for request/response validation
- Organize endpoints into routers by feature
- Use `async def` for route handlers
- All API routes are prefixed with `/api` (configured via `settings.API_PREFIX`)
- Use `httpx` for async HTTP calls to external APIs
- Add new dependencies with `uv add <package>`

### DO NOT
- Use pip directly — use `uv` for all dependency management
- Store secrets in code — use `.env` file and `pydantic-settings`
- Call external APIs from the frontend — all external calls go through FastAPI

---

## Testing (Future Consideration)

No testing is required during the hackathon. When implementing tests later, use:

**Frontend:**
- **Jest** or **Vitest** — Unit testing
- **React Testing Library** — Component testing
- **Playwright** or **Cypress** — E2E testing

**Backend:**
- **pytest** — Unit and integration testing
- **httpx** — Testing FastAPI endpoints

---

## Environment & Configuration

### Frontend Environment Variables (`frontend/.env.local`)
Use `NEXT_PUBLIC_` prefix for variables that need to be available in the browser:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000   # FastAPI backend URL
NEXT_PUBLIC_APP_NAME=memory-mirror
```

Access in code:
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

### Backend Environment Variables (`backend/.env`)
Never expose these to the frontend:
```bash
# Server
ALLOWED_ORIGINS=http://localhost:3000
DEBUG=true

# Twelve Labs
TWELVE_LABS_API_KEY=your_key_here
TWELVE_LABS_INDEX_ID=your_index_id_here

# ElevenLabs
ELEVENLABS_API_KEY=your_key_here

# LLM
ANTHROPIC_API_KEY=your_key_here      # If using Claude
OPENAI_API_KEY=your_key_here         # If using GPT-4
```

### Configuration Files

**Frontend:**
- `next.config.ts` — Next.js configuration
- `tsconfig.json` — TypeScript configuration
- `postcss.config.mjs` — PostCSS (Tailwind v4 plugin)
- `eslint.config.mjs` — ESLint rules
- `components.json` — shadcn/ui configuration (after init)

**Backend:**
- `pyproject.toml` — Python dependencies and project config
- `uv.lock` — Lockfile (do not edit manually)
- `core/config.py` — Runtime settings via pydantic-settings

---

## AI Agent Guidelines

### When Working on This Codebase
1. **Read `memory_mirror_instructions.md`** for full project spec, API examples, and documentation links
2. **Identify which part of the monorepo** you're working in (`frontend/` or `backend/`) and stay in that context
3. **Always check existing patterns** before implementing new features
4. **Follow the established architecture** — don't introduce new patterns without discussion
5. **Install dependencies via the correct package manager**:
   - Frontend: `yarn add <pkg>` (run from `frontend/`)
   - Backend: `uv add <pkg>` (run from `backend/`)
   - Never manually edit `package.json` or `pyproject.toml`
6. **Test changes** — suggest running the dev server to verify changes
7. **Ask before major changes** — architectural decisions, new dependencies, etc.
8. **Hackathon mindset** — prioritize working functionality over perfect abstractions

### Common Tasks — Frontend
1. **Adding a new page**:
   - Create `app/<route>/page.tsx` with a default export
   - Use Server Components by default; add `'use client'` only when needed
   - Use shadcn/ui components for UI
   - Style with Tailwind CSS

2. **Adding a new feature**:
   - Create feature components in `src/components/features/`
   - Extract logic into custom hooks in `src/hooks/`
   - Define types in `src/types/` or co-located
   - Use TanStack Query for client-side data operations
   - Style with Tailwind CSS + shadcn/ui

3. **Adding UI components**:
   - First, check if shadcn/ui has the component
   - Install via CLI: `npx shadcn@latest add <component>`
   - Customize in `src/components/ui/` if needed
   - Compose complex components from primitives

4. **Working with the backend**:
   - API service functions go in `src/services/`
   - Use TanStack Query hooks to wrap service calls
   - Never call external APIs (Twelve Labs, ElevenLabs, etc.) directly from the frontend

### Common Tasks — Backend
1. **Adding a new endpoint**:
   - Create or extend a router in `backend/routers/`
   - Register the router in `main.py` with `app.include_router()`
   - Define request/response models with Pydantic
   - Use `async def` for all route handlers

2. **Adding a new external API integration**:
   - Add the SDK/client dependency with `uv add <pkg>`
   - Create a service module or add to existing router
   - Store API keys in `.env` and access via `settings`

### Quality Checklist
Before completing any task, verify:
- TypeScript has no errors (frontend: `yarn build`)
- ESLint has no errors (frontend: `yarn lint`)
- All imports are correct and used
- Components use arrow functions with named exports (except Next.js route files)
- `'use client'` directive is present on components that use hooks/interactivity
- React Context + useReducer for shared UI state
- TanStack Query is used for client-side server state
- shadcn/ui components are used for UI
- Tailwind CSS is used for styling
- Backend uses Pydantic models for request/response validation
- No console errors in dev mode
- Imports use the `@/*` alias where applicable

---

## Summary

Memory Mirror is a video memory platform with an AI voice clone, built for CalgaryHacks. The stack is:

- **Next.js 16 (App Router) + React 19 + TypeScript** for the frontend
- **shadcn/ui + Tailwind CSS v4** for UI and styling
- **React Context + useReducer** for global UI state
- **TanStack Query** for client-side server state and data fetching
- **FastAPI (Python 3.11+)** backend orchestrating Twelve Labs, ElevenLabs, and Claude/GPT-4
- **uv** for Python dependency management, **Yarn** for frontend

AI agents should strictly adhere to these guidelines to maintain consistency across the codebase. When in doubt, consult `memory_mirror_instructions.md` for the full project specification.
