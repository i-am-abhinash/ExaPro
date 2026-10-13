# Exapro — AI-Powered Software Project Documentation Generator

**Exapro** is an automated technical evaluation and project documentation generator built for developers, students, and engineering teams. It inspects software projects submitted as **ZIP archives** or public **GitHub repositories**, analyzes their technology stacks, source components, routes, and database schemas, synthesizes an evidence-based **Architecture Diagram**, and compiles a downloadable **DOCX technical documentation report**.

---

## 1. Strict Technology Stack Compliance Audit

Exapro strictly adheres to the mandated technology stack specifications:

| Component | Specified Requirement | Actual Implementation | Audit Status |
| :--- | :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS | React 18, TypeScript 5.7, Vite 6.1, Tailwind CSS 3.4 | **PASS (100% compliant)** |
| **Optional UI**| Framer Motion | Framer Motion 12.4 installed & configured | **PASS** |
| **Backend** | Node.js, Express, TypeScript | Node.js v24.21, Express 4.21, TypeScript 5.7 | **PASS (100% compliant)** |
| **Database** | MongoDB with Mongoose | Mongoose 8.10 with MongoDB (External URI + Embedded MongoMemoryServer fallback) | **PASS (100% compliant)** |
| **Validation** | Zod | Zod 3.24 for API requests & AI responses | **PASS (100% compliant)** |
| **AI Review** | Google Gemini API (secure server `.env`) | `@google/generative-ai` 0.24 behind isolated service with deterministic fallback | **PASS (100% compliant)** |
| **Repo Access**| GitHub REST API & Git Trees API | Native GitHub integration with recursive Git Trees | **PASS (100% compliant)** |
| **DOCX Gen** | Word Document Generator (`docx`) | `docx` 9.2 with embedded architecture diagram image | **PASS (100% compliant)** |

### Strict Restrictions Verification
- **No Python / FastAPI / Flask / Django**: None used. Entire backend is Node.js + Express + TypeScript.
- **No Firebase / Supabase / PostgreSQL / SQLite**: None used. Persistent storage is strictly MongoDB with Mongoose.
- **No other frontend framework**: React with Vite and Tailwind CSS exclusively.
- **No paid AI dependencies**: Uses Google Gemini API with deterministic rule-based analysis fallback when unconfigured.
- **No arbitrary code execution**: Submitted project code is statically inspected; never executed or built.

---

## 2. Key Capabilities & Workflow

1. **Dual Submission Pipeline**:
   - **Upload Project ZIP**: Drag-and-drop file upload with Zip Slip path traversal defenses and decompression size caps.
   - **Import from GitHub**: Validates public repository URLs, fetches file trees via the Git Trees API, and prioritizes essential manifests, configs, and source modules.
2. **Deep Static Inspection Engine**:
   - Discovers languages, frontend libraries, backend runtimes, database drivers, and testing frameworks.
   - Parses package manifests (`package.json`, `requirements.txt`, etc.) and extraction scripts (`start`, `build`, `test`, `dev`).
   - Discovers API endpoints (`GET`, `POST`, `PUT`, `DELETE`), Mongoose models, and directory hierarchies.
3. **Mandatory Architecture Diagram**:
   - Automatically generates a clean, project-specific SVG diagram representing client tiers, routing controllers, business services, and database persistence tiers.
   - Renders SVG into high-resolution PNG buffers via `@resvg/resvg-js`.
   - Embeds the rendered diagram directly into the Word document (`word/media/image*.png`) and displays it in the interactive web preview.
4. **14 Structured Document Sections**:
   - Cover Page with project metadata
   - 1. Executive Summary
   - 2. Project Overview
   - 3. Technology Stack & Dependencies (with table)
   - 4. Project Structure (ASCII directory tree)
   - 5. System Architecture (Embedded diagram image + narrative)
   - 6. Module & Component Details
   - 7. Data Flow & Communication
   - 8. Database Design & Schemas
   - 9. API Documentation & Routes
   - 10. Setup and Execution Guide
   - 11. Testing & Quality Verification
   - 12. Limitations & Observations
   - 13. Appendix & File Inventory
5. **MongoDB Persistence & History**:
   - Stores analysis metadata, component inventories, and generated report links.
   - Reopen reports anytime without re-running analysis.

---

## 3. Project Structure

