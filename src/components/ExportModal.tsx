import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FileCode2,
  FileText,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { ComprehensiveAuditResult, RepoMetadata } from '../types/audit';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditResult: ComprehensiveAuditResult | null;
  metadata: RepoMetadata | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  auditResult,
  metadata,
}) => {
  const [activeFormat, setActiveFormat] = useState<'sarif' | 'markdown'>('sarif');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !auditResult) return null;

  // Generate SARIF JSON
  const sarifObj = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'Archify CodeAudit',
            informationUri: 'https://github.com',
            version: '1.0.0',
            rules: auditResult.findings.map((f) => ({
              id: f.id,
              name: f.title,
              shortDescription: { text: f.title },
              fullDescription: { text: f.description },
              help: { text: `${f.recommendation}\n\nSuggested Fix:\n${f.fixedCode}` },
              defaultConfiguration: {
                level:
                  f.severity === 'Critical' || f.severity === 'High'
                    ? 'error'
                    : f.severity === 'Medium'
                    ? 'warning'
                    : 'note',
              },
              properties: {
                tags: [f.category, f.cwe || 'SAST'],
              },
            })),
          },
        },
        results: auditResult.findings.map((f) => ({
          ruleId: f.id,
          message: { text: `${f.title}: ${f.description}` },
          level:
            f.severity === 'Critical' || f.severity === 'High'
              ? 'error'
              : f.severity === 'Medium'
              ? 'warning'
              : 'note',
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: f.file },
                region: { startLine: f.line || 1 },
              },
            },
          ],
        })),
      },
    ],
  };

  const sarifString = JSON.stringify(sarifObj, null, 2);

  // Generate Markdown Report
  const markdownString = `# 🛡️ Archify CodeAudit Report: ${auditResult.executiveSummary.appName}

- **Repository:** ${metadata?.fullName || 'Code Archive'}
- **Audit Date:** ${new Date().toLocaleDateString()}
- **DevSecOps Grade:** **${auditResult.executiveSummary.grade}** (${auditResult.executiveSummary.healthScore}/100)
- **Risk Posture:** **${auditResult.executiveSummary.riskLevel}**
- **Architecture Type:** ${auditResult.executiveSummary.architectureType}

---

## 1. Executive Summary & Verdict
${auditResult.executiveSummary.summaryDescription}

> **Auditor Verdict:** ${auditResult.executiveSummary.verdict}

---

## 2. Findings Summary (${auditResult.findings.length} total)

| Severity | ID | Title | File & Line | CWE |
| :--- | :--- | :--- | :--- | :--- |
${auditResult.findings
  .map(
    (f) =>
      `| **${f.severity}** | \`${f.id}\` | ${f.title} | \`${f.file}${f.line ? `:${f.line}` : ''}\` | ${f.cwe || 'N/A'} |`
  )
  .join('\n')}

---

## 3. Detailed Findings & Recommended Fixes

${auditResult.findings
  .map(
    (f) => `### [${f.severity}] ${f.title} (\`${f.id}\`)
- **File:** \`${f.file}${f.line ? `:${f.line}` : ''}\`
- **Category:** ${f.category}
- **CWE:** ${f.cwe || 'N/A'}
- **Impact:** ${f.impact}

**Description:**
${f.description}

**Remediation Recommendation:**
${f.recommendation}

\`\`\`diff
- // Vulnerable
${f.originalCode}
+ // Remediated
${f.fixedCode}
\`\`\`
`
  )
  .join('\n\n')}

---

## 4. Remediation Roadmap

${auditResult.actionPlan
  .map(
    (phase) => `### ${phase.phase} (${phase.timeframe})
${phase.items.map((item) => `- [ ] ${item}`).join('\n')}
`
  )
  .join('\n')}
`;

  const activeContent = activeFormat === 'sarif' ? sarifString : markdownString;

  const handleDownload = () => {
    const filename =
      activeFormat === 'sarif'
        ? `${metadata?.name || 'repo'}-audit.sarif`
        : `${metadata?.name || 'repo'}-audit-report.md`;

    const blob = new Blob([activeContent], {
      type: activeFormat === 'sarif' ? 'application/json' : 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Export Audit Report</h2>
              <p className="text-xs text-slate-400">
                Industry-standard OASIS SARIF v2.1.0 or Markdown for GitHub PRs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveFormat('sarif')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition ${
              activeFormat === 'sarif'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            OASIS SARIF (CI/CD & GitHub Security)
          </button>
          <button
            onClick={() => setActiveFormat('markdown')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition ${
              activeFormat === 'markdown'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Markdown Summary Report
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>
              {activeFormat === 'sarif'
                ? 'Standard SARIF JSON format supported by GitHub Advanced Security & VS Code'
                : 'Ready for GitHub Pull Request description or Issue ticket'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
            <pre className="whitespace-pre-wrap">{activeContent}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
