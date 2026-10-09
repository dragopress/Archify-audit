import React, { useState } from 'react';
import {
  Copy,
  Check,
  FileCode,
  ShieldAlert,
  GitCompare,
  Code,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { IngestedFile, Finding } from '../types/audit';

interface CodeViewerProps {
  file: IngestedFile | null;
  findings: Finding[];
  onSelectFinding?: (finding: Finding) => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  file,
  findings,
  onSelectFinding,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'source' | 'diff'>('source');

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-slate-500">
        <FileCode className="w-12 h-12 stroke-1 mb-3 text-slate-700" />
        <p className="text-sm font-medium text-slate-400">Select a file to review</p>
        <p className="text-xs text-slate-600 mt-1">
          Explore code, highlighted vulnerability lines, and unified diff fixes.
        </p>
      </div>
    );
  }

  const lines = file.content.split('\n');
  const fileFindings = findings.filter((f) => f.file === file.path);
  const lineFindingMap: Record<number, Finding> = {};
  fileFindings.forEach((f) => {
    if (f.line) lineFindingMap[f.line] = f;
  });

  const hasFixes = fileFindings.some((f) => f.fixedCode);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Code Header Bar */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="font-mono text-xs font-semibold text-slate-200 truncate">
            {file.path}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            ({lines.length} lines, {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'text'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasFixes && (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => setViewMode('source')}
                className={`px-2 py-1 rounded font-medium transition ${
                  viewMode === 'source'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Source
              </button>
              <button
                onClick={() => setViewMode('diff')}
                className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition ${
                  viewMode === 'diff'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitCompare className="w-3 h-3" />
                <span>Fix Diffs ({fileFindings.length})</span>
              </button>
            </div>
          )}

          <button
            onClick={() => handleCopy(file.content)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Body */}
      {viewMode === 'source' ? (
        <div className="flex-1 overflow-auto font-mono text-[11px] leading-5 p-2 bg-slate-950">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((lineContent, idx) => {
                const lineNum = idx + 1;
                const finding = lineFindingMap[lineNum];
                const isVuln = !!finding;

                const severityBg =
                  finding?.severity === 'Critical'
                    ? 'bg-rose-950/40 border-l-2 border-rose-500'
                    : finding?.severity === 'High'
                    ? 'bg-amber-950/40 border-l-2 border-amber-500'
                    : finding
                    ? 'bg-blue-950/40 border-l-2 border-blue-500'
                    : '';

                return (
                  <React.Fragment key={lineNum}>
                    <tr className={`hover:bg-slate-900/60 transition ${severityBg}`}>
                      {/* Gutter Line Number */}
                      <td className="w-12 text-right pr-3 select-none text-slate-600 text-[10px] font-mono align-top py-0.5">
                        {lineNum}
                      </td>

                      {/* Code Content */}
                      <td className="pr-4 py-0.5 text-slate-200 font-mono whitespace-pre break-all">
                        {lineContent || ' '}
                      </td>
                    </tr>

                    {/* Inlined Vulnerability Banner right beneath the affected line */}
                    {isVuln && (
                      <tr className="bg-slate-900/90 border-l-2 border-rose-500">
                        <td />
                        <td className="py-2 px-3">
                          <div className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-rose-400" />
                                <span className="font-bold text-white text-xs">
                                  {finding.title}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                                  {finding.severity}
                                </span>
                                {finding.cwe && (
                                  <span className="text-[10px] text-slate-400">
                                    {finding.cwe}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-300 leading-normal">
                                {finding.description}
                              </p>
                              {finding.fixedCode && (
                                <div className="mt-2 pt-2 border-t border-rose-500/20">
                                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                                    Recommended Fix:
                                  </span>
                                  <pre className="mt-1 p-2 bg-slate-950 rounded border border-emerald-500/30 text-emerald-300 font-mono text-[10px] whitespace-pre-wrap">
                                    {finding.fixedCode}
                                  </pre>
                                </div>
                              )}
                            </div>

                            {onSelectFinding && (
                              <button
                                onClick={() => onSelectFinding(finding)}
                                className="shrink-0 text-[10px] px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium transition"
                              >
                                View Finding
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Diff View */
        <div className="flex-1 overflow-auto p-4 space-y-6 bg-slate-950 font-mono text-xs">
          <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-xl text-blue-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>
                Generated Remediations for <strong>{file.path}</strong> ({fileFindings.length} issues)
              </span>
            </div>
            <button
              onClick={() => handleCopy(fileFindings.map(f => f.fixedCode).join('\n\n'))}
              className="text-xs px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
            >
              Copy All Fixes
            </button>
          </div>

          {fileFindings.map((finding) => (
            <div
              key={finding.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg"
            >
              <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{finding.title}</span>
                  <span className="text-[10px] text-slate-400">Line {finding.line || '?'}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {finding.severity}
                </span>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-xs text-slate-300 font-sans">{finding.recommendation}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  {/* Original */}
                  <div className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between text-rose-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                      <span>- Original Vulnerable Code</span>
                    </div>
                    <pre className="text-rose-200 font-mono whitespace-pre-wrap break-all overflow-x-auto">
                      {finding.originalCode}
                    </pre>
                  </div>

                  {/* Fixed */}
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                      <span>+ Remediated Fix</span>
                      <button
                        onClick={() => handleCopy(finding.fixedCode)}
                        className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-sans font-medium"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    <pre className="text-emerald-200 font-mono whitespace-pre-wrap break-all overflow-x-auto">
                      {finding.fixedCode}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