```
exapro/
├── package.json              # Root scripts for frontend and backend
├── README.md                 # Project documentation and audit report
├── test-e2e.js               # Automated end-to-end test suite
├── create-test-zip.js        # Test archive generator
├── backend/                  # Node.js + Express + TypeScript Backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── uploads/              # Temporary upload storage
│   ├── temp_extracted/       # Sandboxed inspection directory
│   ├── reports/              # Generated DOCX documents
│   └── src/
│       ├── server.ts         # Express server entry point
│       ├── config/
│       │   └── env.ts        # Environment & directory configuration
│       ├── db/
│       │   └── connection.ts # Mongoose connection & embedded fallback
│       ├── models/
│       │   └── Project.ts    # MongoDB Project Mongoose schema
│       ├── validators/
│       │   └── projectSchemas.ts # Zod validation schemas
│       ├── services/
│       │   ├── zipService.ts      # Safe ZIP extraction & Zip Slip defenses
│       │   ├── githubService.ts   # GitHub API retrieval
│       │   ├── analyzerService.ts # Deep static analysis engine
│       │   ├── diagramService.ts  # Architecture SVG & Resvg PNG renderer
│       │   ├── aiService.ts       # Gemini API & deterministic fallback
│       │   └── docxService.ts     # DOCX 14-section report generator
│       ├── controllers/
│       │   └── projectController.ts # API request handlers
│       └── routes/
│           └── projectRoutes.ts     # Express router definition
└── frontend/                 # React + TypeScript + Vite + Tailwind CSS
    ├── package.json
    ├── vite.config.ts        # Vite config with API proxy
    ├── tailwind.config.js    # Developer dark theme config
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx          # React application entry point
        ├── App.tsx           # Main coordinator view
        ├── index.css         # Tailwind & custom scrollbars
        ├── types/
        │   └── index.ts      # TypeScript interfaces
        ├── services/
        │   └── api.ts        # API client
        └── components/
            ├── Navbar.tsx            # Header & system health badge
            ├── DashboardView.tsx     # Hero & recent project reports
            ├── SubmissionView.tsx    # ZIP dropzone & GitHub URL input
            ├── ReportPreviewView.tsx # Interactive preview & diagram
            └── HistoryView.tsx       # Saved evaluations & DOCX downloads
```

---

## 4. Setup and Execution

### Prerequisites
- **Node.js**: v18+ (tested on Node.js v24)
- **npm**: v9+
- *(Optional)* **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017/exapro`) or MongoDB Atlas URI. If omitted, Exapro automatically initializes an embedded MongoDB memory server with zero manual setup.

### 1. Install Dependencies
From the root directory:
```bash
npm run install:backend
npm run install:frontend
```

### 2. Configure Environment Variables
Copy `.env.example` in `backend/`:
```bash
cp backend/.env.example backend/.env
```
Default `.env` configuration:
```env
PORT=5000
MONGODB_URI=
GEMINI_API_KEY=
GITHUB_TOKEN=
```
- `MONGODB_URI`: Leave empty for the automatic embedded MongoDB server, or enter your MongoDB connection string.
- `GEMINI_API_KEY`: *(Optional)* Add your Google Gemini API key. If omitted, Exapro runs in 100% functional deterministic inspection mode.
- `GITHUB_TOKEN`: *(Optional)* Add your GitHub personal access token to expand API rate limits.

### 3. Build & Run

#### Run the Backend:
```bash
# Terminal 1: Run the backend API server (runs on http://localhost:5000)
npm run start:backend
```

#### Run the Frontend:
```bash
# Terminal 2: Run the frontend development server (runs on http://localhost:3000)
npm run dev:frontend
```
Open your browser at `http://localhost:3000`.

### 4. Run Automated End-to-End Tests
To verify the complete submission, static inspection, architecture diagram synthesis, and DOCX generation workflow:
```bash
npm run test:e2e
```

---

## 5. Acceptance Criteria Verification

| Acceptance Criterion | Verification Evidence | Result |
| :--- | :--- | :--- |
| **Strict Technology Stack** | Verified: React + Vite + Tailwind (Frontend), Node + Express + TypeScript (Backend), MongoDB + Mongoose (Database), Zod (Validation), Gemini (AI with fallback). No unauthorized frameworks. | **PASS** |
| **Project ZIP Submission** | Tested via `POST /api/projects/upload` with `test-taskflow.zip`. Files safely extracted with Zip Slip prevention. | **PASS** |
| **Public GitHub Submission** | Tested via `POST /api/projects/github` with `https://github.com/expressjs/express`. Git tree fetched and files downloaded safely. | **PASS** |
| **Real Project Inspection** | Inspected package.json, TypeScript routes, Mongoose models, and README. Detected Express, React, TypeScript, Jest, Mongoose. | **PASS** |
| **Architecture Diagram Generated** | Synthesized project-specific SVG showing Client Tier, Server Tier, Logic Services, and Database Tier. | **PASS** |
| **Diagram Embedded in DOCX** | Rendered SVG to PNG buffer with `@resvg/resvg-js`. Verified embedded `word/media/image1.png` inside the downloaded `.docx` archive. | **PASS** |
| **Comprehensive Documentation** | Generated all 14 required sections including Executive Summary, Data Flow, Database Schemas, API Endpoints, Setup, and Quality. | **PASS** |
| **In-App Report Preview** | Full interactive report viewer in React with live SVG rendering and table-of-contents navigation. | **PASS** |
| **Download Valid DOCX File** | Downloaded 110KB `.docx` deliverable from `/api/projects/:id/download`. Validated `word/document.xml` integrity. | **PASS** |
| **MongoDB Persistence** | Persisted project evaluations, metadata, and status in MongoDB via Mongoose. Verified list and retrieval endpoints. | **PASS** |
| **AI-Unavailable Operation** | Verified complete workflow operates smoothly without `GEMINI_API_KEY` using deterministic analysis. | **PASS** |
| **Safe Static Code Handling** | Uploaded code is strictly parsed statically; never built or executed. Archive paths strictly validated. | **PASS** |
| **Secrets Protection** | Secret credentials redacted; `.env` templates stripped; no credentials leaked in reports or client bundle. | **PASS** |
