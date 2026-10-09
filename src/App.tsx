/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  FileCode,
  ShieldAlert,
  Cpu,
  Layers,
  Sparkles,
  Download,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  MessageSquareQuote,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react';
import { Header } from './components/Header';
import { FileExplorer } from './components/FileExplorer';
import { CodeViewer } from './components/CodeViewer';
import { ExecutiveSummaryTab } from './components/ExecutiveSummaryTab';
import { ArchifyVisualWorkspace } from './components/ArchifyVisualWorkspace';
import { FeaturesTab } from './components/FeaturesTab';
import { FindingsTab } from './components/FindingsTab';
import { RecommendationsTab } from './components/RecommendationsTab';
import { DeepDiveChatTab } from './components/DeepDiveChatTab';
import { RepoIngestionModal } from './components/RepoIngestionModal';
import { ExportModal } from './components/ExportModal';
import { ScanHistoryModal } from './components/ScanHistoryModal';
import { SAMPLE_REPOS, SampleRepo } from './data/sampleRepos';
import { useGitHubAuth } from './hooks/useGitHubAuth';
import {
  loadScanHistory,
  saveScanToHistory,
  deleteScanFromHistory,
  clearScanHistory,
} from './services/historyStorage';
import {
  ComprehensiveAuditResult,
  Finding,
  IngestedFile,
  RepoMetadata,
  ScanHistoryItem,
} from './types/audit';

