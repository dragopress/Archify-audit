import React, { useState } from 'react';
import {
  ShieldAlert,
  Flame,
  AlertTriangle,
  Info,
  CheckCircle2,
  Copy,
  Check,
  Search,
  ExternalLink,
  MessageSquareQuote,
  Eye,
  EyeOff,
  GitCompare,
  FileCode,
  Tag,
  Filter,
} from 'lucide-react';
import { Finding, FindingCategory, Severity } from '../types/audit';

interface FindingsTabProps {
  findings: Finding[];
  onSelectFileAndLine: (filePath: string, line?: number) => void;
  onAskAiAboutFinding: (finding: Finding) => void;
  initialSeverityFilter?: string;
}

export const FindingsTab: React.FC<FindingsTabProps> = ({
  findings,
  onSelectFileAndLine,
  onAskAiAboutFinding,
  initialSeverityFilter = 'All',
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>(initialSeverityFilter);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleReviewed = (id: string) => {
    setReviewedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleIgnored = (id: string) => {
    setIgnoredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories: FindingCategory[] = [
    'Security Flaw (SAST)',
    'Infrastructure & Docker',
    'Secret / Credential Leak',
    'Dependency (SCA)',
    'Code Quality & Logic',
    'CI/CD & Cloud',
  ];

  const filteredFindings = findings.filter((f) => {
    if (severityFilter !== 'All' && f.severity !== severityFilter) return false;
    if (categoryFilter !== 'All' && f.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        f.title.toLowerCase().includes(q) ||
        f.file.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.cwe && f.cwe.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Flame className="w-3 h-3 fill-rose-500/50" /> Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <ShieldAlert className="w-3 h-3" /> Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <Info className="w-3 h-3" /> {severity}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Search & Filter Bar */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, file, or CWE..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Counts */}
          <div className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-white">{filteredFindings.length}</strong> of{' '}
            <strong className="text-white">{findings.length}</strong> findings
          </div>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/60 text-xs">
          <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Severity:
          </span>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((sev) => {
            const count =
              sev === 'All' ? findings.length : findings.filter((f) => f.severity === sev).length;
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  severityFilter === sev
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {sev} ({count})
              </button>
            );
          })}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Category:
          </span>
          <button
            onClick={() => setCategoryFilter('All')}
            className={`px-2 py-0.5 rounded text-[11px] transition ${
              categoryFilter === 'All'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2 py-0.5 rounded text-[11px] transition ${
                categoryFilter === cat
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/20 border border-slate-800 rounded-2xl text-slate-400 text-xs">
            No findings match your selected filters.
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const isReviewed = reviewedIds.has(finding.id);
            const isIgnored = ignoredIds.has(finding.id);

            return (
              <div
                key={finding.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isIgnored
                    ? 'opacity-40 bg-slate-950/40 border-slate-900'
                    : isReviewed
                    ? 'bg-slate-900/40 border-emerald-500/30 shadow-md'
                    : finding.severity === 'Critical'
                    ? 'bg-slate-900/80 border-rose-500/30 hover:border-rose-500/50 shadow-lg shadow-rose-950/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-md'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getSeverityBadge(finding.severity)}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                      {finding.category}
                    </span>
                    {finding.cwe && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {finding.cwe}
                      </span>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => onAskAiAboutFinding(finding)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 transition"
                      title="Ask AI Architect how to patch or refactor this"
                    >
                      <MessageSquareQuote className="w-3 h-3" />
                      <span>Ask AI Architect</span>
                    </button>

                    <button
                      onClick={() => toggleReviewed(finding.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition border ${
                        isReviewed
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isReviewed ? 'Reviewed' : 'Mark Reviewed'}</span>
                    </button>

                    <button
                      onClick={() => toggleIgnored(finding.id)}
                      className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition"
                      title={isIgnored ? 'Restore finding' : 'Ignore as False Positive'}
                    >
                      {isIgnored ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-white mt-2">
                  {finding.title}
                </h3>

                {/* File Location Button */}
                <div className="mt-1.5">
                  <button
                    onClick={() => onSelectFileAndLine(finding.file, finding.line)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:underline transition"
                  >
                    <FileCode className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {finding.file}
                      {finding.line ? `:${finding.line}` : ''}
                    </span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </button>
                </div>

                {/* Description & Impact */}
                <div className="mt-3 space-y-2 text-xs">
                  <p className="text-slate-300 leading-relaxed">{finding.description}</p>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                      Security & Architectural Impact:
                    </span>
                    <p className="text-slate-300 text-xs mt-0.5">{finding.impact}</p>
                  </div>
                </div>

                {/* Remediation & Code Diff */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-3">
                  <div className="text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Remediation Recommendation:
                    </span>
                    <p className="text-slate-300 mt-0.5">{finding.recommendation}</p>
                  </div>

                  {/* Side-by-Side Diff */}
                  {finding.originalCode && finding.fixedCode && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                      {/* Original */}
                      <div className="bg-rose-950/20 border border-rose-500/25 rounded-xl p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1.5">
                          - Vulnerable Code
                        </div>
                        <pre className="text-rose-200 font-mono text-[11px] whitespace-pre-wrap break-all overflow-x-auto bg-slate-950/60 p-2 rounded">
                          {finding.originalCode}
                        </pre>
                      </div>

                      {/* Remediated Fix */}
                      <div className="bg-emerald-950/20 border border-emerald-500/25 rounded-xl p-3">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
                          <span>+ Remediated Fix</span>
                          <button
                            onClick={() => handleCopy(finding.id, finding.fixedCode)}
                            className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 transition font-sans font-medium"
                          >
                            {copiedId === finding.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Fix</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="text-emerald-200 font-mono text-[11px] whitespace-pre-wrap break-all overflow-x-auto bg-slate-950/60 p-2 rounded">
                          {finding.fixedCode}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
