# 🎯 GATE Command Centre — GATE 2027 (Data Science & AI)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.116+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.3-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![SQLite](https://img.shields.io/badge/SQLite-WAL_Mode-003B57.svg?style=flat&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Tests](https://img.shields.io/badge/Tests-10%2F10_Passing-brightgreen.svg?style=flat&logo=pytest&logoColor=white)](https://docs.pytest.org)

An intelligent, full-stack academic execution and examination management command centre built specifically for serious aspirants preparing for **GATE 2027: Data Science and Artificial Intelligence (Paper Code: DA)**.

Target Exam Date: **February 6, 2027 at 09:30 AM IST**  
Target Syllabus Completion: **January 15, 2027**

---

## 🌟 Core Architecture & Key Features

### 1. 📚 Complete Official GATE 2027 DA Syllabus Engine
* **All 7 Official DA Subjects Pre-Seeded with Exam Weightages**:
  1. **Probability and Statistics** (16.0% weightage)
  2. **Linear Algebra** (14.0% weightage)
  3. **Calculus and Optimization** (12.0% weightage)
  4. **Programming, Data Structures & Algorithms** (16.0% weightage)
  5. **Database Management & Data Warehousing** (12.0% weightage)
  6. **Machine Learning & Artificial Intelligence** (16.0% weightage)
  7. **General Aptitude** (15.0% weightage)
* **20 Chapters & 51 Granular Topics** with subtopic checklists, PYQ solve targets, difficulty ratings, estimated hours, actual hours, and mastery tracking.
* **Mathematically Weighted Syllabus Completion**:
  $$\text{Syllabus Completion \%} = \frac{\sum (\text{Topic Completion Ratio} \times \text{Estimated Hours})}{\text{Total Estimated Syllabus Hours}} \times 100$$

### 2. 🧠 Spaced Repetition System (SRS)
* **Confidence-Driven SuperMemo / Leitner Intervals**:
  * **Weak**: 1-day immediate reinforcement
  * **Average**: 3-day recall check
  * **Good**: 1 → 3 → 7 → 14 → 30 day spaced curve
  * **Strong**: 21 → 45 → 90 day retention cycles
* **Revision Matrix**: Instant sorting into *Due Today*, *Overdue*, *Upcoming*, and *Weak Topics*.
* **Mistake Auto-Trigger**: Any topic accumulating 3 or more unresolved mistakes is automatically flagged as `Needs Revision`.

### 3. 🗓️ Unified Day-Wise Planner & Zero-Guilt Backlog Reflow
* **Deterministic Study Generation**: Automatically schedules prioritized 60-minute blocks interleaved by subject priority, baseline proficiency, and user daily target hours.
* **Unified Work Item Types**:
  * `Concept Learning`
  * `Mathematical Practice`
  * `PYQ Practice`
  * `Spaced Revision`
  * `Mock Test`
  * `Mock Analysis`
* **Zero-Guilt Backlog Reflow**: Missed or deferred tasks are gracefully cascaded into future available slots without erasing previous study history or causing burnout.
* **Audit Trail**: Every automated adjustment, deferral, and reflow is permanently recorded in `automation_events` with full reversibility.

### 4. 📝 Mock Test Vault with Exact GATE DA Scoring
* **Official GATE DA Marking Scheme Built-In**:
  * **1-Mark MCQ**: $+1.0$ (correct), $-\frac{1}{3}$ penalty (incorrect)
  * **2-Mark MCQ**: $+2.0$ (correct), $-\frac{2}{3}$ penalty (incorrect)
  * **1-Mark MSQ**: $+1.0$ (correct), **$0.0$ negative penalty**
  * **2-Mark MSQ**: $+2.0$ (correct), **$0.0$ negative penalty**
  * **1-Mark NAT**: $+1.0$ (correct), **$0.0$ negative penalty**
  * **2-Mark NAT**: $+2.0$ (correct), **$0.0$ negative penalty**
* **Instant Analysis**: Calculates net marks, gross positive marks, negative marks lost, accuracy %, attempt rate %, and subject-level score breakdowns.
* **Automatic Mistake Vault Logging**: Incorrect questions automatically flow into the Mistake Vault for root-cause diagnosis.

### 5. 🔍 Mistake Vault (Error Diagnostics)
* **Root-Cause Categorization**:
  * `Conceptual Gap`
  * `Formula or Theorem Forgetting`
  * `Calculation or Algebra Error`
  * `Question Misinterpretation`
  * `Time Pressure or Guessing`
