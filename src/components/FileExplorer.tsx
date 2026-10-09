import React, { useState } from 'react';
import {
  FileCode,
  Folder,
  ChevronRight,
  ChevronDown,
  Search,
  AlertCircle,
  FileText,
  FileCheck2,
  Box,
} from 'lucide-react';
import { IngestedFile, Finding } from '../types/audit';

interface FileExplorerProps {
  files: IngestedFile[];
  selectedFile: IngestedFile | null;
  onSelectFile: (file: IngestedFile) => void;
  findings: Finding[];
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFile,
  onSelectFile,
  findings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Map findings count per file path
  const findingsMap = findings.reduce<Record<string, { critical: number; high: number; other: number }>>(
    (acc, f) => {
      if (!acc[f.file]) {
        acc[f.file] = { critical: 0, high: 0, other: 0 };
      }
      if (f.severity === 'Critical') acc[f.file].critical++;
      else if (f.severity === 'High') acc[f.file].high++;
      else acc[f.file].other++;
      return acc;
    },
    {}
  );

  const filteredFiles = files.filter((f) =>
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (filePath: string) => {
    const lower = filePath.toLowerCase();
    if (lower.endsWith('dockerfile') || lower.includes('docker-compose')) {
      return <Box className="w-3.5 h-3.5 text-cyan-400" />;
    }
    if (lower.endsWith('.json') || lower.endsWith('.yaml') || lower.endsWith('.yml')) {
      return <FileText className="w-3.5 h-3.5 text-amber-400" />;
    }
    if (lower.endsWith('.md')) {
      return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
    return <FileCode className="w-3.5 h-3.5 text-blue-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800 text-xs select-none">
      {/* Header & Search */}
      <div className="p-3 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
            Archived Files ({files.length})
          </span>
          {findings.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25">
              {findings.length} findings
            </span>
          )}
        </div>

        <div className="relative">
          <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-7 pr-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Files list */}
      <div className="flex-1 overflow-y-auto py-1 divide-y divide-slate-900/40">
        {filteredFiles.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-xs">
            No files match your query
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isSelected = selectedFile?.path === file.path;
            const issues = findingsMap[file.path];
            const hasCritical = issues && issues.critical > 0;
            const hasHigh = issues && issues.high > 0;
            const hasOther = issues && issues.other > 0;

            return (
              <button
                key={file.path}
                onClick={() => onSelectFile(file)}
                className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition group ${
                  isSelected
                    ? 'bg-blue-600/15 text-blue-300 border-l-2 border-blue-500'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getFileIcon(file.path)}
                  <span className="truncate font-mono text-[11px]">{file.path}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {hasCritical ? (
                    <span
                      title={`${issues.critical} Critical issue(s)`}
                      className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-[9px] font-bold"
                    >
                      !
                    </span>
                  ) : hasHigh ? (
                    <span
                      title={`${issues.high} High issue(s)`}
                      className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-[9px] font-bold"
                    >
                      ▲
                    </span>
                  ) : hasOther ? (
                    <span
                      title={`${issues.other} Medium/Low issue(s)`}
                      className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-[9px]"
                    >
                      •
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
