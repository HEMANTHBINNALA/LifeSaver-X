# LifeSaver X 🚨
## AI Emergency Productivity Agent

> **When your plan fails, your AI doesn't.**

LifeSaver X is a phone-first AI emergency productivity agent for situations where deadlines, meetings, limited availability, and unexpected delays collide.

Unlike a conventional task manager, LifeSaver X is designed around **failure recovery**. It evaluates workload risk, prioritizes competing tasks, generates a recovery plan, monitors execution, detects when the plan is becoming infeasible, and automatically creates a new plan.

**Hackathon:** iQOO Hackathon 2026  
**Track:** Productivity

---

## 🧭 The Core Idea

Most productivity software helps users create a plan.

LifeSaver X focuses on the harder problem:

> **What should the system do when the plan stops working?**

The core loop is:

```
User Tasks / Voice / Documents
              ↓
       Task Understanding
              ↓
         Risk Analysis
              ↓
       Priority Calculation
              ↓
          Recovery Plan
            (Plan 1)
              ↓
      Execution & Monitoring
              ↓
   Expected vs Actual Progress
              ↓
       Failure Detection
              ↓
      Automatic Replanning
            (Plan 2)
              ↓
      Explanation + LifeScore
              ↓
           Journal
```

The central design principle is simple:

**Failure becomes input to the next recovery decision.**

---

## 🎯 Problem

A schedule can become impossible even when the original plan was reasonable.

Typical disruptions include:

- meetings running late
- tasks taking longer than estimated
- new urgent work appearing
- available time shrinking
- actual progress falling behind expected progress
- multiple deadlines competing for the same time window

When this happens, users often have to manually decide:

- what must be protected
- what can be compressed
- what can be postponed
- what can be removed
- how the remaining time should be redistributed

LifeSaver X turns that manual recovery process into an adaptive agent workflow.

---

## 💡 Solution

LifeSaver X continuously answers four questions:

### 1. Can the current schedule still succeed?
The risk engine compares required work with available capacity.

### 2. What matters most?
The priority engine evaluates task urgency and importance signals.

### 3. What should the user do next?
The recovery planner creates an executable sequence of work and recovery blocks.

### 4. What happens when reality diverges from the plan?
Execution monitoring detects schedule deviation and triggers automatic replanning.

---

## 🧠 Core Features

### 🔴 Workload Risk Engine

Produces an explainable risk state based on the relationship between required effort and available time.

Example crisis scenario:

| Metric | Value |
|---|---:|
| Required work | 7.0 hours |
| Available time | 3.5 hours |
| Workload ratio | 2.0× |
| Risk | 98% |
| State | RED / Critical |

The interface should expose the reasons behind the risk rather than showing an unexplained score.

---

### ⚡ Priority Engine

Ranks tasks so limited time is spent on the most consequential work first.

Example:

| Task | Priority | Level |
|---|---:|---|
| Assignment | 85 | Critical |
| Interview | 46 | High |
| Other task | 23 | Low |

The priority result is then used by the recovery planner.

---

### 🗓️ Adaptive Recovery Planner

Creates an executable recovery plan using decisions such as:

- protect critical tasks
- compress work where possible
- defer non-essential work
- reorder tasks
- insert focused work blocks
- preserve short recovery breaks

The planner is intended to produce a realistic sequence rather than an idealized checklist.

---

### 📈 Execution Monitoring

LifeSaver X tracks progress against what the active plan expected.

Conceptually:

```
Expected Progress
        vs.
Actual Progress
        ↓
Schedule Deviation
```

This allows the system to distinguish between:

**"The user is following the plan"**

and

**"The current plan is no longer viable."**

---

### 🚨 Failure Detection

When the configured deviation threshold is crossed, the system marks the current recovery plan as failed.

Example:

```
Expected progress: 57%
Actual progress:   13%
Schedule slip:     +45%
Result:             Plan 1 FAILED
```

---

### 🔄 Autonomous Replanning

Once Plan 1 fails, LifeSaver X generates Plan 2 using the newly observed constraints.

Example:

```
PLAN 1
Assignment → 180 min
Interview  → 20 min
Optional work → deferred

        ↓ +45 minute delay

PLAN 2
Assignment → 135 min
Interview  → 67 min
Non-essential work → deferred
```

The new plan is structurally different and is designed to absorb the disruption while protecting critical work.

---

### 🔍 "What Changed?"

LifeSaver X explains the difference between Plan 1 and Plan 2.

Typical explanation:

```
+45 minute delay detected

Critical assignment remains protected
Interview allocation increased
Non-essential work deferred
Remaining recovery window compressed
```