* **Resolution Workflow**: Track marks lost, record the correct solution and derivation notes, and mark as resolved when retried.

### 6. 🤖 Intelligent Interaction Engine (Check-ins & Reflection)
* **🌅 Morning Check-In**: Reviews yesterday's hours vs. target, presents today's execution queue, and confirms daily workload.
* **🌆 Evening Review**: Reflection on daily milestones, log unlogged focus time, and triggers automated backlog reflow.
* **⏱️ Task/Session Completion Modal**: Reconciles focus blocks immediately after timer expiry, updates topic mastery, and schedules the next spaced revision date.

### 7. ⏱️ Persistent Global Timer & Command Palette
* **Multi-Mode Focus**: Pomodoro (25/5/15), Deep Work (50/10), and Open Stopwatch.
* **Global Accessibility**: Stays pinned across all pages, linked to the active task.
* **Command Palette (`Ctrl + K`)**: Instant keyboard navigation, search, and focus timer trigger.

### 8. 📓 Formula & Study Journal with KaTeX Math
* **LaTeX Formula Rendering**: Render inline $\LaTeX$ ($E[X|Y]$, $\text{tr}(A)$, $A = U \Sigma V^T$) and block math equations.
* **Categorized Notes**: Daily Reflections, Formula Sheets, and Concept Notes with tag filtering and pinning.

### 9. 📊 Analytics & Preparation Intelligence Dashboard
* **Real-Time Exam Countdown**: Exact countdown to February 6, 2027.
* **Pacing Analytics**: Required daily run-rate hours vs. 7-day rolling average.
* **Streak Tracker & Mistake Distribution Charts**: Visual distribution of error patterns and mock score progression.

### 10. 💾 Data Portability & Settings
* **Full JSON Export / Import**: Complete database backup and restore with zero external dependencies.
* **Reset Without Data Loss**: Option to reset study progress to Day 1 while keeping the official syllabus structure intact.

---

## 🏗️ Project Structure

```
Gate_app/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py             # Pydantic Settings & Exam Constants
│   │   │   └── database.py           # SQLite WAL Mode Engine & Session
│   │   ├── models/
│   │   │   └── models.py             # SQLModel Schemas (13 relational entities)
│   │   ├── routers/
│   │   │   ├── analytics.py          # Dashboard & Comprehensive KPIs
│   │   │   ├── data.py               # JSON Backup Export, Import, Reset
│   │   │   ├── interactions.py       # Check-ins & Task Completion Modals
│   │   │   ├── journal.py            # KaTeX Notes & Formula Sheets
│   │   │   ├── mistakes.py           # Mistake Vault CRUD & Resolution
│   │   │   ├── mocks.py              # Mock Tests & Scoring Engine
│   │   │   ├── planner.py            # Today Queue, Backlog, Defer, Reflow
│   │   │   ├── sessions.py           # Timer Focus Sessions
│   │   │   ├── settings.py           # User Configuration & Baselines
│   │   │   └── syllabus.py           # Official Syllabus Tree & Revisions
│   │   ├── services/
│   │   │   ├── analytics_service.py  # Pacing, KPIs & Intelligence Insights
│   │   │   ├── data_service.py       # Backup & Database Reset
│   │   │   ├── interaction_service.py# Morning/Evening State Machine
│   │   │   ├── mock_service.py       # GATE DA Scoring & Penalties
│   │   │   ├── planner_service.py    # Study Plan Generation & Reflow
│   │   │   ├── seed_data.py          # Complete 7-Subject Syllabus Data
│   │   │   └── srs_service.py        # Spaced Repetition Scheduling
│   │   └── main.py                   # FastAPI Application & Lifespan
│   ├── data/                         # SQLite Database Storage (WAL Mode)
│   ├── tests/
│   │   └── test_full_suite.py        # 10 Pytest Integration Suites (100% Pass)
│   ├── requirements.txt              # Backend Dependencies
│   └── run.py                        # Uvicorn Development Entrypoint
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CommandPalette.tsx    # Ctrl+K Global Search & Actions
│   │   │   ├── GlobalTimerBar.tsx    # Persistent Pomodoro / Stopwatch Bar
│   │   │   ├── IntelligentAssistantModal.tsx # Check-in & Review Workflows
│   │   │   ├── Navbar.tsx            # Live Countdown & Quick Launcher
│   │   │   └── Sidebar.tsx           # Primary Navigation (1-7 shortcuts)
│   │   ├── context/
│   │   │   └── TimerContext.tsx      # Timer State Provider & Persistence
│   │   ├── pages/
│   │   │   ├── AnalyticsPage.tsx     # Progress Charts & Error Analytics
│   │   │   ├── DashboardPage.tsx     # Today's Queue & Readiness Overview
│   │   │   ├── JournalPage.tsx       # KaTeX Notes & Formula Sheet
│   │   │   ├── MocksPage.tsx         # Mock Tests & Mistake Vault
│   │   │   ├── PlannerPage.tsx       # Calendar & Backlog Management
│   │   │   ├── SettingsPage.tsx      # User Baselines & Backup Controls
│   │   │   └── SyllabusPage.tsx      # Interactive Syllabus Tree & SRS Matrix
│   │   ├── services/
│   │   │   └── api.ts                # Typed API Client for all Endpoints
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript Domain Types
│   │   ├── App.tsx                   # Master Layout & Global Shortcuts
│   │   └── main.tsx                  # React DOM Entrypoint
│   ├── package.json                  # React 19, Lucide, Recharts, KaTeX
│   ├── tailwind.config.js            # Dark Mode Cyber-Academic Theme
│   └── vite.config.ts                # Vite Configuration
│
├── BLOG.md                           # Detailed Engineering Architecture Deep-Dive
├── README.md                         # Project Documentation
└── .gitignore                        # Git Rules
```

