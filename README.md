# Career Atlas 🧭

[![CI](https://github.com/dakshxndrm/career-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/dakshxndrm/career-ai/actions/workflows/ci.yml)

> AI-powered career discovery for students — adaptive quiz, personalised roadmap, progress tracking.

## Live Demo

[career-ai-220204.vercel.app](https://career-ai-220204.vercel.app)

<!-- Add a GIF demo here -->

---

## What it does

- **Adaptive career assessment** — the AI runs a diagnostic phase to gauge your current knowledge level, then tailors every subsequent question to your actual skills rather than assuming you're starting from zero.
- **Personalised results report** — after the quiz you get ranked career matches, a gap analysis (known areas vs. areas to build), and a step-by-step goal plan anchored to where you are now and where you want to be.
- **Skill roadmap with progress tracking** — an AI-generated multi-phase roadmap persists checkbox progress day-by-day, with a streak counter and weekly activity count.
- **Multiple assessment paths** — run assessments for different careers or skills, set one as your active path, and switch at any time without losing the others.
- **Public profile sharing** — profiles can be made public and shared at `/u/:uid` so others can see your active path and career goals.

---

## Architecture

```
User (React SPA on Vercel)
  → api/chat.js (Vercel Serverless Function)
       ├─ verifies Firebase ID token (Bearer auth)
       ├─ per-user rate limit (10 req/hr, Firestore sliding window)
       └─ routes to AI provider
            ├─ LOCAL: Ollama (llama3.1:8b at localhost:11434)
            └─ PROD:  Google Gemini (gemini-2.5-flash, free tier)
  → Firebase Firestore (data model below)
```

---

## Data Model

```
users/{uid}                          ← profile fields, savedCareers[], currentPathId, isPublic
assessments/{uid}/items/{id}         ← title, goal, objective, questions[], answers{}, result, roadmap
roadmapProgress/{uid}/items/{id}     ← completed{skillId: bool}, activeDays[]
```

`currentPathId` on the user doc is the assessment the dashboard hero card displays. It falls back to the newest item if unset.

---

## Tech Stack

| Layer        | Technology                  | Why                                                              |
|--------------|-----------------------------|------------------------------------------------------------------|
| Frontend     | React 18 + Vite 6           | Fast HMR in dev; code-split lazy pages in prod                   |
| Routing      | React Router v7             | Nested protected routes, `useSearchParams` for item IDs          |
| Auth         | Firebase Auth               | Google OAuth + email/password, ID tokens for API auth            |
| Database     | Firebase Firestore          | Subcollection model maps naturally to multi-assessment-per-user  |
| Schema       | Zod 4                       | Validates AI JSON output before it touches state                 |
| AI (local)   | Ollama — llama3.1:8b        | Free, offline, reproducible during development                   |
| AI (prod)    | Google Gemini 2.5 Flash     | Fast, generous free tier, strong instruction-following           |
| Hosting      | Vercel                      | Zero-config; serverless Edge Functions for the `/api` endpoint   |

---

## Key Engineering Decisions

**Why a serverless function for the AI endpoint instead of calling the API from the browser?**
Calling Gemini directly from the client would expose the API key in the JavaScript bundle. The `/api/chat.js` serverless function keeps the key server-side, verifies the Firebase ID token on every request, and enforces a per-user rate limit with a Firestore sliding-window counter (durable across serverless instances). Even if someone reverse-engineers the client code, they cannot make AI requests without a valid Firebase session.

**Why Zod validation on every AI response?**
Large language models occasionally return malformed JSON or omit required fields — especially under the complex multi-schema prompts used here (diagnostic questions, results, roadmap phases). Every AI response is validated through a strict Zod schema before it touches React state. If validation fails, the UI shows a typed error card with a retry button rather than crashing. The schemas also serve as the canonical contract between the prompt engineering and the rendering code, so changes to the AI output shape have a single place to land.

**Why move from a single-doc `assessments/{uid}` to a subcollection `items/{id}`?**
The initial version stored one assessment per user in a flat document. That broke as soon as I wanted multiple paths per user. A subcollection means each assessment is its own document: reads are targeted, security rules stay simple (`request.auth.uid == uid`), and adding pagination later requires no schema migration. The codebase retains a legacy-read fallback for accounts created under the old model, surfacing the old data as a read-only "(Legacy)" entry.

**Code-splitting for a 500 kB warning-free build**
All 11 page components load via `React.lazy` + `Suspense`. Rollup `manualChunks` splits three large vendor bundles — Firebase (473 kB), React + router (177 kB), Zod (73 kB) — into separate files. Users pay the Firebase cost once on first navigation; every subsequent page is 8–16 kB. The Suspense fallback is an inline marigold spinner — no extra component, no flash of unstyled content.

---

## Local Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/dakshxndrm/career-ai.git
   cd career-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Copy the environment file**
   ```bash
   cp .env.example .env
   ```

4. **Set the model provider to local**
   ```
   MODEL_PROVIDER=ollama
   ```

5. **Pull the local model**
   ```bash
   ollama pull llama3.1:8b
   ```

6. **Start the dev server** (Vercel CLI runs both the SPA and the `/api` function)
   ```bash
   vercel dev
   ```

---

## Environment Variables

| Variable              | Required for      | Where to get it                                          |
|-----------------------|-------------------|----------------------------------------------------------|
| `MODEL_PROVIDER`      | Always            | Set to `ollama` (local) or `gemini` (production)         |
| `GEMINI_API_KEY`      | Production AI     | [aistudio.google.com](https://aistudio.google.com)       |
| `FIREBASE_SERVICE_ACCOUNT` | Always (token verify + rate limit) | Firebase Console → Project Settings → Service accounts → Generate new private key (paste the JSON as one line) |

Firebase client config (`apiKey`, `authDomain`, etc.) lives in `src/firebase.js` and is safe to expose — it is scoped by Firestore security rules, not by keeping the key secret.

---

## Project Structure

```
src/
├── pages/
│   ├── Auth.jsx               ← two-panel login/signup with Google OAuth
│   ├── DashboardPublic.jsx    ← landing page for unauthenticated users
│   ├── DashboardPrivate.jsx   ← hero card, streak, quick-action grid
│   ├── Profile.jsx            ← user profile form + assessment history
│   ├── QuizInstructions.jsx   ← goal type, title, objective input before quiz
│   ├── Assessment.jsx         ← adaptive MCQ quiz engine with diagnostic phase
│   ├── Results.jsx            ← career report, level badge, goal plan
│   ├── Roadmap.jsx            ← AI-generated phase roadmap with skill checkboxes
│   ├── Plans.jsx              ← all assessments, set active path, expand roadmap
│   ├── Resources.jsx          ← curated resource library filtered by skill match
│   └── PublicProfile.jsx      ← public-facing profile at /u/:uid
│
├── components/
│   ├── Navbar.jsx             ← responsive nav with account dropdown
│   ├── PageTransition.jsx     ← wraps pages in a fadeInUp animation div
│   ├── ProtectedRoute.jsx     ← redirects to /login if not authenticated
│   └── RateLimitBanner.jsx    ← fixed banner shown when API rate limit is hit
│
├── context/
│   └── AuthContext.jsx        ← Firebase auth state + user doc listener
│
├── data/
│   └── resourcesData.js       ← curated learning resources, 5 categories × 4 items
│
├── utils/
│   └── roadmapUtils.js        ← pure date logic: computeStreak, computeWeekCount
│
├── __tests__/
│   ├── schemas.test.js        ← Zod schema validation tests
│   ├── roadmap.test.js        ← streak and week-count unit tests
│   └── progress.test.js       ← completion percentage logic tests
│
├── schemas.js                 ← Zod schemas: QuestionsSchema, ResultSchema, RoadmapSchema
├── theme.js                   ← design tokens (colours + fonts)
├── firebase.js                ← Firebase app init + db/auth exports
├── App.jsx                    ← lazy routes with Suspense fallback
└── main.jsx                   ← React root mount
```
