import React, { useState } from 'react';
import {
  ShieldAlert,
  FileCode,
  Download,
  Share2,
  FolderGit2,
  Sparkles,
  ExternalLink,
  RotateCw,
  Star,
  GitFork,
  Code2,
  Github,
  LogOut,
  User,
  History,
} from 'lucide-react';
import { RepoMetadata, ComprehensiveAuditResult, GitHubUser } from '../types/audit';

interface HeaderProps {
  repoMetadata: RepoMetadata | null;
  auditResult: ComprehensiveAuditResult | null;
  onOpenIngest: (defaultTab?: 'github' | 'myrepos' | 'upload' | 'samples') => void;
  onOpenExport: () => void;
  isAuditing: boolean;
  onReaudit: () => void;
  gitHubUser: GitHubUser | null;
  isConnectingGitHub: boolean;
  onConnectGitHub: () => void;
  onDisconnectGitHub: () => void;
  historyCount?: number;
  onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  repoMetadata,
  auditResult,
  onOpenIngest,
  onOpenExport,
  isAuditing,
  onReaudit,
  gitHubUser,
  isConnectingGitHub,
  onConnectGitHub,
  onDisconnectGitHub,
  historyCount = 0,
  onOpenHistory,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const grade = auditResult?.executiveSummary.grade;
  const gradeColor =
    grade === 'A+' || grade === 'A'
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
      : grade === 'B'
      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
      : grade === 'C'
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      : 'bg-rose-500/20 text-rose-400 border-rose-500/40';

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return null;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand & Ingested Repo */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-base">Archify</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  CodeAudit
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xl:block">
                Comprehensive GitHub & Archive Reviewer
              </p>
            </div>
          </div>

          {/* Repo indicator with stars, forks, language */}
          {repoMetadata && (
            <div className="hidden md:flex items-center gap-2 pl-4 ml-2 border-l border-slate-800 text-xs min-w-0">
              <FolderGit2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-200 truncate max-w-[180px] lg:max-w-xs">
                {repoMetadata.fullName}
              </span>

              {repoMetadata.htmlUrl && (
                <a
                  href={repoMetadata.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
                  title="Open in GitHub"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {/* Primary Language */}
              {repoMetadata.language && (
                <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 font-mono text-[11px] shrink-0">
                  <Code2 className="w-3 h-3 text-cyan-400" />
                  <span>{repoMetadata.language}</span>
                </span>
              )}

              {/* Stars Count */}
              {repoMetadata.stars !== undefined && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 text-amber-300 border border-slate-700/60 text-[11px] shrink-0"
                  title={`${repoMetadata.stars.toLocaleString()} Stars on GitHub`}
                >
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400/40" />
                  <span className="font-semibold font-mono">{formatNumber(repoMetadata.stars)}</span>
                </span>
              )}

              {/* Forks Count */}
              {repoMetadata.forks !== undefined && (
                <span
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 text-[11px] shrink-0"
                  title={`${repoMetadata.forks.toLocaleString()} Forks on GitHub`}
                >
                  <GitFork className="w-3 h-3 text-slate-400" />
                  <span className="font-semibold font-mono">{formatNumber(repoMetadata.forks)}</span>
                </span>
              )}

              {/* Grade */}
              {grade && (
                <span
                  className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full border shrink-0 ${gradeColor}`}
                >
                  Grade {grade}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions & GitHub Profile */}
        <div className="flex items-center gap-2">
          {/* GitHub User Profile / Login Button */}
          {gitHubUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition"
              >
                <img
                  src={gitHubUser.avatar_url}
                  alt={gitHubUser.login}
                  className="w-5 h-5 rounded-full border border-slate-600"
                />
                <span className="font-semibold hidden sm:inline max-w-[100px] truncate">
                  {gitHubUser.login}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 text-xs space-y-1">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="font-bold text-white truncate">{gitHubUser.name || gitHubUser.login}</p>
                    <p className="text-slate-400 text-[11px] font-mono truncate">@{gitHubUser.login}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenIngest('myrepos');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition"
                  >
                    <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Select from My Repos</span>
                  </button>

                  <a
                    href={gitHubUser.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span>View GitHub Profile</span>
                  </a>

                  <div className="pt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onDisconnectGitHub();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Disconnect GitHub</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onConnectGitHub}
              disabled={isConnectingGitHub}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#24292e] hover:bg-[#1b1f23] border border-slate-700 hover:border-slate-600 transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Sign in with normal GitHub OAuth to access your repositories"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isConnectingGitHub ? 'Signing in...' : 'Sign in with GitHub'}
              </span>
            </button>
          )}

          {auditResult && (
            <>
              <button
                onClick={onReaudit}
                disabled={isAuditing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition disabled:opacity-50"
                title="Re-run AI & SAST review"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin text-blue-400' : ''}`} />
                <span className="hidden sm:inline">{isAuditing ? 'Auditing...' : 'Re-Audit'}</span>
              </button>

              <button
                onClick={onOpenExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Export (SARIF)</span>
              </button>
            </>
          )}

          <button
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition"
            title="Switch between previous scans"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onOpenIngest()}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition shadow-sm shadow-blue-500/25 ring-1 ring-blue-400/30"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Open Repo / Archive</span>
          </button>
        </div>
      </div>
    </header>
  );
};