---

## ⚡ Quick Start & Installation

### Prerequisites
* **Python 3.10+** (with `uv` or `pip`)
* **Node.js 18+** & **npm**

### 1. Backend Setup
```powershell
cd E:\Gate_app\backend

# Create virtual environment (using uv or python -m venv)
uv venv .venv --python 3.10
# Or: python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate

# Install dependencies
uv pip install -r requirements.txt
# Or: pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn app.main:app --port 8000 --reload
```
* Backend API will be live at: **http://127.0.0.1:8000**
* Interactive Swagger Docs: **http://127.0.0.1:8000/docs**
* API Health Check: **http://127.0.0.1:8000/api/health**

### 2. Frontend Setup
In a new terminal window:
```powershell
cd E:\Gate_app\frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
* Open your browser at: **http://localhost:5173**

---

## 🧪 Automated Testing

The backend includes a comprehensive automated test suite covering all 10 domain systems:

```powershell
cd E:\Gate_app\backend
$env:PYTHONPATH = "E:\Gate_app\backend"
.venv\Scripts\python.exe -m pytest tests/test_full_suite.py -v
```

### Test Coverage Highlights:
* ✅ `test_health_check`: Verifies API uptime and exam target validation.
* ✅ `test_user_settings`: Settings retrieval and update flow.
* ✅ `test_syllabus_endpoints`: Syllabus tree hierarchy, topic details, and SRS matrix.
* ✅ `test_planner_endpoints`: Today's queue, backlog detection, task deferrals, and completion.
* ✅ `test_study_sessions_and_timer_integration`: Focus session logging and topic hour reconciliation.
* ✅ `test_intelligent_interactions`: Morning check-in, evening review, and task completion feedback.
* ✅ `test_mock_test_scoring_and_mistake_vault`: GATE DA official penalty calculation (MCQ vs. MSQ/NAT) and error categorization.
* ✅ `test_journal_endpoints`: KaTeX formula sheet creation, tag searches, and pinning.
* ✅ `test_analytics_endpoints`: Live countdown, weighted progress, and run-rate calculations.
* ✅ `test_data_export_and_backup`: Full JSON backup export and restore validation.

Frontend build check:
```powershell
cd E:\Gate_app\frontend
npm run build
npm run lint
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|:---|:---|
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | Toggle Command Palette |
| <kbd>1</kbd> | Jump to **Dashboard** |
| <kbd>2</kbd> | Jump to **Syllabus & SRS Matrix** |
| <kbd>3</kbd> | Jump to **Planner & Backlog** |
| <kbd>4</kbd> | Jump to **Mock Tests & Mistake Vault** |
| <kbd>5</kbd> | Jump to **Formula & Study Journal** |
| <kbd>6</kbd> | Jump to **Analytics & Intelligence** |
| <kbd>7</kbd> | Jump to **Settings & Data Backup** |

---

## 🛡️ License

This project is licensed under the MIT License — free to use and customize for your academic preparation.
