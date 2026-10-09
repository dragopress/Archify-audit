# Archify CodeAudit — Comprehensive GitHub & Archive Reviewer

[![DevSecOps Standard](https://img.shields.io/badge/DevSecOps-SAST%20%7C%20SCA%20%7C%20IaC-blue?style=flat-square)](https://github.com)
[![SARIF Standard](https://img.shields.io/badge/Export-OASIS%20SARIF%20v2.1.0-emerald?style=flat-square)](https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html)
[![AI Architecture](https://img.shields.io/badge/Engine-Gemini%203.8%20Flash-indigo?style=flat-square)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-cyan?style=flat-square)](https://www.typescriptlang.org)

**Archify CodeAudit** is an enterprise-grade static application security testing (SAST), software composition analysis (SCA), infrastructure misconfiguration scanner, and architectural reviewer. It ingests source code directly from **GitHub repositories** (public and private via normal GitHub OAuth) or unpacked **ZIP code archives**, conducts a rigorous deep inspection of every file, and synthesizes actionable code fixes with unified diffs, executive health grades, and interactive visual architecture diagrams.

---

## 🌟 Core Features

### 1. Multi-Vector Code Ingestion
- **Direct GitHub Repository Fetching**: Ingest any public repository via URL or `owner/repo` slug (e.g. `expressjs/express`, `vuejs/core`). Traverses the Git tree recursively to retrieve all critical source and configuration files.
- **Normal GitHub OAuth 2.0 Authentication**: Seamless one-click GitHub login with automatic unblockable popup handling, session persistence, and instant repository selection for both personal and organization repositories.
- **Client-Side ZIP Archive Unpacker (`Archify Engine`)**: Drag-and-drop or upload `.zip` archives. Code is extracted and filtered in-memory via `JSZip` without requiring external file transfers.
- **Instant Pre-loaded Sample Repositories**: Test audits on realistic microservices, Express APIs, and containerized backends with pre-calculated reviews.

### 2. Comprehensive 360° DevSecOps & AI Audit Engine
- **SAST & Heuristic Security Scanning**: Detects hardcoded secrets, database injection (SQLi, NoSQLi), command execution (`eval`, `child_process.exec`), permissive CORS wildcards (`*`), unpinned base images, and root-level Docker users.
- **Gemini 3.8 Flash Semantic Analysis**: Audits high-level application architecture, business logic flaws, state management, error handling, and authorization boundaries.
- **Executive Overview & Health Grade**: Assigns an overall grade (**A+**, **A**, **B**, **C**, **D**, **F**) alongside a numerical 0–100 DevSecOps health score, categorized risk indicators, and technology stack breakdown.
- **Features & API Surface Extraction**: Auto-discovers API endpoints (Express, FastAPI, Next.js routes), authentication barriers, middleware pipelines, and core functional modules.
- **Actionable Fixes with Unified Diffs**: Every detected vulnerability includes affected file, line number, root cause, security impact, CWE/OWASP classification, and side-by-side **Original vs. Fixed code snippets**.

### 3. Archify Interactive Visual Workspace
- **System Architecture Topology Map**: Visual graph of Client Layer, API Gateway & Routing, Business Services, Data Persistence, and Security Boundaries.
- **Node Risk Radar**: Component-level security health scores, vulnerability density indicators, and direct jump-to-code navigation.
- **Vulnerability Heatmap**: Treemap visualization displaying file complexity versus security finding concentration.

### 4. Interactive Code & Diff Viewer
- Dark-mode, monospaced code viewer with custom line numbering and highlighted vulnerability gutters.
- Inline flaw banners showing severity badges, root cause summaries, and one-click fix copy.

### 5. Context-Aware AI Architect Chat ("Ask AI")
- Dedicated deep-dive assistant pre-grounded with the current repository's files, dependencies, and audit findings.
- Ask questions like: *"How do I fix finding SEC-LOC-1?"*, *"Generate a hardened multi-stage Dockerfile"*, or *"Refactor this authentication middleware to use JWT with RS256"*.

### 6. Enterprise SARIF & Markdown Export
- **OASIS SARIF v2.1.0 Export**: Industry-standard Static Analysis Results Format compatible with GitHub Code Scanning, SonarQube, DefectDojo, and VS Code.
- **Markdown Audit Reports**: Copyable or downloadable audit summaries formatted for pull request comments and DevSecOps compliance logs.

### 7. Local Scan History
- Automatically caches past audit metadata, findings, and scanned file trees in browser `localStorage`.
- Switch back to any previously audited repository instantly without re-fetching or re-running API audits.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons |
| **Backend** | Express 4.21, TypeScript (`tsx` runner), Node.js |
| **AI & LLM** | Google Gen AI SDK (`@google/genai`) using `gemini-3.8-flash` |
| **Archive Ingestion** | `JSZip` (client-side in-memory unpacker) |
| **Auth** | GitHub OAuth 2.0 (popup + direct tab fallback) & Personal Access Token (PAT) |
| **Compliance Export**| OASIS SARIF v2.1.0, Markdown GitHub Flavored |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ installed
- A Google Gemini API key (`GEMINI_API_KEY`)
- *(Optional)* GitHub OAuth App credentials (`GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`)

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file from `.env.example`:
```env
# Required for AI review engine
GEMINI_API_KEY="your-gemini-api-key"

# Application hosting URL (used for OAuth redirect callbacks)
APP_URL="http://localhost:3000"

# Optional: GitHub OAuth credentials for one-click repo login
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🔐 GitHub OAuth 2.0 Setup Guide

To use the **"Sign in with GitHub"** feature to select and audit repositories without copying URLs:

1. Go to **[GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers)**.
2. Click **New OAuth App**.
3. Fill in the required fields:
   - **Application name:** `Archify CodeAudit`
   - **Homepage URL:** Your application root URL (e.g., `https://your-domain.run.app` or `http://localhost:3000`)
   - **Authorization callback URL:**
     ```text
     https://your-domain.run.app/auth/callback
     ```
     *(In development, use `http://localhost:3000/auth/callback`)*
4. Click **Register application**.
5. Generate a **Client Secret** and add both `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to your environment secrets.

> **Note on Callback Mismatches**: If you see *"The redirect_uri is not associated with this application"*, verify that the callback URL in your GitHub OAuth settings exactly matches the running app's `/auth/callback` endpoint. The in-app troubleshooter includes a 1-click **"Copy Callback URL"** button and a **"Try without redirect_uri"** bypass.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/github/url` | Generates GitHub OAuth authorization URL with dynamic redirect parameter |
| `GET` | `/auth/callback` | OAuth callback receiver that validates tokens and syncs credentials via `postMessage` |
| `GET` | `/api/github/user` | Fetches authenticated GitHub profile details |
| `GET` | `/api/github/user/repos`| Lists authenticated user's private and public repositories |
| `POST`| `/api/github/fetch-repo` | Clones/fetches GitHub file tree and text source files recursively |
| `POST`| `/api/gemini/comprehensive-review` | Runs SAST heuristics and Gemini 3.8 Flash audit |
| `POST`| `/api/export/sarif` | Generates OASIS SARIF v2.1.0 document from findings |

---

## 🛡 Security Scanners & Rules Built-in

Archify CodeAudit features built-in static analysis heuristics that run locally before LLM enrichment:

- **SEC-01**: Hardcoded secrets, API tokens, and private keys (`CWE-798`)
- **SEC-02**: Raw SQL string concatenation & injection vulnerabilities (`CWE-89`)
- **SEC-03**: Dynamic code and arbitrary shell execution (`eval`, `child_process.exec`) (`CWE-94`)
- **SEC-04**: Containers running as unprivileged root user (`CWE-250`)
- **SEC-05**: Mutable Docker base image tags (`:latest` instead of pinned digest) (`CWE-1104`)
- **SEC-06**: Permissive cross-origin resource sharing wildcards (`Access-Control-Allow-Origin: *`) (`CWE-942`)

---

## 📄 License
Apache-2.0 License. See source files for details.
