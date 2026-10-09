# Archify CodeAudit — Project Roadmap & Task Tracker

This document tracks completed features, active milestones, and the ongoing enterprise roadmap for **Archify CodeAudit**.

---

## 🚀 Status Overview

- **Current Version:** `1.1.0`
- **Core Engine:** Operational (Gemini 3.8 Flash + Local SAST Heuristics)
- **Status:** Production Ready

---

## ✅ Phase 1: Ingestion & Core Review Engine (Completed)

- [x] **GitHub Repository Ingestion Engine**:
  - [x] Fetch public repositories via GitHub REST API tree endpoints (`/api/github/fetch-repo`).
  - [x] Recursive traversal with file-type filtering (filters out binaries, media, build artifacts, lockfiles).
  - [x] Truncation protections for very large files (>50KB) to ensure prompt budget safety.
- [x] **ZIP Archive Unpacker (`Archify Engine`)**:
  - [x] Client-side archive extraction using `JSZip`.
  - [x] File filtering and metadata generation from uploaded packages.
- [x] **Deep Audit Orchestration**:
  - [x] Built-in local SAST scanner for SQLi, Hardcoded Secrets, Command Execution, Root Docker, Insecure CORS.
  - [x] Integration with Google Gen AI SDK (`@google/genai`) using `gemini-3.8-flash`.
  - [x] Automatic retry with exponential backoff and fallback synthesizers.
  - [x] Structured JSON schema generation for executive summaries, findings, features, and recommendations.
- [x] **Executive Overview Dashboard**:
  - [x] Health grade calculation (A+ through F) and 0–100 numerical score.
  - [x] Severity count breakdowns (Critical, High, Medium, Low, Info).
  - [x] Tech stack badge detection.
- [x] **Pre-loaded Sample Repositories**:
  - [x] Secure Node.js & Express REST API with full test suites.
  - [x] Microservice backend featuring intentional Dockerfile and Terraform misconfigurations.

---

## ✅ Phase 2: GitHub OAuth 2.0 & Repository Selection (Completed)

- [x] **Normal GitHub OAuth Flow**:
  - [x] Backend authorization URL endpoint (`/api/auth/github/url`) with state token.
  - [x] Dynamic redirect URI resolution based on current host (`origin`).
  - [x] OAuth callback handler (`/auth/callback`) with token exchange and profile fetching.
  - [x] Synchronous popup window launcher to prevent browser popup blockers.
  - [x] Fallback direct tab authorization link if iframe or browser strictly forbids popups.
  - [x] Multi-layer sync: `window.opener.postMessage`, browser `localStorage` events, and window `focus` listeners.
- [x] **User Repository Browser**:
  - [x] Private and public repository access via `read:user, repo` scope.
  - [x] Instant repository search and filter by type (All, Public, Private, Sources).
  - [x] One-click "Audit Repo" ingestion.
  - [x] Disconnect / Sign-out and session management.
- [x] **OAuth Troubleshooter & Bypass**:
  - [x] One-click copy for exact Authorization Callback URL.
  - [x] `mode=omit` option to bypass `redirect_uri` mismatches using GitHub App defaults.
  - [x] Personal Access Token (PAT) alternative for zero-configuration connection.

---

## ✅ Phase 3: Visual Architecture & Code Viewer (Completed)

- [x] **Archify Interactive Visual Workspace**:
  - [x] Interactive 5-tier architecture map (Client, Gateway, Business Logic, Data Storage, Security Boundaries).
  - [x] Node selection with live component risk cards and affected file listings.
  - [x] Architectural risk radar gauges (Access Control, Data Sanitization, Container Hardening, Boundary Isolation).
  - [x] File vulnerability heatmap visualization.
- [x] **Code & Diff Viewer**:
  - [x] Monospaced syntax-colored code viewer with line numbers.
  - [x] Inline banners highlighting detected vulnerabilities directly on the affected code line.
  - [x] Side-by-side original vs. proposed fix code diffs with one-click copy.
