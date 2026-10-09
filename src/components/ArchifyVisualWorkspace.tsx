import React, { useState, useMemo } from 'react';
import {
  Layers,
  Network,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FolderArchive,
  Download,
  FileCode,
  Box,
  Server,
  Database,
  Lock,
  Cpu,
  ArrowRight,
  Eye,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Flame,
  Check,
  RefreshCw,
  Search,
} from 'lucide-react';
import JSZip from 'jszip';
import {
  ComprehensiveAuditResult,
  Finding,
  IngestedFile,
  RepoMetadata,
} from '../types/audit';

interface ArchifyVisualWorkspaceProps {
  auditResult: ComprehensiveAuditResult;
  files: IngestedFile[];
  repoMetadata: RepoMetadata | null;
  onSelectFileAndLine: (filePath: string, line?: number) => void;
  onAskAiAboutFinding: (finding: Finding) => void;
}

export const ArchifyVisualWorkspace: React.FC<ArchifyVisualWorkspaceProps> = ({
  auditResult,
  files,
  repoMetadata,
  onSelectFileAndLine,
  onAskAiAboutFinding,
}) => {
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [activeFileDetails, setActiveFileDetails] = useState<IngestedFile | null>(
    files[0] || null
  );
  const [isExportingCleanZip, setIsExportingCleanZip] = useState(false);
  const [cleanZipReady, setCleanZipReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { executiveSummary, findings, featuresAndFunctionality } = auditResult;

  // Map findings by file
  const findingsByFile = useMemo(() => {
    const map = new Map<string, Finding[]>();
    for (const f of findings) {
      const list = map.get(f.file) || [];
      list.push(f);
      map.set(f.file, list);
    }
    return map;
  }, [findings]);

  // Categorize files into architectural tiers
  const fileTiers = useMemo(() => {
    return files.map((file) => {
      const lower = file.path.toLowerCase();
      let layer = 'Core Logic';
      let icon = <FileCode className="w-3.5 h-3.5" />;

      if (lower.includes('docker') || lower.includes('compose') || lower.includes('.env') || lower.includes('yaml') || lower.includes('yml')) {
        layer = 'Infrastructure & DevOps';
        icon = <Box className="w-3.5 h-3.5 text-cyan-400" />;
      } else if (lower.includes('auth') || lower.includes('login') || lower.includes('jwt') || lower.includes('session') || lower.includes('token')) {
        layer = 'Authentication & Security';
        icon = <Lock className="w-3.5 h-3.5 text-indigo-400" />;
      } else if (lower.includes('db') || lower.includes('database') || lower.includes('model') || lower.includes('schema') || lower.includes('sql') || lower.includes('repo')) {
        layer = 'Data & Storage';
        icon = <Database className="w-3.5 h-3.5 text-emerald-400" />;
      } else if (lower.includes('route') || lower.includes('controller') || lower.includes('server') || lower.includes('app') || lower.includes('main') || lower.includes('api')) {
        layer = 'API & Gateway';
        icon = <Server className="w-3.5 h-3.5 text-blue-400" />;
      }

      const fileIssues = findingsByFile.get(file.path) || [];
      const criticalCount = fileIssues.filter((i) => i.severity === 'Critical').length;
      const highCount = fileIssues.filter((i) => i.severity === 'High').length;
      const mediumCount = fileIssues.filter((i) => i.severity === 'Medium').length;
      const lowCount = fileIssues.filter((i) => i.severity === 'Low').length;

      let riskStatus: 'critical' | 'high' | 'medium' | 'clean' = 'clean';
      if (criticalCount > 0) riskStatus = 'critical';
      else if (highCount > 0) riskStatus = 'high';
      else if (mediumCount > 0 || lowCount > 0) riskStatus = 'medium';

      return {
        ...file,
        layer,
        icon,
        issues: fileIssues,
        criticalCount,
        highCount,
        mediumCount,
        riskStatus,
        lineCount: file.content.split('\n').length,
      };
    });
  }, [files, findingsByFile]);

  // Filtered files
  const filteredTiers = useMemo(() => {
    return fileTiers.filter((item) => {
      if (selectedLayer !== 'all' && item.layer !== selectedLayer) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.path.toLowerCase().includes(q);
      }
      return true;
    });
  }, [fileTiers, selectedLayer, searchQuery]);

  // Statistics
  const totalFiles = files.length;
  const criticalFiles = fileTiers.filter((f) => f.riskStatus === 'critical').length;
  const highFiles = fileTiers.filter((f) => f.riskStatus === 'high').length;
  const cleanFiles = fileTiers.filter((f) => f.riskStatus === 'clean').length;
  const cleanPercent = Math.round((cleanFiles / Math.max(1, totalFiles)) * 100);

  // Download Remediated Clean Bundle
  const handleDownloadRemediatedZip = async () => {
    setIsExportingCleanZip(true);
    try {
      const zip = new JSZip();

      // Write each file, applying fixedCode replacements if available
      for (const f of files) {
        let content = f.content;
        const fileIssues = findingsByFile.get(f.path) || [];

        // Apply fixes sequentially
        for (const issue of fileIssues) {
          if (issue.originalCode && issue.fixedCode && content.includes(issue.originalCode)) {
            content = content.replace(issue.originalCode, issue.fixedCode);
          }
        }

        zip.file(f.path, content);
      }

      // Add Archify Audit Summary
      zip.file(
        'ARCHIFY-AUDIT-REPORT.md',
        `# Archify Remediated Archive Snapshot\n\n- Repository: ${repoMetadata?.fullName || 'Repo'}\n- Health Score: ${executiveSummary.healthScore}/100\n- Total Findings Remediated: ${findings.length}\n\nGenerated by Archify CodeAudit on ${new Date().toISOString()}`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `archify-remediated-${repoMetadata?.name || 'repo'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setCleanZipReady(true);
      setTimeout(() => setCleanZipReady(false), 3000);
    } catch (e) {
      console.error('Error generating clean archive:', e);
    } finally {
      setIsExportingCleanZip(false);
    }
  };

  const layersList = [
    { id: 'all', name: 'All Modules' },
    { id: 'API & Gateway', name: 'API & Gateway' },
    { id: 'Authentication & Security', name: 'Auth & Security' },
    { id: 'Data & Storage', name: 'Data & Storage' },
    { id: 'Infrastructure & DevOps', name: 'Infra & Docker' },
    { id: 'Core Logic', name: 'Core Logic' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Banner: Archify Visual Control Center */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Interactive Archify Visual
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {repoMetadata?.fullName || 'Active Codebase'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Repository Topology & Code Health Visualizer
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Explore your codebase architecture across tiers, inspect file risk heatmaps,
              track security coverage, and export a remediated, auto-patched repository snapshot.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDownloadRemediatedZip}
              disabled={isExportingCleanZip}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30 disabled:opacity-50"
            >
              {isExportingCleanZip ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Packaging Remediated ZIP...</span>
                </>
              ) : cleanZipReady ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Archive Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Remediated Archive</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Health Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400">Total Files Ingested</p>
              <p className="text-lg font-bold text-white mt-0.5">{totalFiles}</p>
            </div>
            <FolderArchive className="w-5 h-5 text-blue-400" />
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400">Clean Files</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">
                {cleanFiles}{' '}
                <span className="text-[11px] text-slate-500 font-normal">
                  ({cleanPercent}%)
                </span>
              </p>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400">Critical Risk Files</p>
              <p className="text-lg font-bold text-rose-400 mt-0.5">{criticalFiles}</p>
            </div>
            <Flame className="w-5 h-5 text-rose-500" />
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400">Remediations Available</p>
              <p className="text-lg font-bold text-indigo-400 mt-0.5">
                {findings.length}
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Layer Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          {layersList.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setSelectedLayer(layer.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedLayer === layer.id
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {layer.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search archived files..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Two Column Layout: Visual File Matrix & Selected File Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive File Treemap / Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>
                Archify Code Matrix ({filteredTiers.length} files displayed)
              </span>
            </h2>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Warning
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Clean
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredTiers.map((file) => {
              const isSelected = activeFileDetails?.path === file.path;

              const borderClass =
                file.riskStatus === 'critical'
                  ? 'border-rose-500/40 bg-rose-950/20 hover:border-rose-500/70'
                  : file.riskStatus === 'high' || file.riskStatus === 'medium'
                  ? 'border-amber-500/40 bg-amber-950/20 hover:border-amber-500/70'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700';

              const badgeColor =
                file.riskStatus === 'critical'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : file.riskStatus === 'high' || file.riskStatus === 'medium'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

              return (
                <div
                  key={file.path}
                  onClick={() => setActiveFileDetails(file)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group shadow-sm ${borderClass} ${
                    isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950' : ''
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {file.icon}
                        <span className="font-mono text-xs font-bold text-white truncate group-hover:text-blue-300 transition">
                          {file.path.split('/').pop()}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold border shrink-0 ${badgeColor}`}
                      >
                        {file.issues.length > 0 ? `${file.issues.length} flaw(s)` : 'Clean'}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 font-mono truncate">
                      {file.path}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 font-mono">
                      {file.lineCount} lines
                    </span>
                    <span className="text-slate-500 font-sans">{file.layer}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Topology Flow Visualization */}
          <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Network className="w-4 h-4 text-emerald-400" />
                <span>Architecture Topology & Threat Vectors</span>
              </h3>
              <span className="text-[11px] text-slate-500">Live Ingestion Model</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
              <div className="p-3 bg-slate-950 rounded-xl border border-blue-500/30 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-blue-400 tracking-wider">
                  Tier 1: Gateway / Ingress
                </span>
                <p className="text-xs font-bold text-white">HTTP & API Router</p>
                <p className="text-[10px] text-slate-400">CORS policies, Route Handlers</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-indigo-500/30 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">
                  Tier 2: Authentication
                </span>
                <p className="text-xs font-bold text-white">Token & Session Auth</p>
                <p className="text-[10px] text-slate-400">JWT Secret Vaults, RBAC</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/30 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                  Tier 3: Persistence
                </span>
                <p className="text-xs font-bold text-white">Database & Queries</p>
                <p className="text-[10px] text-slate-400">Parameterized Statements</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-cyan-500/30 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider">
                  Tier 4: Packaging
                </span>
                <p className="text-xs font-bold text-white">Docker & Runtime</p>
                <p className="text-[10px] text-slate-400">Non-root User & Pinning</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Selected File Inspector Drawer */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-400" />
            <span>Archify Node Inspector</span>
          </h2>

          {activeFileDetails ? (
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
              {/* Header */}
              <div className="space-y-1 border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white truncate max-w-xs">
                    {activeFileDetails.path}
                  </span>
                  <button
                    onClick={() => onSelectFileAndLine(activeFileDetails.path)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    <span>Open Code</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  {activeFileDetails.content.split('\n').length} lines •{' '}
                  {activeFileDetails.size
                    ? `${(activeFileDetails.size / 1024).toFixed(1)} KB`
                    : 'text'}
                </p>
              </div>

              {/* Findings inside this file */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Detected Findings in File ({findingsByFile.get(activeFileDetails.path)?.length || 0})
                </span>

                {(findingsByFile.get(activeFileDetails.path) || []).length === 0 ? (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-center space-y-1">
                    <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto" />
                    <p className="text-xs font-bold text-emerald-300">Clean Code Node</p>
                    <p className="text-[11px] text-slate-400">
                      No security flaws or misconfigurations detected in this file.
                    </p>
                  </div>
                ) : (
                  (findingsByFile.get(activeFileDetails.path) || []).map((finding) => (
                    <div
                      key={finding.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white line-clamp-1">
                          {finding.title}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                            finding.severity === 'Critical'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {finding.severity}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {finding.description}
                      </p>

                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px]">
                        <button
                          onClick={() => onSelectFileAndLine(finding.file, finding.line)}
                          className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[10px]"
                        >
                          Line {finding.line || '?'} Diff
                        </button>
                        <button
                          onClick={() => onAskAiAboutFinding(finding)}
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Ask AI Fix</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Code Snippet Preview */}
              <div className="space-y-1 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Archived Content Preview:
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {activeFileDetails.content.slice(0, 800)}
                  {activeFileDetails.content.length > 800 ? '\n\n/* ... additional lines ... */' : ''}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
              Click any file block to inspect its architecture status and line diffs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
