import React, { useState } from 'react';
import {
  X,
  History,
  Trash2,
  FolderGit2,
  ExternalLink,
  Flame,
  ShieldAlert,
  ArrowRight,
  Clock,
  Star,
  Code2,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { ScanHistoryItem } from '../types/audit';

interface ScanHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ScanHistoryItem[];
  onSelectScan: (item: ScanHistoryItem) => void;
  onDeleteScan: (id: string) => void;
  onClearHistory: () => void;
  currentRepoFullName?: string;
}

export const ScanHistoryModal: React.FC<ScanHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectScan,
  onDeleteScan,
  onClearHistory,
  currentRepoFullName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.repoMetadata.fullName.toLowerCase().includes(q) ||
      item.summary.appName.toLowerCase().includes(q) ||
      (item.repoMetadata.language && item.repoMetadata.language.toLowerCase().includes(q))
    );
  });

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const getGradeBadge = (grade: string) => {
    const color =
      grade === 'A+' || grade === 'A'
        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
        : grade === 'B'
        ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
        : grade === 'C'
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
        : 'bg-rose-500/20 text-rose-400 border-rose-500/40';

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
        Grade {grade}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">Previous Scan History</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {history.length} saved
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Switch back to any previously audited repository instantly without re-scanning
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

        {/* Search & Actions Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search previous reviews..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition flex items-center gap-1.5"
              title="Clear all stored review history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear History</span>
            </button>
          )}
        </div>

        {/* History List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">No previous scans found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Whenever you audit a GitHub repository or uploaded archive, its review results and code metadata are automatically preserved here.
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No previous scans match your search query.
            </div>
          ) : (
            filteredHistory.map((item) => {
              const isCurrent = currentRepoFullName === item.repoMetadata.fullName;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-950/20 border-blue-500/40 ring-1 ring-blue-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FolderGit2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-bold text-xs text-white truncate">
                          {item.repoMetadata.fullName}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
                            Active Review
                          </span>
                        )}
                        {item.repoMetadata.language && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {item.repoMetadata.language}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {item.summary.appName} • {item.files.length} archived files
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(item.timestamp)}
                        </span>
                        <span className="flex items-center gap-1 text-rose-400">
                          <Flame className="w-3 h-3" />
                          {item.summary.findingsCount} findings ({item.summary.criticalCount} critical)
                        </span>
                      </div>
                    </div>

                    {/* Right: Grade & Switch Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        {getGradeBadge(item.summary.grade)}
                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                          {item.summary.healthScore}/100
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          onSelectScan(item);
                          onClose();
                        }}
                        disabled={isCurrent}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isCurrent
                            ? 'bg-slate-800 text-slate-500 cursor-default'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                        }`}
                      >
                        <span>{isCurrent ? 'Viewing' : 'Switch'}</span>
                        {!isCurrent && <ArrowRight className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={() => onDeleteScan(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