- [x] **Context-Aware AI Architect Chat**:
  - [x] Pre-grounded assistant with current repository files and findings.
  - [x] Prompt quick-starters (Dockerfile generation, refactoring diffs, OWASP explanations).

---

## ✅ Phase 4: Local Persistence & Compliance Export (Completed)

- [x] **Scan History Management**:
  - [x] Persistent browser storage (`historyStorage.ts`) for past audit results, metadata, and files.
  - [x] Header badge indicator showing total historical audits.
  - [x] Scan history modal with one-click switching between reviews without re-auditing.
  - [x] Individual review deletion and clear-history controls.
- [x] **Enterprise Export Engine**:
  - [x] OASIS SARIF v2.1.0 JSON format compliant with GitHub Advanced Security and VS Code.
  - [x] GitHub-flavored Markdown report generation for PR comments and compliance audits.

---

## 🔮 Phase 5: Upcoming Enhancements (Active Backlog)

### 1. Ingestion & Multi-Repository Enhancements
- [ ] **Monorepo & Multi-Package Support**:
  - [ ] Auto-detection of `pnpm-workspace.yaml`, Lerna, Nx, and Turborepo monorepos.
  - [ ] Per-package scope selector allowing targeted audits of specific workspaces.
- [ ] **Git Diff / Branch Comparison Mode**:
  - [ ] Compare two branches (e.g., `main` vs. `feature-branch`) to audit only modified files in a PR.
  - [ ] Display findings delta (New Flaws Introduced vs. Flaws Resolved).

### 2. Deeper SAST & Dependency Scanners (SCA)
- [ ] **Automated Dependency Vulnerability (CVE) Lookup**:
  - [ ] Parse `package.json`, `package-lock.json`, `requirements.txt`, `go.mod`, and `pom.xml`.
  - [ ] Match dependencies against the GitHub Advisory Database (GHSA) and OSV.dev API.
- [ ] **Custom Semgrep Ruleset Importer**:
  - [ ] Allow users to upload or configure custom YAML SAST rulesets.
  - [ ] Real-time regex and AST pattern evaluation.
- [ ] **Infrastructure as Code (IaC) Deep Scanner**:
  - [ ] Kubernetes manifest validator (privileged pods, missing resource limits, missing network policies).
  - [ ] Terraform / CloudFormation misconfiguration checks (open security groups, unencrypted S3 buckets).

### 3. CI/CD & Automated Pull Request Integration
- [ ] **GitHub App Automated PR Reviewer**:
  - [ ] Webhook integration to review incoming pull requests automatically.
  - [ ] Inline pull request code comments with suggested fix patches.
- [ ] **GitHub Actions Workflow Generator**:
  - [ ] One-click generation of `.github/workflows/archify-audit.yml` to run automated audits on `push` and `pull_request`.
  - [ ] Upload generated SARIF files automatically using `github/codeql-action/upload-sarif`.

### 4. Enterprise Compliance & Reporting
- [ ] **SBOM (Software Bill of Materials) Generation**:
  - [ ] Export in SPDX 2.3 and CycloneDX 1.5 JSON formats.
- [ ] **PDF Executive Report Export**:
  - [ ] Downloadable print-ready PDF executive summary with compliance charts (SOC 2, ISO 27001, HIPAA).
- [ ] **False Positive & Suppression Rule Management**:
  - [ ] Ability to mark findings as "False Positive" or "Risk Accepted" with audit trail justification.
  - [ ] Export suppression rules directly to `.sarif` or `.archifyignore` configuration file.

---

## 📈 Version History

- **v1.1.0** (Current):
  - Normal GitHub OAuth 2.0 authentication with unblockable popups and dynamic redirect URI resolver.
  - In-app OAuth troubleshooter with 1-click callback copy and `mode=omit` default bypass.
  - Interactive Archify Visual Workspace with architecture topology map and vulnerability heatmaps.
  - Local scan history persistence in browser storage.
  - OASIS SARIF v2.1.0 and Markdown audit reports export.
- **v1.0.0**:
  - Initial release with Gemini 3.8 Flash audit pipeline, local SAST heuristics, file explorer, and diff viewer.