export default function App() {
  const [currentSample, setCurrentSample] = useState<SampleRepo>(SAMPLE_REPOS[0]);
  const [repoMetadata, setRepoMetadata] = useState<RepoMetadata | null>(SAMPLE_REPOS[0].metadata);
  const [files, setFiles] = useState<IngestedFile[]>(SAMPLE_REPOS[0].files);
  const [selectedFile, setSelectedFile] = useState<IngestedFile | null>(SAMPLE_REPOS[0].files[0]);
  const [auditResult, setAuditResult] = useState<ComprehensiveAuditResult | null>(
    SAMPLE_REPOS[0].precomputedAudit || null
  );

  // Scan History State from Local Storage
  const [history, setHistory] = useState<ScanHistoryItem[]>(() => {
    const existing = loadScanHistory();
    if (existing.length === 0 && SAMPLE_REPOS[0].precomputedAudit) {
      return saveScanToHistory(
        SAMPLE_REPOS[0].metadata,
        SAMPLE_REPOS[0].precomputedAudit,
        SAMPLE_REPOS[0].files
      );
    }
    return existing;
  });
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // GitHub Auth Hook
  const {
    token: gitHubToken,
    user: gitHubUser,
    repos: gitHubRepos,
    isLoadingRepos,
    isConnecting: isConnectingGitHub,
    connectWithOAuth,
    connectWithToken,
    disconnect: disconnectGitHub,
    refreshRepos,
    oauthConfig,
  } = useGitHubAuth();

  const [activeTab, setActiveTab] = useState<
    'summary' | 'archify' | 'features' | 'findings' | 'recommendations' | 'code' | 'deepdive'
  >('summary');

  const [initialSeverityFilter, setInitialSeverityFilter] = useState<string>('All');
  const [activeFindingForDeepDive, setActiveFindingForDeepDive] = useState<Finding | null>(null);

  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [defaultModalTab, setDefaultModalTab] = useState<'github' | 'myrepos' | 'upload' | 'samples'>('github');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [auditStepMessage, setAuditStepMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Trigger comprehensive audit via server
  const triggerComprehensiveAudit = async (
    targetMetadata: RepoMetadata,
    targetFiles: IngestedFile[],
    userFocus?: string
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    setAuditStepMessage('Running SAST heuristic rules & Gemini 3.8 Flash comprehensive audit...');

    try {
      const res = await fetch('/api/gemini/comprehensive-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoMetadata: targetMetadata,
          files: targetFiles,
          userFocus: userFocus || 'Full 360-degree review of functionality, features, security, infrastructure misconfigurations, code quality, and actionable fixes.',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server review failed (${res.status})`);
      }

      const data = await res.json();
      setAuditResult(data.auditResult);

      // Persist scan results in local storage
      const updatedHistory = saveScanToHistory(targetMetadata, data.auditResult, targetFiles);
      setHistory(updatedHistory);

      setActiveTab('summary');
    } catch (err: any) {
      console.error('Audit failed:', err);
      setErrorMessage(err.message || 'Audit encountered an unexpected error.');
    } finally {
      setIsLoading(false);
      setAuditStepMessage(null);
    }
  };

  // Ingest from GitHub
  const handleIngestGithub = async (
    repoUrl: string,
    branch: string,
    userFocus: string,
    tokenOverride?: string
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    setAuditStepMessage(`Fetching repository tree and source files from GitHub (${repoUrl})...`);

    try {
      const authToken = tokenOverride || gitHubToken;
      const res = await fetch('/api/github/fetch-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ repoUrl, branch, token: authToken }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch GitHub repo (${res.status})`);
      }

      const data = await res.json();
      setRepoMetadata(data.metadata);
      setFiles(data.files);
      if (data.files && data.files.length > 0) {
        setSelectedFile(data.files[0]);
      }

      // Run AI Review
      setAuditStepMessage('Running Deep AI & SAST Architectural Review on ingested repository...');
      await triggerComprehensiveAudit(data.metadata, data.files, userFocus);
    } catch (err: any) {
      console.error('Error during GitHub ingestion:', err);
      setErrorMessage(err.message || 'Failed to ingest repository.');
      throw err;
    } finally {
      setIsLoading(false);
      setAuditStepMessage(null);
    }
  };

  // Ingest from Zip Archive
  const handleIngestZip = async (
    metadata: RepoMetadata,
    extractedFiles: IngestedFile[],
    userFocus: string
  ) => {
    setRepoMetadata(metadata);
    setFiles(extractedFiles);
    if (extractedFiles.length > 0) {
      setSelectedFile(extractedFiles[0]);
    }
    await triggerComprehensiveAudit(metadata, extractedFiles, userFocus);
  };

  // Select Sample Repo
  const handleSelectSample = (sample: SampleRepo) => {
    setCurrentSample(sample);
    setRepoMetadata(sample.metadata);
    setFiles(sample.files);
    setSelectedFile(sample.files[0]);
    if (sample.precomputedAudit) {
      setAuditResult(sample.precomputedAudit);
      const updated = saveScanToHistory(sample.metadata, sample.precomputedAudit, sample.files);
      setHistory(updated);
    } else {
      triggerComprehensiveAudit(sample.metadata, sample.files);
    }
    setActiveTab('summary');
  };

  // Switch to scan from local storage history
  const handleSelectScanFromHistory = (item: ScanHistoryItem) => {
    setRepoMetadata(item.repoMetadata);
    setAuditResult(item.auditResult);
    setFiles(item.files);
    setSelectedFile(item.files[0] || null);
    setActiveTab('summary');
  };

  const handleDeleteScanFromHistory = (id: string) => {
    const updated = deleteScanFromHistory(id);
    setHistory(updated);
  };

  const handleClearHistory = () => {
    clearScanHistory();
    setHistory([]);
  };

  // Jump from finding to code viewer
  const handleSelectFileAndLine = (filePath: string, line?: number) => {
    const target = files.find((f) => f.path === filePath);
    if (target) {
      setSelectedFile(target);
      setActiveTab('code');
    }
  };

  // Ask AI about a finding
  const handleAskAiAboutFinding = (finding: Finding) => {
    setActiveFindingForDeepDive(finding);
    setActiveTab('deepdive');
  };

  const findingsList = auditResult?.findings || [];
  const criticalCount = findingsList.filter((f) => f.severity === 'Critical').length;
  const highCount = findingsList.filter((f) => f.severity === 'High').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Header
        repoMetadata={repoMetadata}
        auditResult={auditResult}
        onOpenIngest={(tab) => {
          setDefaultModalTab(tab || 'github');
          setIsIngestModalOpen(true);
        }}
        onOpenExport={() => setIsExportModalOpen(true)}
        isAuditing={isLoading}
        onReaudit={() => {
          if (repoMetadata && files.length > 0) {
            triggerComprehensiveAudit(repoMetadata, files);
          }
        }}
        gitHubUser={gitHubUser}
        isConnectingGitHub={isConnectingGitHub}
        onConnectGitHub={async () => {
          setDefaultModalTab('myrepos');
          setIsIngestModalOpen(true);
        }}
        onDisconnectGitHub={disconnectGitHub}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
      />

      {/* Loading & Status Banner */}
      {isLoading && (
        <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-purple-900/60 border-b border-blue-500/30 px-6 py-2.5 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2.5 text-xs text-blue-200">
            <Sparkles className="w-4 h-4 text-blue-300 animate-spin" />
            <span className="font-medium">
              {auditStepMessage || 'Comprehensive code review in progress...'}
            </span>
          </div>
          <span className="text-[11px] text-blue-300/80 font-mono">
            Analyzing {files.length} repository files
          </span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-rose-950/80 border-b border-rose-500/40 px-6 py-2.5 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-slate-400 hover:text-white text-[11px] underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Navigation Bar */}
      <div className="border-b border-slate-800 bg-slate-950 px-4 lg:px-6">
        <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 py-1">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'summary'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Executive Overview</span>
              {auditResult && (
                <span
                  className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    auditResult.executiveSummary.grade === 'A+' || auditResult.executiveSummary.grade === 'A'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  Grade {auditResult.executiveSummary.grade}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('archify')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'archify'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Archify Visual</span>
              <span className="px-1.5 py-0.2 text-[9px] rounded-full uppercase tracking-wider font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Interactive
              </span>
            </button>

            <button
              onClick={() => setActiveTab('features')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'features'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Features & API Surface</span>
              {auditResult?.featuresAndFunctionality.coreFeatures && (
                <span className="text-[10px] text-slate-500 font-mono">
                  ({auditResult.featuresAndFunctionality.coreFeatures.length})
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('findings')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'findings'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Findings & Code Fixes</span>
              {findingsList.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {findingsList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('recommendations')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'recommendations'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>DevSecOps Recommendations</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'code'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Code & Diff Viewer</span>
              <span className="text-[10px] text-slate-500 font-mono">
                ({files.length} files)
              </span>
            </button>

            <button
              onClick={() => setActiveTab('deepdive')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'deepdive'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MessageSquareQuote className="w-4 h-4 text-indigo-400" />
              <span>Ask AI Architect</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
        {activeTab === 'code' ? (
          /* Split Code & File Explorer View */
          <div className="flex-1 flex rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950 h-[80vh]">
            <div className="w-64 sm:w-72 shrink-0 h-full">
              <FileExplorer
                files={files}
                selectedFile={selectedFile}
                onSelectFile={setSelectedFile}
                findings={findingsList}
              />
            </div>
            <div className="flex-1 h-full">
              <CodeViewer
                file={selectedFile}
                findings={findingsList}
                onSelectFinding={(f) => {
                  handleAskAiAboutFinding(f);
                }}
              />
            </div>
          </div>
        ) : (
          /* Full Width Content Views */
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'summary' && auditResult && (
              <ExecutiveSummaryTab
                audit={auditResult}
                metadata={repoMetadata}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onFilterSeverity={(sev) => setInitialSeverityFilter(sev)}
              />
            )}

            {activeTab === 'archify' && auditResult && (
              <ArchifyVisualWorkspace
                auditResult={auditResult}
                files={files}
                repoMetadata={repoMetadata}
                onSelectFileAndLine={handleSelectFileAndLine}
                onAskAiAboutFinding={handleAskAiAboutFinding}
              />
            )}

            {activeTab === 'features' && auditResult && (
              <FeaturesTab featuresData={auditResult.featuresAndFunctionality} />
            )}

            {activeTab === 'findings' && auditResult && (
              <FindingsTab
                findings={findingsList}
                onSelectFileAndLine={handleSelectFileAndLine}
                onAskAiAboutFinding={handleAskAiAboutFinding}
                initialSeverityFilter={initialSeverityFilter}
              />
            )}

            {activeTab === 'recommendations' && auditResult && (
              <RecommendationsTab
                recommendations={auditResult.recommendations}
                actionPlan={auditResult.actionPlan}
              />
            )}

            {activeTab === 'deepdive' && (
              <DeepDiveChatTab
                metadata={repoMetadata}
                activeFinding={activeFindingForDeepDive}
                selectedFile={selectedFile}
              />
            )}
          </div>
        )}
      </main>

      {/* Ingestion Modal */}
      <RepoIngestionModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onSelectSample={handleSelectSample}
        onIngestGithub={handleIngestGithub}
        onIngestZip={handleIngestZip}
        isLoading={isLoading}
        defaultTab={defaultModalTab}
        gitHubUser={gitHubUser}
        gitHubRepos={gitHubRepos}
        isLoadingRepos={isLoadingRepos}
        isConnectingGitHub={isConnectingGitHub}
        onConnectOAuth={connectWithOAuth}
        onConnectToken={connectWithToken}
        onDisconnectGitHub={disconnectGitHub}
        onRefreshRepos={refreshRepos}
        oauthConfig={oauthConfig}
        history={history}
        onSelectScan={handleSelectScanFromHistory}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        auditResult={auditResult}
        metadata={repoMetadata}
      />

      {/* Scan History Modal */}
      <ScanHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        onSelectScan={handleSelectScanFromHistory}
        onDeleteScan={handleDeleteScanFromHistory}
        onClearHistory={handleClearHistory}
        currentRepoFullName={repoMetadata?.fullName}
      />
    </div>
  );
}
