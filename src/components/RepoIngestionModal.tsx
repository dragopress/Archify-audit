import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Github,
  UploadCloud,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FolderArchive,
  Star,
  GitBranch,
  ShieldCheck,
  Code2,
  Lock,
  Unlock,
  GitFork,
  Search,
  RotateCw,
  LogOut,
  Key,
  ExternalLink,
  FolderGit2,
  History,
  Copy,
  Check,
} from 'lucide-react';
import JSZip from 'jszip';
import { SAMPLE_REPOS, SampleRepo } from '../data/sampleRepos';
import {
  IngestedFile,
  RepoMetadata,
  ComprehensiveAuditResult,
  GitHubUser,
  GitHubUserRepo,
  ScanHistoryItem,
} from '../types/audit';

interface RepoIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleRepo) => void;
  onIngestGithub: (
    repoUrl: string,
    branch: string,
    userFocus: string,
    token?: string
  ) => Promise<void>;
  onIngestZip: (
    metadata: RepoMetadata,
    files: IngestedFile[],
    userFocus: string
  ) => Promise<void>;
  isLoading: boolean;
  defaultTab?: 'github' | 'myrepos' | 'upload' | 'samples' | 'history';
  gitHubUser: GitHubUser | null;
  gitHubRepos: GitHubUserRepo[];
  isLoadingRepos: boolean;
  isConnectingGitHub: boolean;
  onConnectOAuth: (mode?: 'default' | 'omit' | 'dev' | 'shared') => Promise<void>;
  onConnectToken: (token: string) => Promise<any>;
  onDisconnectGitHub: () => void;
  onRefreshRepos: () => void;
  oauthConfig: {
    configured: boolean;
    redirectUri: string;
    appUrl: string;
    url?: string;
    devCallback?: string;
    sharedCallback?: string;
  } | null;
  history?: ScanHistoryItem[];
  onSelectScan?: (item: ScanHistoryItem) => void;
}

