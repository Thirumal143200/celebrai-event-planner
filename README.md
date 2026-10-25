<div align="center">

![CelebrAI — Intelligent Celebration & Event Engineering](docs/images/celebrai-hero.png)

# CelebrAI

### Intelligent Celebration & Event Engineering

**A full-stack, AI-augmented event planning platform engineered with Next.js 16, TypeScript, Tailwind CSS v4, and Google Gemini.**

[![Live Demo](https://img.shields.io/badge/Demo-celebrai--event--planner.onrender.com-8b5cf6?style=for-the-badge&logo=render&logoColor=white)](https://celebrai-event-planner.onrender.com)
[![GitHub Repository](https://img.shields.io/badge/GitHub-celebrai--event--planner-1e293b?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Thirumal143200/celebrai-event-planner)
[![PromptWars](https://img.shields.io/badge/PromptWars-Challenge%205-f43f5e?style=for-the-badge&logo=google&logoColor=white)](https://promptwars.in)

[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.1-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3.3-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Google GenAI SDK](https://img.shields.io/badge/Google_GenAI_SDK-v2.30.0-4285f4?style=flat-square&logo=google-gemini&logoColor=white)](https://www.npmjs.com/package/@google/genai)
[![Vitest](https://img.shields.io/badge/Tests-49%20Passing-22c55e?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## The Problem CelebrAI Solves

Organizing milestone celebrations—whether a 150-guest botanical wedding, a milestone 50th birthday, or a 500-attendee community gala—is historically broken:

1. **Spreadsheet Chaos:** Planners juggle fragmented spreadsheets for budgets, isolated reminder apps for deadlines, and chaotic messaging threads for vendor coordination.
2. **LLM Arithmetic Hallucinations:** Generic generative AI chatbots frequently make elementary mathematical errors when summing budget categories, miscalculate remaining funds, and offer unrealistic estimates without contingency protection.
3. **Destructive Regeneration:** Most AI event tools overwrite user customizations whenever a plan is updated, erasing booked vendor statuses and manually completed milestones.
4. **Flaky Upstream APIs:** Typical AI hackathon prototypes break completely when an API key is missing or upstream rate limits are encountered during judging.

**CelebrAI eliminates these problems.** It pairs creative generative assistance with **deterministic mathematical precision**, an **explainable 0–100% readiness engine**, **non-destructive plan reconciliation**, and an **offline domain knowledge fallback** that ensures 100% uptime.

---

## What Makes CelebrAI Distinctive

- **Zero-Hallucination Deterministic Budgeting:** All financial calculations (allocations, actual spend, remaining balance, and contingency reserves) are computed strictly by deterministic TypeScript logic—never by an LLM prompt.
- **Explainable 4-Dimension Event Readiness Engine:** Transparent 0–100% scoring calculated across four 25% dimensions (Budget, Timeline, Vendors, Tasks) with prioritized, actionable recommendations.
- **Non-Destructive Plan Merging:** Intelligent state reconciliation preserves user-created milestones, custom budget categories, vendor contacts, and completed checkboxes during AI plan regeneration.
- **Resilient Multi-Model Gemini Integration:** Powered by the official `@google/genai` SDK with token-bucket rate limiting, automatic multi-model failover (`gemini-3.8-flash` $\to$ `gemini-3.5-flash`), and an offline domain fallback engine.
- **Pluggable Architecture:** Single-instance crash-resilient atomic file storage (`.data/celebr-store.json`) for local/Docker volumes, accompanied by a complete PostgreSQL / Supabase DDL schema for serverless hosting.
- **Battle-Tested Quality:** 49 automated unit and integration tests, strict TypeScript compilation with zero errors, zero ESLint warnings, and a 10-contract live production smoke test suite.

---

## Core Feature Overview

<div align="center">

![CelebrAI Core Feature Architecture](docs/images/celebrai-features.png)

</div>

### 1. Deterministic Budget & Contingency Engine
- Real-time arithmetic aggregation across all custom categories (`Venue`, `Catering`, `Decor`, `Entertainment`, `Attire`, etc.).
- Transparent **10% safety contingency reserve** automatically partitioned from the total budget.
- Instant over-budget alerts displaying exact deficit values whenever actual expenses exceed estimates.

### 2. Explainable Event Readiness Scoring
- Transparent 0–100% composite preparedness metric.
- Clear dimensional breakdown: **Budget Health (25%)**, **Milestone Timeline (25%)**, **Vendor Coverage (25%)**, and **Task Progress (25%)**.
- Dynamic, prioritized recommendations guiding planners on critical next actions (e.g., booking missing critical vendors or allocating remaining contingency funds).

### 3. Non-Destructive Plan Reconciler
- AI plan regeneration uses normalized set reconciliation (`existingTitles.has(...)`).
- New AI suggestions are seamlessly merged without duplicating tasks or resetting checked milestones.
- Manually booked vendor contacts and custom budget notes remain 100% intact.

### 4. Contextual AI Copilot Drawer
- Integrated slide-out assistant aware of current event parameters (event type, guest count, location, target budget, and remaining balance).
- Fast actionable ideas for budget reduction, catering alternatives, and timeline optimization.
- Built-in prompt injection sanitization and token-bucket rate limiting.

---

## Real Application Showcase

The screenshots below are captured directly from the live deployed application running in production:

### 1. Event Dashboard & Readiness Overview
*Displays real-time countdown, composite readiness progress gauge, dimensional score breakdown, and actionable next steps.*

<div align="center">

![CelebrAI Event Dashboard Overview](docs/images/dashboard-overview.png)

</div>

---

### 2. Deterministic Budget Engine & Contingency Meter
*Demonstrates mathematical budget tracking, safety contingency reserve allocation, and category-level estimated vs. actual expenses.*

<div align="center">

![CelebrAI Deterministic Budget Engine](docs/images/budget-engine.png)

</div>

---

### 3. Contextual AI Copilot Drawer
*Live conversational copilot providing event-scoped guidance with active resilience notices and rate-limiting protection.*

<div align="center">

![CelebrAI Contextual Copilot Drawer](docs/images/copilot-drawer.png)

</div>

---

## System Architecture

CelebrAI is structured in five decoupled, testable layers:

<div align="center">

![CelebrAI System Architecture](docs/images/celebrai-architecture.png)

</div>

### Request Flow & Data Reconciliation

```mermaid
sequenceDiagram
    autonumber
    actor User as Planner (Browser)
    participant UI as Next.js 16 App Router
    participant API as Route Handlers (Zod Gate)
    participant Store as State Store & Persistence
    participant AI as Gemini Provider / Failover
    participant Math as Deterministic Math Engines

    User->>UI: Click "Generate AI Plan"
    UI->>API: POST /api/events/{id}/plan
    API->>API: Validate UUID & Sanitize Payload
    API->>AI: generatePlan(eventContext)
    alt Gemini API Key Available
        AI->>AI: Try gemini-3.8-flash -> gemini-3.5-flash
        AI-->>API: Validated JSON Plan Suggestion
    else Offline / Rate-Limited / No Key
        AI->>AI: Activate Domain Knowledge Engine
        AI-->>API: Domain Plan + Fallback Notice
    end
    API->>Store: applyPlanNonDestructive(eventId, plan)
    Store->>Store: Reconcile Sets (Preserve user edits)
    Store->>Math: recomputeBudget() & calculateReadiness()
    Math-->>Store: Updated Mathematical State
    Store->>Store: Atomic File Sync (.data/celebr-store.json)
    Store-->>API: Synchronized Event Plan
    API-->>UI: 200 OK (Merged State + Metadata)
    UI-->>User: Instant Visual Update (Readiness & Budget)
```

---

## Technology Stack

| Layer | Technology | Version | Rationale |
| :--- | :--- | :---: | :--- |
| **Framework** | Next.js App Router | `16.4.2` | Server & Client Components, built-in Route Handlers, sub-second SSG/SSR builds. |
| **UI Library** | React | `19.3.1` | Concurrent rendering, modern hooks, and component lifecycle management. |
| **Language** | TypeScript | `6.0.3` | Strict static typing across domain models, API contracts, and test fixtures. |
| **Styling** | Tailwind CSS v4 | `4.3.3` | Ultra-fast `@theme` CSS design tokens, custom glassmorphism, and zero runtime CSS overhead. |
| **AI SDK** | `@google/genai` | `2.30.0` | Official Google GenAI SDK powering Gemini 3.8 Flash model inference. |
| **Validation** | Zod | `4.6.7` | Type-safe runtime schema boundaries protecting all user inputs and LLM outputs. |
| **Identifiers** | UUID | `14.0.3` | RFC4122 compliant UUID generation for events, milestones, and tasks. |
| **Test Runner** | Vitest | `5.0.5` | Instant ESM test execution with JSDOM environment and native Vite speed. |
| **DOM Testing** | `@testing-library/react` | `16.3.3` | Component behavior assertions and accessibility checks. |
| **Linting** | ESLint & Next Linter | `9.x / 16.x` | Code quality enforcement adhering to Core Web Vitals best practices. |

---

## Local Setup & Installation

### Prerequisites
- **Node.js:** `v18.18.0` or higher (verified compatible through Node v24).
- **npm:** `v9.0.0` or higher.
- **Google AI Studio API Key:** *(Optional)* Required only for live Gemini model responses. CelebrAI runs seamlessly in offline fallback mode without an API key.

### Step-by-Step Installation

```bash
# 1. Clone the public repository
git clone https://github.com/Thirumal143200/celebrai-event-planner.git
cd celebrai-event-planner

# 2. Install dependencies cleanly
npm install

# 3. Create your local environment configuration
cp .env.example .env.local

# 4. (Optional) Configure your Gemini API key in .env.local
# GEMINI_API_KEY=your_google_ai_studio_api_key_here

# 5. Launch the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start planning events.

---

## Environment Variables

All environment variables are validated server-side. **No secret API keys are ever exposed to the client bundle.**

```env
# ==============================================================================
# Google Gemini AI Configuration (Server-Side Only)
# ==============================================================================
# Get your API key from Google AI Studio: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

# Model Selection (Defaults to gemini-3.8-flash with auto-failover to gemini-3.5-flash)
GEMINI_MODEL=gemini-3.8-flash

# ==============================================================================
# Persistence & Database Configuration (Optional)
# ==============================================================================
# Directory for local atomic JSON persistence (defaults to ./.data)
DATA_DIR=./.data

# PostgreSQL / Supabase connection string for serverless deployments (Optional)
DATABASE_URL=postgresql://postgres:password@db.example.com:5432/postgres

# ==============================================================================
# Application Mode
# ==============================================================================
NODE_ENV=development
```

---

## Verified Commands & Scripts

All scripts have been executed and verified against `package.json`:

```bash
# Run the local Next.js development server
npm run dev

# Run strict TypeScript compilation (Zero errors)
npm run typecheck

# Run static analysis and ESLint (Zero warnings)
npm run lint

# Run the complete Vitest automated test suite (49/49 passing)
npm test

# Run the automated production smoke test suite against live port 3099
npm run test:smoke

# Compile the production Next.js application
npm run build

# Start the compiled production server
npm run start
```

---

## AI Integration & Resilience Architecture

### Where Gemini is Integrated
1. **Event Plan Generator (`/api/events/[id]/plan`):** Formulates comprehensive event roadmaps containing milestone timelines, budget allocations, vendor checklists, creative themes, and practical tips tailored to event type, guest count, and location.
2. **Contextual Copilot Drawer (`/api/copilot`):** Engages in multi-turn conversational advice scoped to the event's real-time financial balance and deadline constraints.

### Resilience & Fault Tolerance
- **Strict Payload Sanitization:** All user prompts are sanitized via `sanitizeForPrompt()` to strip HTML, code fences, and template interpolations (`{{...}}`), truncating input to 2,000 characters to prevent prompt injection.
- **Multi-Model Failover:** If the primary configured model (`gemini-3.8-flash`) encounters capacity limits or errors, the provider automatically falls back through a sequence of compatible models (`gemini-3.5-flash`).
- **Token-Bucket Rate Limiter:** Protects upstream quotas with a 10-token burst capacity and 0.5 tokens/second continuous refill rate.
- **Request Timeouts:** Server-side promises enforce a strict 35-second timeout window, preventing hung connections.
- **Zod Schema Interception:** Model responses are parsed and validated against `AIPlanSuggestionSchema` before state storage. If the model produces invalid JSON, the system catches the schema fault and engages the fallback engine.
- **Domain Knowledge Engine Fallback:** In offline mode or when upstream quota is exhausted, CelebrAI serves curated, domain-specific event plans and appends a transparent user notice:  
  *`"AI plan generated using domain templates due to temporary upstream service unavailability."`*

---

## Security, Privacy & Responsible AI

- **Zero Client Credential Leakage:** API keys are never prefixed with `NEXT_PUBLIC_` and exist strictly within server runtime memory.
- **Strict UUID Boundaries:** All URL path parameters are validated against strict RFC4122 regular expressions; non-UUID parameters and path traversal attempts are rejected immediately with HTTP 400.
- **Payload Size Limits:** Incoming JSON request bodies are capped at 1MB to prevent memory exhaustion attacks.
- **Deterministic Calculation Guardrails:** Financial arithmetic is permanently isolated from generative models, preventing algorithmic cost inflation or miscalculations.
- **No Fabricated Vendor PII:** Prompt system instructions explicitly instruct the model never to fabricate realistic vendor contact information or phone numbers, requiring users to populate real contacts upon vendor selection.

---

## Code Provenance & Academic Integrity

CelebrAI was audited under rigorous forensic code-provenance guidelines:

- **Full Provenance Statement:** See [`PROVENANCE.md`](PROVENANCE.md) in the repository root for complete file-by-file categorization and third-party license documentation.
- **Separation from Prior Projects:** The author previously competed in PromptWars Challenge 3 with *CarbonWise AI*. Forensic Git analysis verified that CelebrAI shares **0 / 49 Git blobs (0.00%)** and **0 historic Git objects** with CarbonWise AI.
- **Framework Scaffolding Disclosures:** Standard auto-generated framework files (`next-env.d.ts`, `AGENTS.md`, `postcss.config.js`, `eslint.config.mjs`, `tsconfig.json`) are documented as Category A framework scaffolding.
- **Original Code Base:** All application logic (`src/app/`, `src/components/`, `src/lib/`, `tests/`) is original code authored specifically for PromptWars Challenge 5.

---

## Verified Limitations & Roadmap

### Current Limitations
- **Persistence Scope:** The default storage mode uses single-instance atomic file writes (`.data/celebr-store.json`). For multi-replica serverless deployments (such as Vercel), attaching an external database via `DATABASE_URL` is recommended.
- **Single Currency per Event:** While multiple international currencies are supported (`USD`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`), all line items within a single event share that event's base currency.

### Future Roadmap
- [ ] **Multi-User Real-time Collaboration:** Live collaborative planning using WebSockets or Supabase Realtime.
- [ ] **Calendar Synchronization:** Direct bidirectional export of milestones to Google Calendar and Apple iCal (`.ics`).
- [ ] **Vendor Invoice OCR:** Automatic expense logging from vendor quote PDFs and receipts using Gemini Multimodal understanding.
- [ ] **Exportable PDF Summary:** Comprehensive client-ready event dossier export for professional event planners.

---

## Project Links & Submission

- **Live Deployed Application:** [https://celebrai-event-planner.onrender.com](https://celebrai-event-planner.onrender.com)
- **Source Code Repository:** [https://github.com/Thirumal143200/celebrai-event-planner](https://github.com/Thirumal143200/celebrai-event-planner)
- **Full Submission Packet:** [SUBMISSION.md](SUBMISSION.md)
- **Code Provenance Declaration:** [PROVENANCE.md](PROVENANCE.md)

---

<div align="center">

*CelebrAI — Built with intention, precision, and ❤️ for PromptWars Virtual Challenge 5.*

</div>