This makes the replanning decision inspectable instead of presenting it as a black box.

---

### 🧮 LifeScore

The application calculates a composite execution/recovery signal using measurable factors from the user's current state and execution history.

The score is intended to provide a compact view of how well the user's schedule is being managed under changing conditions.

---

### 🎙️ Voice Interaction

Supports voice-driven task capture using the browser's Web Speech API in compatible Chromium environments.

Example:

> "I have an assignment due tomorrow and an interview at 5 PM."

The input can be transformed into task context for the recovery workflow.

A typed interaction path is available as fallback when speech recognition is unavailable.

---

### 📄 Document Intake

Users can provide supported document inputs such as:

- PDF
- TXT
- Markdown

The system reads the document, extracts task-relevant context, and uses a confirmation step before adding imported work to the schedule.

---

### 📔 Journal & Briefings

The application records recovery events and can generate contextual summaries for different parts of the day.

This creates a lightweight history of:

- plan changes
- failures
- recovery actions
- execution signals

---

### 🧪 Demo Mode

LifeSaver X includes a controlled crisis walkthrough for demonstration.

Demo state is isolated from real application state so that the predefined hackathon scenario does not overwrite the user's actual data.

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     EXPERIENCE LAYER                         │
│                                                              │
│       Next.js • React • Dashboard • Voice • Documents        │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                   AGENT ORCHESTRATION                        │
│                                                              │
│ Task • Risk • Priority • Planning • Execution • Monitoring  │
│                        • Replanning                          │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                     DECISION ENGINE                          │
│                                                              │
│ Risk scoring • Priority scoring • Scheduling constraints    │
│                 • Failure thresholds                         │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                       STATE LAYER                             │
│                                                              │
│ Local persistence • Execution history • LifeScore • Journal │
└──────────────────────────────────────────────────────────────┘
```

### Design philosophy

Critical numerical decisions are handled through deterministic logic where practical.

AI/LLM capabilities can be used for language-heavy work such as:

- understanding natural-language input
- extracting tasks from documents
- conversational interaction
- explaining decisions

This separation helps keep important calculations reproducible and testable.

---

## 🛠️ Technology Stack

### Frontend

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **Recharts**
- **Lucide React**

### AI / Interaction

- **Google Generative AI SDK**
- **Web Speech API**
- Client-side document reading
- Deterministic agent and decision modules

### State Management

- Browser `localStorage` for persistent client-side state
- Isolated demonstration state

### Development

- Node.js
- npm
- TypeScript
- ESLint

---

## 📂 Project Structure

A simplified view of the application architecture:

```
LifeSaver-X/
│
├── app/
│   ├── page.tsx                 # Landing experience
│   └── dashboard/
│       └── page.tsx             # Mission Control dashboard
│
├── src/
│   └── lib/
│       └── agents/
│           ├── types.ts         # Agent/domain types
│           ├── orchestrator.ts  # Core decision orchestration
│           ├── store.ts         # Persistent state
│           └── __tests__/       # Engine/E2E validation
│
├── public/                      # Static assets
├── LIFESAVER_X_AUDIT.md         # Earlier engineering audit
├── LIFESAVER_X_FINAL_AUDIT.md   # Final reliability audit
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
└── eslint.config.mjs
```

> File organization can evolve as the implementation changes; the architectural separation between UI, orchestration, decision logic and state is the important boundary.

---

## 🚀 Getting Started

### Prerequisites

Install:

- Node.js 18 or newer
- npm

### 1. Clone the repository

```bash
git clone https://github.com/HEMANTHBINNALA/LifeSaver-X.git
cd LifeSaver-X
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

### 4. Create a production build

```bash
npm run build
```

### 5. Start the production server

```bash
npm run start
```

### 6. Run linting

```bash
npm run lint
```

---

## 🧪 Validation & Testing

The project includes deterministic agent-engine tests and an end-to-end mandatory crisis scenario.

Final audit results recorded for the project:

```
Production build        ✅ PASSED
Engine tests             ✅ 7/7 PASSED
Mandatory E2E scenario   ✅ 5/5 PHASES PASSED
UI / Dashboard           ✅ VERIFIED
Demo isolation           ✅ VERIFIED
```

### Tested recovery scenario

```
7.0 h required
3.5 h available
        ↓
98% RED risk
        ↓
Priority calculation
        ↓
Plan 1
        ↓
+45 min simulated delay
        ↓
Failure detection
        ↓
Autonomous Plan 2
        ↓
LifeScore + Journal
```

See:

