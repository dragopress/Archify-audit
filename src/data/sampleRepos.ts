import { ComprehensiveAuditResult, IngestedFile, RepoMetadata } from '../types/audit';

export interface SampleRepo {
  id: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  tags: string[];
  metadata: RepoMetadata;
  files: IngestedFile[];
  precomputedAudit?: ComprehensiveAuditResult;
}

export const SAMPLE_REPOS: SampleRepo[] = [
  {
    id: 'fintech-node-express',
    name: 'payvault-core / payment-api',
    description: 'High-throughput Node.js/Express financial transaction microservice with JWT auth, Postgres queries, and Docker packaging.',
    language: 'TypeScript / Node.js',
    stars: 1240,
    tags: ['FinTech', 'Express', 'Docker', 'PostgreSQL', 'JWT'],
    metadata: {
      name: 'payment-api',
      fullName: 'payvault-core/payment-api',
      owner: 'payvault-core',
      description: 'High-throughput Node.js/Express financial transaction microservice with JWT auth, Postgres queries, and Docker packaging.',
      stars: 1240,
      forks: 184,
      openIssues: 12,
      license: 'MIT',
      defaultBranch: 'main',
      language: 'TypeScript',
      htmlUrl: 'https://github.com/payvault-core/payment-api',
      totalFileCount: 7,
      scannedFileCount: 7,
    },
    files: [
      {
        path: 'src/server.ts',
        content: `import express from 'express';
import { json } from 'body-parser';
import { authRouter } from './routes/auth';
import { paymentRouter } from './routes/payment';

const app = express();
app.use(json());

// INSECURE CORS: Wildcard allows any arbitrary domain to access authenticated payment credentials
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/payments', paymentRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(\`Payment Gateway running on port \${PORT}\`);
});`,
      },
      {
        path: 'src/routes/auth.ts',
        content: `import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';

export const authRouter = Router();

// CRITICAL VULNERABILITY: Hardcoded production JWT Secret key!
const JWT_SECRET = 'SuperSecretKey12345!ProductionMasterSigningKey';

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Potential timing attack & plain-text password comparison
  const user = await db.query(\`SELECT * FROM users WHERE email = '\${email}'\`);
  
  if (!user.rows || user.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.rows[0].id, role: user.rows[0].role },
    JWT_SECRET,
    { expiresIn: '7d' } // Overly long expiry for sensitive banking app
  );

  return res.json({ token, user: { id: user.rows[0].id, email: user.rows[0].email } });
});`,
      },
      {
        path: 'src/routes/payment.ts',
        content: `import { Router } from 'express';
import { db } from '../db';

export const paymentRouter = Router();

// CRITICAL VULNERABILITY: Direct SQL String concatenation (SQL Injection)
paymentRouter.get('/history/:accountId', async (req, res) => {
  const accountId = req.params.accountId;
  
  // Unsanitized string interpolation directly into SQL query
  const query = \`SELECT * FROM transactions WHERE account_id = '\${accountId}' ORDER BY created_at DESC\`;
  
  try {
    const result = await db.query(query);
    res.json({ transactions: result.rows });
  } catch (err: any) {
    // Information Disclosure: leaks internal database stack traces
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Dangerous dynamic script evaluation for custom billing formulas
paymentRouter.post('/calculate-tax', (req, res) => {
  const { baseAmount, customFormula } = req.body;
  try {
    // CRITICAL: Code execution via eval
    const calculated = eval(customFormula.replace('x', baseAmount));
    res.json({ calculatedAmount: calculated });
  } catch (e: any) {
    res.status(400).json({ error: 'Formula execution error: ' + e.message });
  }
});`,
      },
      {
        path: 'src/db.ts',
        content: `import { Pool } from 'pg';

// Fallback password in code if env var missing
export const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_admin_password_99',
  database: process.env.DB_NAME || 'payvault',
  port: 5432,
  ssl: false, // Insecure: No TLS encryption for database connection
});`,
      },
      {
        path: 'Dockerfile',
        content: `# Dockerfile for Payment Gateway
FROM node:latest

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# CRITICAL MISCONFIGURATION: Container runs as root
USER root

EXPOSE 8080

CMD ["npm", "start"]`,
      },
      {
        path: 'package.json',
        content: `{
  "name": "payment-api",
  "version": "1.0.0",
  "description": "Payment microservice",
  "main": "dist/server.js",
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc"
  },
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^8.5.1",
    "body-parser": "^1.20.1",
    "pg": "^8.11.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.17"
  }
}`,
      },
      {
        path: 'README.md',
        content: `# PayVault Core Payment API

High throughput transactional backend service handling ledgering, credit checks, and bank wire transfers.

## Features
- User Authentication with JWT
- Transaction History Lookup
- Dynamic Tax Calculation Engine
- PostgreSQL Storage Layer
- Containerized Docker Build

## Quick Start
\`\`\`bash
docker build -t payment-api .
docker run -p 8080:8080 payment-api
\`\`\`
`,
      },
    ],
    precomputedAudit: {
      executiveSummary: {
        appName: 'PayVault Core Payment API',
        grade: 'F',
        healthScore: 32,
        verdict: 'Severe Security Vulnerabilities & DevOps Misconfigurations Requiring Immediate Remediation',
        architectureType: 'RESTful Microservice (Node.js/Express)',
        primaryTechStack: ['TypeScript', 'Express.js', 'PostgreSQL', 'Docker', 'JWT'],
        riskLevel: 'Critical',
        summaryDescription: 'The repository provides core financial ledger and payment calculation functionality. However, it suffers from catastrophic architectural security gaps including hardcoded master cryptographic keys, multiple SQL injection vectors, arbitrary code execution via eval(), permissive wildcard CORS, and root container execution.',
      },
      featuresAndFunctionality: {
        overview: 'Transactional backend microservice handling payment authorization, account ledger lookup, and custom tariff calculations.',
        coreFeatures: [
          {
            name: 'Authentication & Session Issue',
            description: 'Signs and verifies JSON Web Tokens for API authorization.',
            status: 'Flawed',
          },
          {
            name: 'Transaction Ledger Querying',
            description: 'Retrieves historical transactions by account ID from PostgreSQL.',
            status: 'Flawed',
          },
          {
            name: 'Custom Tax/Formula Calculator',
            description: 'Evaluates dynamic mathematical formulas against base transaction amounts.',
            status: 'Flawed',
          },
          {
            name: 'Health Check Endpoint',
            description: 'Provides liveness probe and uptime metrics for container orchestrators.',
            status: 'Complete',
          },
        ],
        apiSurfaceAndEndpoints: [
          { method: 'POST', path: '/api/v1/auth/login', description: 'Authenticates user and returns 7-day bearer token', authRequired: false },
          { method: 'GET', path: '/api/v1/payments/history/:accountId', description: 'Returns transaction list for accountId', authRequired: true },
          { method: 'POST', path: '/api/v1/payments/calculate-tax', description: 'Calculates dynamic fee based on formula', authRequired: true },
          { method: 'GET', path: '/health', description: 'Container liveness and uptime check', authRequired: false },
        ],
        authAndDataFlow: 'Client authenticates via /login receiving a JWT. Protected routes are expected to check Bearer tokens, connecting to PostgreSQL database via connection pooling without TLS enforcement.',
      },
      findings: [
        {
          id: 'SEC-001',
          title: 'Hardcoded Production Master JWT Signing Secret',
          severity: 'Critical',
          category: 'Secret / Credential Leak',
          file: 'src/routes/auth.ts',
          line: 7,
          cwe: 'CWE-798: Use of Hard-coded Credentials',
          impact: 'Any actor viewing the repository or binary can forge valid administrative JWTs, completely bypassing authentication across all microservices.',
          description: 'The master HMAC secret used to sign authorization tokens is hardcoded directly in source code.',
          recommendation: 'Extract JWT_SECRET into a runtime environment variable injected via Docker secrets or Cloud KMS.',
          originalCode: `const JWT_SECRET = 'SuperSecretKey12345!ProductionMasterSigningKey';`,
          fixedCode: `const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing.');
}`,
        },
        {
          id: 'SEC-002',
          title: 'Remote Code Execution (RCE) via eval() in Tax Formula',
          severity: 'Critical',
          category: 'Security Flaw (SAST)',
          file: 'src/routes/payment.ts',
          line: 28,
          cwe: 'CWE-94: Improper Control of Generation of Code (Code Injection)',
          impact: 'Unauthenticated or compromised users can send malicious JavaScript payloads in customFormula to take over the container or host filesystem.',
          description: 'paymentRouter.post("/calculate-tax") executes arbitrary client-provided strings inside Node.js eval().',
          recommendation: 'Replace eval() with an AST-safe mathematical expression evaluator like mathjs or predefined tariff rule engine.',
          originalCode: `const calculated = eval(customFormula.replace('x', baseAmount));`,
          fixedCode: `// Use safe parser instead of eval
import { evaluate } from 'mathjs';
const calculated = evaluate(customFormula, { x: Number(baseAmount) });`,
        },
        {
          id: 'SEC-003',
          title: 'Unsanitized SQL String Concatenation (SQL Injection)',
          severity: 'Critical',
          category: 'Security Flaw (SAST)',
          file: 'src/routes/payment.ts',
          line: 10,
          cwe: 'CWE-89: SQL Injection',
          impact: 'Attackers can bypass account boundaries to read confidential transactions of all users or truncate ledger tables via stacked queries.',
          description: 'accountId from req.params is directly interpolated into SQL SELECT statement without parameterized sanitization.',
          recommendation: 'Convert to parameterized prepared statements with positional parameters ($1).',
          originalCode: `const query = \`SELECT * FROM transactions WHERE account_id = '\${accountId}' ORDER BY created_at DESC\`;
const result = await db.query(query);`,
          fixedCode: `const query = 'SELECT * FROM transactions WHERE account_id = $1 ORDER BY created_at DESC';
const result = await db.query(query, [accountId]);`,
        },
        {
          id: 'SEC-004',
          title: 'Permissive Wildcard Access-Control-Allow-Origin (*)',
          severity: 'High',
          category: 'Infrastructure & Docker',
          file: 'src/server.ts',
          line: 11,
          cwe: 'CWE-942: Permissive Cross-Domain Policy with Untrusted Domains',
          impact: 'Allows malicious third-party websites visited by users to execute cross-origin requests against this API and exfiltrate responses.',
          description: 'Global CORS middleware sets Access-Control-Allow-Origin to * without domain restriction.',
          recommendation: 'Configure strict CORS whitelist restricted to trusted internal web clients.',
          originalCode: `res.setHeader('Access-Control-Allow-Origin', '*');`,
          fixedCode: `const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
const origin = req.headers.origin;
if (origin && allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}`,
        },
        {
          id: 'SEC-005',
          title: 'Container Configured to Run as Root User',
          severity: 'Medium',
          category: 'Infrastructure & Docker',
          file: 'Dockerfile',
          line: 12,
          cwe: 'CWE-250: Execution with Unnecessary Privileges',
          impact: 'Should a remote code execution exploit occur (such as through eval), the attacker gains full root privileges within the container.',
          description: 'The Dockerfile explicitly declares USER root instead of an unprivileged service account.',
          recommendation: 'Switch to a non-root user (e.g. USER node) after npm install.',
          originalCode: `USER root`,
          fixedCode: `USER node`,
        },
        {
          id: 'SEC-006',
          title: 'Database Connection Without TLS Encryption',
          severity: 'Medium',
          category: 'Infrastructure & Docker',
          file: 'src/db.ts',
          line: 9,
          cwe: 'CWE-319: Cleartext Transmission of Sensitive Information',
          impact: 'Traffic between microservice and database server can be intercepted by network sniffers, exposing sensitive financial records.',
          description: 'pg.Pool explicitly sets ssl: false.',
          recommendation: 'Enable TLS/SSL certificate verification for production database links.',
          originalCode: `ssl: false,`,
          fixedCode: `ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,`,
        },
        {
          id: 'SEC-007',
          title: 'Unpinned Base Docker Image (:latest)',
          severity: 'Low',
          category: 'Infrastructure & Docker',
          file: 'Dockerfile',
          line: 2,
          cwe: 'CWE-1104: Use of Unmaintained or Mutable Third-Party Components',
          impact: 'Builds are non-deterministic and can silently pull breaking major Node.js releases.',
          description: 'FROM node:latest introduces build volatility.',
          recommendation: 'Pin base image to explicit LTS version, e.g., node:20.11-alpine.',
          originalCode: `FROM node:latest`,
          fixedCode: `FROM node:20.11-alpine`,
        },
      ],
      recommendations: {
        architecture: [
          'Introduce a Domain-Driven Design (DDD) layer separating HTTP routing from financial calculation and SQL persistence.',
          'Adopt an ORM/Query Builder (such as Prisma or Kysely) to eliminate direct string interpolation risks by design.',
          'Implement an idempotency key header (Idempotency-Key) on all financial write operations.',
        ],
        securityHardening: [
          'Rotate all leaked JWT keys immediately and inject keys via AWS KMS, GCP Secret Manager, or HashiCorp Vault.',
          'Adopt a Content Security Policy (CSP) and remove eval() entirely in favor of safe mathematical parsers.',
          'Enforce strict input validation using Zod or Joi schemas on every incoming request payload.',
        ],
        devOpsAndCI: [
          'Add automated Semgrep & Trivy scanner stages to GitHub Actions pull request CI workflows.',
          'Adopt multi-stage Docker builds with non-root unprivileged user (node or nonroot distroless).',
          'Enforce pre-commit git hooks using Gitleaks to block secret leaks before push.',
        ],
        performanceAndScalability: [
          'Implement Redis distributed rate limiting on /api/v1/auth/login to thwart brute-force password guessing.',
          'Configure connection pooling limits and keep-alive timeouts in node-pg Pool configuration.',
        ],
      },
      actionPlan: [
        {
          phase: 'Phase 1: Critical Hotfixes (Immediate / Day 1)',
          timeframe: '0 - 24 Hours',
          items: [
            'Revoke and replace hardcoded JWT_SECRET with environment secret vault.',
            'Remove eval() in calculate-tax and replace with safe math parser.',
            'Parameterize accountId in transaction query to stop SQL injection.',
          ],
        },
        {
          phase: 'Phase 2: DevSecOps Hardening (Week 1)',
          timeframe: 'Days 2 - 7',
          items: [
            'Update Dockerfile: pin to node:20-alpine and set USER node.',
            'Restrict CORS headers to explicit domain whitelist.',
            'Enforce TLS on PostgreSQL connection pool.',
            'Introduce Zod schema validation on all request bodies.',
          ],
        },
        {
          phase: 'Phase 3: Production Readiness & Observability',
          timeframe: 'Weeks 2 - 4',
          items: [
            'Integrate automated SAST (SARIF export) into CI/CD pipelines.',
            'Implement OpenTelemetry structured logging and Prometheus metrics.',
            'Introduce database migration tooling (Prisma/Knex) and rate-limiting.',
          ],
        },
      ],
    },
  },
  {
    id: 'ai-python-fastapi',
    name: 'agentic-ai / rag-service',
    description: 'Python FastAPI microservice orchestrating retrieval-augmented generation (RAG), vector embeddings, and web scraping.',
    language: 'Python / FastAPI',
    stars: 2840,
    tags: ['Python', 'FastAPI', 'RAG', 'LangChain', 'Docker'],
    metadata: {
      name: 'rag-service',
      fullName: 'agentic-ai/rag-service',
      owner: 'agentic-ai',
      description: 'Python FastAPI microservice orchestrating retrieval-augmented generation (RAG), vector embeddings, and web scraping.',
      stars: 2840,
      forks: 412,
      openIssues: 8,
      license: 'Apache-2.0',
      defaultBranch: 'main',
      language: 'Python',
      htmlUrl: 'https://github.com/agentic-ai/rag-service',
      totalFileCount: 6,
      scannedFileCount: 6,
    },
    files: [
      {
        path: 'app/main.py',
        content: `from fastapi import FastAPI, HTTPException
import httpx
import pickle
import os
from pydantic import BaseModel

app = FastAPI(title="Agentic RAG Service", version="1.0.0")

class ScrapeRequest(BaseModel):
    target_url: str

class CacheUpload(BaseModel):
    raw_payload: str

# CRITICAL VULNERABILITY: Server-Side Request Forgery (SSRF)
@app.post("/api/v1/scrape")
async def scrape_document(req: ScrapeRequest):
    # No internal IP filtering or URL validation
    async with httpx.AsyncClient() as client:
        # Attacker can probe http://169.254.169.254/latest/meta-data/ (AWS Cloud Metadata)
        response = await client.get(req.target_url)
        return {"status": response.status_code, "content": response.text[:2000]}

# CRITICAL VULNERABILITY: Insecure Deserialization via pickle
@app.post("/api/v1/cache/restore")
async def restore_vector_cache(payload: CacheUpload):
    import base64
    try:
        # pickle.loads executes arbitrary code encoded in object payloads
        data = pickle.loads(base64.b64decode(payload.raw_payload))
        return {"restored_keys": len(data)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}`,
      },
      {
        path: 'requirements.txt',
        content: `fastapi==0.104.1
uvicorn==0.24.0
httpx==0.25.0
pydantic==2.5.0
# Unpinned dangerous dependency
requests
numpy`,
      },
      {
        path: 'Dockerfile',
        content: `FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`,
      },
      {
        path: 'README.md',
        content: `# Agentic AI RAG Service
Vector store cache restoration and automated document scraping pipeline.
`,
      },
    ],
    precomputedAudit: {
      executiveSummary: {
        appName: 'Agentic AI RAG Service',
        grade: 'D',
        healthScore: 48,
        verdict: 'High-Risk SSRF & Insecure Deserialization Hazards in AI Ingestion Pipeline',
        architectureType: 'Asynchronous Python Microservice (FastAPI)',
        primaryTechStack: ['Python', 'FastAPI', 'httpx', 'Docker'],
        riskLevel: 'Critical',
        summaryDescription: 'Service performs URL ingestion and vector cache restoration. Crucially, it suffers from unmitigated Server-Side Request Forgery (SSRF) allowing access to cloud metadata services (e.g. AWS 169.254.169.254) and Python pickle deserialization RCE.',
      },
      featuresAndFunctionality: {
        overview: 'Document ingestion and vector embedding cache manager for retrieval-augmented generation.',
        coreFeatures: [
          { name: 'Document Web Scraper', description: 'Fetches arbitrary remote documents via HTTP GET', status: 'Flawed' },
          { name: 'Vector Cache Restore', description: 'Restores pickled vector embeddings into memory', status: 'Flawed' },
          { name: 'Health Check', description: 'Returns system readiness state', status: 'Complete' },
        ],
        apiSurfaceAndEndpoints: [
          { method: 'POST', path: '/api/v1/scrape', description: 'Fetches remote URL contents', authRequired: false },
          { method: 'POST', path: '/api/v1/cache/restore', description: 'Restores binary vector cache', authRequired: false },
          { method: 'GET', path: '/health', description: 'Liveness probe', authRequired: false },
        ],
        authAndDataFlow: 'Endpoints are completely unauthenticated. Client sends raw URLs and base64 strings directly to server-side parser.',
      },
      findings: [
        {
          id: 'PY-001',
          title: 'Full Server-Side Request Forgery (SSRF) in Scraper Endpoint',
          severity: 'Critical',
          category: 'Security Flaw (SAST)',
          file: 'app/main.py',
          line: 18,
          cwe: 'CWE-918: Server-Side Request Forgery (SSRF)',
          impact: 'Attackers can read IAM roles and temporary credentials from cloud metadata services (169.254.169.254) or scan internal VPC ports.',
          description: 'client.get(req.target_url) fetches user-supplied URLs without verifying protocol (http/https only) or blocking private IP ranges (RFC 1918).',
          recommendation: 'Enforce URL validation, allow only http/https, and resolve domain DNS to reject private IP ranges (127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.169.254).',
          originalCode: `response = await client.get(req.target_url)`,
          fixedCode: `import ipaddress, socket, urllib.parse

def is_safe_url(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in ('http', 'https'): return False
    ip = socket.gethostbyname(parsed.hostname)
    addr = ipaddress.ip_address(ip)
    return not (addr.is_private or addr.is_loopback or addr.is_link_local)

if not is_safe_url(req.target_url):
    raise HTTPException(status_code=400, detail="Forbidden target address")
response = await client.get(req.target_url)`,
        },
        {
          id: 'PY-002',
          title: 'Remote Code Execution via Python pickle.loads Deserialization',
          severity: 'Critical',
          category: 'Security Flaw (SAST)',
          file: 'app/main.py',
          line: 27,
          cwe: 'CWE-502: Deserialization of Untrusted Data',
          impact: 'Attackers can craft serialized payloads with __reduce__ methods to execute shell commands directly upon loading.',
          description: 'pickle.loads is used on user-controlled input.',
          recommendation: 'Never use pickle for untrusted input. Migrate to safe formats such as JSON, Protocol Buffers, or safetensors.',
          originalCode: `data = pickle.loads(base64.b64decode(payload.raw_payload))`,
          fixedCode: `import json
data = json.loads(base64.b64decode(payload.raw_payload).decode('utf-8'))`,
        },
      ],
      recommendations: {
        architecture: [
          'Isolate external web scraping into an ephemeral network-isolated worker sandbox with egress filtering.',
          'Replace pickle-based cache with Redis or Safetensors vector storage.',
        ],
        securityHardening: [
          'Add API key authentication middleware (e.g. FastAPI Security / HTTPBearer).',
          'Deploy an egress proxy blocking metadata IPs (169.254.169.254).',
        ],
        devOpsAndCI: [
          'Pin all dependencies in requirements.txt (e.g. requests, numpy).',
          'Add bandit and pip-audit steps to CI pipeline.',
        ],
        performanceAndScalability: [
          'Add timeout limits and maximum payload caps to httpx.AsyncClient requests.',
        ],
      },
      actionPlan: [
        {
          phase: 'Phase 1: Remediation of RCE and SSRF',
          timeframe: 'Immediate',
          items: ['Decommission pickle.loads', 'Implement strict IP and DNS validation for target_url'],
        },
        {
          phase: 'Phase 2: Authentication & Rate Limiting',
          timeframe: '1 Week',
          items: ['Require API Key on all routes', 'Pin requirements.txt versions'],
        },
      ],
    },
  },
];