export const RepoIngestionModal: React.FC<RepoIngestionModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
  onIngestGithub,
  onIngestZip,
  isLoading,
  defaultTab = 'github',
  gitHubUser,
  gitHubRepos,
  isLoadingRepos,
  isConnectingGitHub,
  onConnectOAuth,
  onConnectToken,
  onDisconnectGitHub,
  onRefreshRepos,
  oauthConfig,
  history = [],
  onSelectScan,
}) => {
  const [activeTab, setActiveTab] = useState<'github' | 'myrepos' | 'upload' | 'samples' | 'history'>(defaultTab);
  const [repoInput, setRepoInput] = useState('');
  const [branchInput, setBranchInput] = useState('main');
  const [userFocus, setUserFocus] = useState(
    'Full 360-degree review of functionality, features, security, infrastructure misconfigurations, code quality, and actionable fixes.'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [unpackingProgress, setUnpackingProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // My Repos tab states
  const [repoSearch, setRepoSearch] = useState('');
  const [repoFilterType, setRepoFilterType] = useState<'all' | 'public' | 'private' | 'sources'>('all');
  const [patInput, setPatInput] = useState('');
  const [isSubmittingPat, setIsSubmittingPat] = useState(false);
  const [showPatInput, setShowPatInput] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [showOAuthTroubleshooter, setShowOAuthTroubleshooter] = useState(false);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, isOpen]);

  if (!isOpen) return null;

  const handleGithubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) {
      setErrorMessage('Please enter a GitHub repository URL or owner/repo slug.');
      return;
    }
    setErrorMessage(null);
    try {
      await onIngestGithub(repoInput.trim(), branchInput.trim(), userFocus);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch repository.');
    }
  };

  const handleSelectUserRepo = async (repo: GitHubUserRepo) => {
    setErrorMessage(null);
    try {
      await onIngestGithub(repo.full_name, repo.default_branch || 'main', userFocus);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to fetch ${repo.full_name}.`);
    }
  };

  const handlePatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patInput.trim()) return;
    setIsSubmittingPat(true);
    setErrorMessage(null);
    try {
      await onConnectToken(patInput.trim());
      setPatInput('');
      setShowPatInput(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate with provided token.');
    } finally {
      setIsSubmittingPat(false);
    }
  };

  const handleZipFile = async (file: File) => {
    setErrorMessage(null);
    setUnpackingProgress(`Extracting and reading ${file.name}...`);
    try {
      const zip = await JSZip.loadAsync(file);
      const extractedFiles: IngestedFile[] = [];
      const entries = Object.keys(zip.files);

      const ignoredExts = [
        '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.pdf',
        '.zip', '.tar', '.gz', '.woff', '.woff2', '.exe',
      ];
      const ignoredFolders = ['node_modules/', '.git/', 'dist/', 'build/', '.next/', '.cache/'];

      for (const relativePath of entries) {
        const zipEntry = zip.files[relativePath];
        if (zipEntry.dir) continue;

        const lower = relativePath.toLowerCase();
        if (ignoredFolders.some((f) => lower.includes(f))) continue;
        if (ignoredExts.some((ext) => lower.endsWith(ext))) continue;

        const cleanPath = relativePath.replace(/^[^/]+\//, '');
        if (!cleanPath) continue;

        const content = await zipEntry.async('string');
        extractedFiles.push({
          path: cleanPath,
          content: content.length > 50000 ? content.slice(0, 50000) + '\n/* ... truncated ... */' : content,
          size: content.length,
        });

        if (extractedFiles.length >= 40) break;
      }

      if (extractedFiles.length === 0) {
        throw new Error('No readable source code or configuration files found in archive.');
      }

      const repoName = file.name.replace(/\.zip$/i, '');
      const metadata: RepoMetadata = {
        name: repoName,
        fullName: `archive/${repoName}`,
        description: `Imported local archive (${file.name})`,
        language: 'Multi-language',
        totalFileCount: entries.length,
        scannedFileCount: extractedFiles.length,
      };

      setUnpackingProgress(null);
      await onIngestZip(metadata, extractedFiles, userFocus);
      onClose();
    } catch (err: any) {
      setUnpackingProgress(null);
      setErrorMessage(err.message || 'Failed to unpack ZIP archive.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleZipFile(e.dataTransfer.files[0]);
    }
  };

  const focusPresets = [
    {
      label: 'Full 360° Review',
      value: 'Full 360-degree review of functionality, features, security, infrastructure misconfigurations, code quality, and actionable fixes.',
    },
    {
      label: 'Security & OWASP Focus',
      value: 'Deep dive on OWASP Top 10, CWE security vulnerabilities, hardcoded secrets, injection, authentication flaws, and privilege escalation.',
    },
    {
      label: 'Docker & DevOps Hardening',
      value: 'Audit Dockerfiles, container configurations, CI/CD pipelines, root permissions, base images, and cloud deployment security.',
    },
    {
      label: 'Code Quality & Refactoring',
      value: 'Identify code smells, performance bottlenecks, unhandled errors, architectural anti-patterns, and modern best practice refactoring.',
    },
  ];

  // Filter user repos
  const filteredUserRepos = gitHubRepos.filter((repo) => {
    if (repoFilterType === 'public' && repo.private) return false;
    if (repoFilterType === 'private' && !repo.private) return false;
    if (repoFilterType === 'sources' && repo.fork) return false;

    if (repoSearch.trim()) {
      const q = repoSearch.toLowerCase();
      const match =
        repo.name.toLowerCase().includes(q) ||
        (repo.description && repo.description.toLowerCase().includes(q)) ||
        (repo.language && repo.language.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Ingest Repository for Review</h2>
              <p className="text-xs text-slate-400">
                Connect GitHub, select from your repositories, or upload an archive
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

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2 gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition shrink-0 ${
              activeTab === 'github'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            Public GitHub URL
          </button>

          <button
            onClick={() => setActiveTab('myrepos')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition shrink-0 ${
              activeTab === 'myrepos'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>My GitHub Repos</span>
            {gitHubUser && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition shrink-0 ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload ZIP / Archive
          </button>

          <button
            onClick={() => setActiveTab('samples')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition shrink-0 ${
              activeTab === 'samples'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Featured Repos ({SAMPLE_REPOS.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition shrink-0 ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>Recent Scans ({history.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {unpackingProgress && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 text-xs flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>{unpackingProgress}</span>
            </div>
          )}

          {/* TAB 1: Public GitHub URL */}
          {activeTab === 'github' && (
            <form onSubmit={handleGithubSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  GitHub Repository
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Github className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    placeholder="e.g. expressjs/express or https://github.com/pallets/flask"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Works with any public repository or open-source project.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Branch / Ref
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <GitBranch className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={branchInput}
                      onChange={(e) => setBranchInput(e.target.value)}
                      placeholder="main"
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Audit Preset
                  </label>
                  <select
                    value={userFocus}
                    onChange={(e) => setUserFocus(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {focusPresets.map((preset) => (
                      <option key={preset.label} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition disabled:opacity-50 shadow-md shadow-blue-500/25"
                >
                  {isLoading ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Ingesting & Auditing Repository...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Start Comprehensive Code Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: My GitHub Repos (Logged-in view & Login trigger) */}
          {activeTab === 'myrepos' && (
            <div className="space-y-4">
              {gitHubUser ? (
                /* Authenticated State */
                <div className="space-y-4">
                  {/* User Profile Bar */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={gitHubUser.avatar_url}
                        alt={gitHubUser.login}
                        className="w-10 h-10 rounded-full border border-slate-700 shadow-md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">
                            {gitHubUser.name || gitHubUser.login}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            @{gitHubUser.login}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {gitHubRepos.length} repositories loaded • {gitHubUser.public_repos} public
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={onRefreshRepos}
                        disabled={isLoadingRepos}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
                        title="Refresh repositories"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isLoadingRepos ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={onDisconnectGitHub}
                        className="px-2.5 py-1 text-[11px] rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition flex items-center gap-1"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={repoSearch}
                        onChange={(e) => setRepoSearch(e.target.value)}
                        placeholder="Filter my repositories..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-[11px] self-start sm:self-auto">
                      {(['all', 'public', 'private', 'sources'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setRepoFilterType(filter)}
                          className={`px-2.5 py-1 rounded-md capitalize transition ${
                            repoFilterType === filter
                              ? 'bg-blue-600 text-white font-medium'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Repositories List */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-850 max-h-72 overflow-y-auto bg-slate-950/60">
                    {isLoadingRepos ? (
                      <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 animate-spin text-blue-400" />
                        <span>Loading your GitHub repositories...</span>
                      </div>
                    ) : filteredUserRepos.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        No repositories found matching your filter.
                      </div>
                    ) : (
                      filteredUserRepos.map((repo) => (
                        <div
                          key={repo.id}
                          className="p-3.5 hover:bg-slate-900/80 transition flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-white group-hover:text-blue-400 transition truncate">
                                {repo.name}
                              </span>
                              {repo.private ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  <Lock className="w-2.5 h-2.5" /> Private
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                  <Unlock className="w-2.5 h-2.5" /> Public
                                </span>
                              )}
                              {repo.language && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {repo.language}
                                </span>
                              )}
                            </div>

                            {repo.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                {repo.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400/30" />
                                {repo.stargazers_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <GitFork className="w-3 h-3" />
                                {repo.forks_count}
                              </span>
                              <span>
                                Updated {new Date(repo.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleSelectUserRepo(repo)}
                            disabled={isLoading}
                            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition disabled:opacity-50 shadow-sm"
                          >
                            <span>Audit Repo</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Unauthenticated State: Standard GitHub OAuth */
                <div className="space-y-4">
                  <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-700 text-white mx-auto flex items-center justify-center shadow-xl ring-4 ring-slate-900/60">
                      <Github className="w-7 h-7" />
                    </div>

                    <div className="max-w-md mx-auto space-y-1.5">
                      <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
                        <span>Normal GitHub Authentication</span>
                        <span className="px-2 py-0.5 text-[10px] rounded-full font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          OAuth 2.0
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Sign in with standard GitHub authorization to browse, search, and audit any of your public or private repositories with a single click.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
                        <Lock className="w-3 h-3 text-cyan-400" />
                        <span>Private & Public Repos</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Read-Only Scope</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Instant Repo Tree Sync</span>
                      </span>
                    </div>

                    <div className="pt-2 flex flex-col items-center justify-center gap-3">
                      <button
                        onClick={() => onConnectOAuth('default')}
                        disabled={isConnectingGitHub}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-xs font-bold text-white bg-[#24292e] hover:bg-[#1b1f23] active:scale-[0.99] border border-slate-700 hover:border-slate-600 transition disabled:opacity-50 shadow-xl shadow-black/40 cursor-pointer"
                      >
                        <Github className="w-4 h-4 text-white" />
                        <span>
                          {isConnectingGitHub ? 'Opening GitHub Authorization...' : 'Sign in with GitHub'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-1" />
                      </button>

                      {oauthConfig?.url && (
                        <p className="text-[11px] text-slate-500">
                          Popup blocked?{' '}
                          <a
                            href={oauthConfig.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline font-medium"
                          >
                            Authorize directly in a new tab
                          </a>
                        </p>
                      )}
                    </div>

                    {/* Troubleshooter for 'redirect_uri is not associated with this application' */}
                    <div className="pt-3 border-t border-slate-800/80 text-left">
                      <button
                        type="button"
                        onClick={() => setShowOAuthTroubleshooter(!showOAuthTroubleshooter)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-xs text-amber-300 transition"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="font-semibold text-slate-200">
                            Fix: "The redirect_uri is not associated with this application"
                          </span>
                        </div>
                        <span className="text-[11px] text-blue-400 underline font-mono">
                          {showOAuthTroubleshooter ? 'Hide' : 'Show Solution & Quick Fixes'}
                        </span>
                      </button>

                      {showOAuthTroubleshooter && (
                        <div className="mt-2.5 p-4 bg-slate-950 border border-amber-500/30 rounded-xl space-y-3 text-xs animate-in fade-in">
                          <div className="space-y-1">
                            <p className="text-white font-semibold">
                              Why does this error occur?
                            </p>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              GitHub requires the callback URL sent by the app to exactly match the <strong className="text-slate-200">Authorization callback URL</strong> in your GitHub OAuth App settings.
                            </p>
                          </div>

                          <div className="space-y-1.5 p-3 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-medium">Exact Required Callback URL:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const url = oauthConfig?.devCallback || oauthConfig?.redirectUri || 'https://ais-dev-uegpoqjzh43vlgvmihsks6-67055679439.europe-west2.run.app/auth/callback';
                                  navigator.clipboard.writeText(url);
                                  setCopiedCallback(true);
                                  setTimeout(() => setCopiedCallback(false), 2500);
                                }}
                                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold"
                              >
                                {copiedCallback ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy URL</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <code className="block p-2 rounded bg-slate-950 text-amber-300 font-mono text-[11px] break-all border border-slate-800 select-all">
                              {oauthConfig?.devCallback || oauthConfig?.redirectUri || 'https://ais-dev-uegpoqjzh43vlgvmihsks6-67055679439.europe-west2.run.app/auth/callback'}
                            </code>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-slate-500">
                                1. Open your OAuth App on GitHub → 2. Paste into "Authorization callback URL" → 3. Click Save
                              </span>
                              <a
                                href="https://github.com/settings/developers"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 shrink-0 font-medium ml-2"
                              >
                                Open GitHub Settings <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            <p className="text-[11px] text-slate-400 font-medium">
                              Don't want to change your GitHub App settings right now? Try these quick options:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => onConnectOAuth('omit')}
                                className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition"
                              >
                                ⚡ Try without redirect_uri (Use app's saved default)
                              </button>
                              <button
                                type="button"
                                onClick={() => onConnectOAuth('shared')}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
                              >
                                Try Shared App URL (ais-pre-...)
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional Alternative: Personal Access Token */}
                  <div className="pt-1 text-center">
                    <button
                      onClick={() => setShowPatInput(!showPatInput)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 underline font-medium transition"
                    >
                      {showPatInput ? 'Hide manual token option' : 'Or connect instantly with Personal Access Token (PAT) — Zero configuration'}
                    </button>
                  </div>

                  {showPatInput && (
                    <form
                      onSubmit={handlePatSubmit}
                      className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                          <span>GitHub Personal Access Token</span>
                        </label>
                        <a
                          href="https://github.com/settings/tokens/new"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-400 hover:underline flex items-center gap-0.5"
                        >
                          Generate token <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          value={patInput}
                          onChange={(e) => setPatInput(e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={isSubmittingPat || !patInput.trim()}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition disabled:opacity-50"
                        >
                          {isSubmittingPat ? 'Validating...' : 'Connect'}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Requires read access (<code className="text-slate-400">repo</code> scope).
                      </p>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Upload ZIP / Archive */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  dragActive
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-950/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleZipFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-slate-800 text-blue-400 mx-auto flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-200 mb-1">
                  Click to browse or drop repository .zip file here
                </p>
                <p className="text-[11px] text-slate-400">
                  Ideal for archify export archives, offline private codebases, or downloaded repo zipballs.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Audit Focus
                </label>
                <select
                  value={userFocus}
                  onChange={(e) => setUserFocus(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {focusPresets.map((preset) => (
                    <option key={preset.label} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TAB 4: Featured Repos */}
          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Instantly explore realistic repositories with intentional architectural anti-patterns, security flaws, and full functional breakdown:
              </p>
              <div className="grid grid-cols-1 gap-3">
                {SAMPLE_REPOS.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => {
                      onSelectSample(sample);
                      onClose();
                    }}
                    className="p-3.5 bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-xl cursor-pointer transition group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white group-hover:text-blue-400 transition">
                            {sample.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {sample.language}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {sample.description}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 text-[11px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{sample.stars}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-900 text-[10px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {sample.tags.map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">
                            #{t}
                          </span>
                        ))}
                      </div>
                      <span className="text-blue-400 group-hover:translate-x-0.5 transition flex items-center gap-1 font-medium">
                        Launch Audit <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Recent Scans History */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Previously audited repositories saved in your local storage. Switch back instantly with zero re-scanning delay:
              </p>
              {history.length === 0 ? (
                <div className="p-10 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-500 space-y-1">
                  <History className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-400">No past reviews stored yet</p>
                  <p className="text-[11px] text-slate-500">
                    As you scan repositories, their audit data and code files will be saved here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 transition group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white group-hover:text-blue-400 transition truncate">
                            {item.repoMetadata.fullName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-slate-800 text-slate-300">
                            Grade {item.summary.grade}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {item.summary.appName} • {item.summary.findingsCount} findings ({item.summary.criticalCount} critical)
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          onSelectScan?.(item);
                          onClose();
                        }}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1 shadow-sm"
                      >
                        <span>Restore Review</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