- [Final Production & Reliability Audit](./LIFESAVER_X_FINAL_AUDIT.md)
- [Engineering Audit](./LIFESAVER_X_AUDIT.md)

---

## 🎬 Hackathon Demo Flow

The intended live demonstration is short and deterministic:

### Phase 1 — Create a crisis

Show an overloaded schedule:

```
7 hours of work
3.5 hours available
Risk: 98% RED
```

### Phase 2 — Let LifeSaver X prioritize

Show:

```
Assignment → Critical
Interview  → High
Other      → Low
```

### Phase 3 — Generate Plan 1

Demonstrate the first recovery schedule.

### Phase 4 — Break the plan

Use:

**Simulate Delay +45m**

### Phase 5 — Detect failure

Show:

**PLAN 1 FAILED**

### Phase 6 — Recover

Show:

**AUTONOMOUS RE-PLANNING**

followed by Plan 2.

### Phase 7 — Explain

Open:

**What Changed?**

### Phase 8 — Close the loop

Show the updated:

- LifeScore
- Journal
- recovery history

---

## 📱 Phone-First Design

LifeSaver X is designed around fast interactions that make sense on a phone:

- voice task capture
- rapid contextual input
- document intake
- risk visibility
- recovery actions
- execution tracking
- immediate replanning

The phone acts as the user's emergency control surface.

The application can also be paired with deeper computation through an appropriate workstation or deployment environment.

---

## 🔐 Environment Variables

Never commit API keys or secrets to GitHub.

When provider-backed AI functionality is enabled, configure credentials through environment variables.

Example:

```env
GOOGLE_API_KEY=your_api_key_here
```

For local development, use:

```text
.env.local
```

and keep secrets excluded from version control.

> The exact variable name must match the implementation that consumes the credential.

---

## 🌐 Deployment

LifeSaver X is a Next.js application and can be deployed to a Next.js-compatible hosting platform.

### Recommended flow

```
GitHub
   ↓
Connect repository
   ↓
Deploy to hosting platform
   ↓
Configure environment variables
   ↓
Live prototype URL
```

For a hackathon, a public deployment URL is useful because judges can access the prototype without running the project locally.

### Before deployment

Verify:

```bash
npm install
npm run build
```

Then configure any required environment variables in the hosting provider.

---

## ⚠️ Current Platform Notes

### Voice Recognition

Speech recognition depends on browser support and microphone permissions. Chromium-based browsers are the primary target for the current web implementation.

### Document Processing

Document intake depends on browser-side file APIs and the structure of the source document. Complex PDFs may require more advanced server-side parsing in a future version.

### Persistence

Current application persistence uses browser `localStorage`. This means state is local to the browser/device rather than a centralized multi-user database.

### External Calendars

The repository should only be interpreted as integrating with Google Calendar, Outlook, or another external calendar provider if such an integration is explicitly implemented and configured.

### Native Android

The current implementation is a web application. A native Android client is part of the future roadmap rather than a claim of existing native Android expertise.

---

## 🗺️ Roadmap

### Current

- [x] Risk evaluation
- [x] Priority calculation
- [x] Adaptive recovery planning
- [x] Progress monitoring
- [x] Failure detection
- [x] Autonomous replanning
- [x] Plan 1 vs Plan 2 comparison
- [x] "What Changed?" explanation
- [x] LifeScore
- [x] Journal
- [x] Voice input with fallback
- [x] Document intake
- [x] Demo mode isolation

### Future

- [ ] Native Android application
- [ ] Deeper iQOO device integrations
- [ ] Calendar provider integrations
- [ ] More on-device AI
- [ ] Learned task-duration estimation
- [ ] Notification-driven recovery
- [ ] Multi-day optimization
- [ ] Collaborative/team recovery planning
- [ ] Server-backed multi-user persistence

---

## 🏆 Hackathon Positioning

**LifeSaver X is built around a different productivity question:**

> Not "What should I plan?"

but:

> **"What should I do when my plan has already failed?"**

The product's differentiating loop is:

```
PLAN
 ↓
EXECUTE
 ↓
DETECT FAILURE
 ↓
REPLAN
 ↓
RECOVER
```

---

## 👤 Author

**Hemanth Binnala**

GitHub: https://github.com/HEMANTHBINNALA

Project repository:

https://github.com/HEMANTHBINNALA/LifeSaver-X

---

## 📄 License

Add the project's intended open-source license here before distributing the repository under a specific license.

---

## ⭐ Final Project Statement

> **LifeSaver X doesn't optimize the perfect day.  
> It recovers the day when everything goes wrong.**
