import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Server,
  Layers,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  Flame,
  Award,
} from 'lucide-react';
import { ComprehensiveAuditResult, RepoMetadata } from '../types/audit';

interface ExecutiveSummaryTabProps {
  audit: ComprehensiveAuditResult;
  metadata: RepoMetadata | null;
  onNavigateTab: (tab: 'archify' | 'features' | 'findings' | 'recommendations' | 'deepdive') => void;
  onFilterSeverity?: (severity: string) => void;
}

export const ExecutiveSummaryTab: React.FC<ExecutiveSummaryTabProps> = ({
  audit,
  metadata,
  onNavigateTab,
  onFilterSeverity,
}) => {
  const { executiveSummary, findings, featuresAndFunctionality } = audit;
  const grade = executiveSummary.grade;

  const criticalCount = findings.filter((f) => f.severity === 'Critical').length;
  const highCount = findings.filter((f) => f.severity === 'High').length;
  const mediumCount = findings.filter((f) => f.severity === 'Medium').length;
  const lowCount = findings.filter((f) => f.severity === 'Low').length;

  const gradeColor =
    grade === 'A+' || grade === 'A'
      ? { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' }
      : grade === 'B'
      ? { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' }
      : grade === 'C'
      ? { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' }
      : { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', glow: 'shadow-rose-500/20' };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Banner: DevSecOps Health Score & Grade */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Grade Card */}
        <div className={`p-6 rounded-2xl border ${gradeColor.border} ${gradeColor.bg} flex flex-col justify-between shadow-xl ${gradeColor.glow} backdrop-blur-sm relative overflow-hidden`}>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Security Posture Grade
              </span>
              <Award className={`w-5 h-5 ${gradeColor.text}`} />
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className={`text-6xl font-black tracking-tight ${gradeColor.text}`}>
                {grade}
              </span>
              <div>
                <span className="text-xl font-bold text-white">
                  {executiveSummary.healthScore}
                </span>
                <span className="text-xs text-slate-400"> / 100 Score</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Risk Assessment:</span>
              <span className={`font-bold ${gradeColor.text}`}>
                {executiveSummary.riskLevel} Risk
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-950/80 rounded-full h-2 mt-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  executiveSummary.healthScore >= 75
                    ? 'bg-emerald-500'
                    : executiveSummary.healthScore >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.max(8, executiveSummary.healthScore)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Architecture & Tech Stack Card */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between shadow-lg lg:col-span-2">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  Architectural Blueprint
                </h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                {executiveSummary.architectureType}
              </span>
            </div>

            <h2 className="text-lg font-bold text-white mt-2">
              {executiveSummary.appName}
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {executiveSummary.summaryDescription}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 mr-1">Detected Stack:</span>
              {executiveSummary.primaryTechStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 text-[11px] rounded bg-slate-800 text-slate-200 border border-slate-700/60 font-mono"
                >
                  {tech}
                </span>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('features')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition"
            >
              Explore {featuresAndFunctionality.coreFeatures.length} Features <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Featured Archify Visual Workspace Callout */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-blue-950/60 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Archify Interactive Visual Dashboard
              </h4>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Interactive
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Inspect module topology, file risk matrix, and download auto-remediated repository archives.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('archify')}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-md shadow-indigo-500/20"
        >
          <span>Open Archify Visual</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Findings Breakdown Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => {
            onFilterSeverity?.('Critical');
            onNavigateTab('findings');
          }}
          className="p-4 bg-slate-900/50 hover:bg-rose-950/20 border border-rose-500/25 hover:border-rose-500/50 rounded-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400">Critical</span>
            <Flame className="w-4 h-4 text-rose-500 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{criticalCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Immediate exploits & leaks</p>
        </div>

        <div
          onClick={() => {
            onFilterSeverity?.('High');
            onNavigateTab('findings');
          }}
          className="p-4 bg-slate-900/50 hover:bg-amber-950/20 border border-amber-500/25 hover:border-amber-500/50 rounded-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400">High</span>
            <AlertTriangle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{highCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Security flaws & CORS</p>
        </div>

        <div
          onClick={() => {
            onFilterSeverity?.('Medium');
            onNavigateTab('findings');
          }}
          className="p-4 bg-slate-900/50 hover:bg-blue-950/20 border border-blue-500/25 hover:border-blue-500/50 rounded-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-400">Medium</span>
            <ShieldAlert className="w-4 h-4 text-blue-500 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{mediumCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Infra & Docker permissions</p>
        </div>

        <div
          onClick={() => {
            onFilterSeverity?.('Low');
            onNavigateTab('findings');
          }}
          className="p-4 bg-slate-900/50 hover:bg-slate-800/40 border border-slate-700/40 hover:border-slate-600 rounded-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Low / Info</span>
            <Info className="w-4 h-4 text-slate-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-white mt-1">{lowCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Code smells & pinning</p>
        </div>
      </div>

      {/* Executive Verdict Callout */}
      <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
          <Layers className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider">
            Auditor Executive Verdict
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {executiveSummary.verdict}
          </p>
        </div>
      </div>

      {/* Action Plan Quick Preview */}
      {audit.actionPlan && audit.actionPlan.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Immediate Remediation Milestone
            </h3>
            <button
              onClick={() => onNavigateTab('recommendations')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition"
            >
              Full Roadmap <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-white">{audit.actionPlan[0].phase}</span>
              <span className="text-[11px] text-amber-400 font-mono bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                {audit.actionPlan[0].timeframe}
              </span>
            </div>
            <ul className="space-y-1.5">
              {audit.actionPlan[0].items.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
