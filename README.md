# CampusPulse — Smart Campus Event Discovery Platform

CampusPulse brings scattered university hackathons, technical workshops, club meetups, intramural sports, and cultural showcases into one fast, unified platform. Students discover events and RSVP in a single tap, while student clubs and academic departments publish events in under a minute with live attendance tracking.

## Features

- **Role-Based Demo Access & Instant Switching**
  - **Student Role** (`student@campus.demo` / `demo123`) + 1-click **Demo Student Login**
  - **Organiser Role** (`organiser@campus.demo` / `demo123`) + 1-click **Demo Organiser Login**
  - Switch roles in seconds during live demonstrations without clearing data.
- **Student Event Discovery & 1-Tap Registration**
  - **Happening Today** and **This Week** highlight cards at the top of the feed.
  - Real-time search across event titles, clubs, venues, and descriptions.
  - Category filters (`All`, `Hackathon`, `Workshop`, `Club Meetup`, `Sports`, `Cultural`) sorted upcoming-first.
  - Full edge-case handling: live seat counters, disabled **Full** capacity states, dimmed **Event Ended** past events, and a dedicated **My Events** view.
- **Organiser 1-Minute Publishing & Live Dashboard**
  - Streamlined event creation form that publishes directly to the shared JSON data store (`data/events.json`) and appears immediately in the Student feed.
  - Live registration counters, capacity progress bars, and expandable student attendee rosters.
- **Server-Side AI Features (`@google/genai`)**
  - **Generate with AI** (`/api/ai/generate-event`): Turn a one-line organiser idea into a polished title, engaging description, suggested category, venue, and capacity.
  - **Pick for Me** (`/api/ai/recommend`): Select 1–2 interests as a student to receive the top 2 matching upcoming events with a tailored one-sentence explanation.
  - Graceful local fallback when `GEMINI_API_KEY` is not yet configured on localhost.

## Running Locally (`localhost:3000`)

### Prerequisites
- Node.js 22+ and npm

### Step-by-Step Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Copy `.env.example` to `.env.local` and add your Gemini API key:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local`:
   ```env
   GEMINI_API_KEY="your-real-gemini-api-key"
   APP_URL="http://localhost:3000"
   ```
   *(Note: If you leave `GEMINI_API_KEY` unset while testing locally, the AI endpoints automatically use a clearly labeled local fallback so the app never crashes.)*

3. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Type-check and build for production**
   ```bash
   npm run lint
   npm run build
   ```

## Deploying to Vercel or Cloud Hosting

CampusPulse uses a TypeScript Express server (`server.ts`) paired with a Vite React frontend and a local JSON file store (`data/events.json`).

### Deploying to Vercel
1. Push your repository to GitHub (`.env`, `.env.local`, `node_modules/`, and `dist/` are excluded via `.gitignore`).
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Configure **Environment Variables** in the Vercel Project Settings:
   - `GEMINI_API_KEY`: Your Gemini API key
4. Set Build Command to `npm run build` and Output Directory to `dist`.
   *(Note: For serverless hosts with ephemeral filesystems like Vercel, connect a managed database or object store if you need multi-instance write persistence across cold starts. For single-container hosts such as Cloud Run, Render, Railway, or Fly.io, `npm run build && npm start` runs `server.ts` directly with persistent disk support.)*

## Dummy Data Disclaimer

All seeded events, club names, student accounts, and attendee names in `data/events.json` are strictly fictional placeholder data created for demonstration purposes.

## AI Tools Disclosed

> Update the placeholders below before final hackathon submission.

- **Application AI Runtime:** Google Gemini API (`gemini-4-hydrogen` via `@google/genai` server-side SDK) for Organiser event copy drafting and Student event recommendations.
- **Coding & Architecture Assistance:** `[Team Placeholder: e.g., Google AI Studio / Gemini / IDE Copilot — describe how your team used AI during development]`
- **Visual Assets:** `[Team Placeholder: e.g., AI-generated editorial campus event photography stored locally in src/assets/images/]`
- **Human Review & Verification:** `[Team Placeholder: Confirm team members reviewed, tested, and verified all generated code, copy, and data flows]`
