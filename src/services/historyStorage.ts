import {
  ComprehensiveAuditResult,
  IngestedFile,
  RepoMetadata,
  ScanHistoryItem,
} from '../types/audit';

const STORAGE_KEY = 'archify_scan_history_v1';
const MAX_HISTORY_ITEMS = 15;

export function loadScanHistory(): ScanHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.warn('Failed to load scan history from localStorage:', err);
    return [];
  }
}

export function saveScanToHistory(
  repoMetadata: RepoMetadata,
  auditResult: ComprehensiveAuditResult,
  files: IngestedFile[]
): ScanHistoryItem[] {
  try {
    const history = loadScanHistory();

    const criticalCount = auditResult.findings.filter(
      (f) => f.severity === 'Critical'
    ).length;

    // Compact file content slightly to avoid localStorage quota issues
    const safeFiles: IngestedFile[] = files.slice(0, 30).map((f) => ({
      path: f.path,
      content: f.content.length > 35000 ? f.content.slice(0, 35000) + '\n/* ... truncated for storage ... */' : f.content,
      size: f.size,
    }));

    const newItem: ScanHistoryItem = {
      id: `${repoMetadata.fullName || repoMetadata.name}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      repoMetadata,
      auditResult,
      files: safeFiles,
      summary: {
        grade: auditResult.executiveSummary.grade,
        healthScore: auditResult.executiveSummary.healthScore,
        findingsCount: auditResult.findings.length,
        criticalCount,
        appName: auditResult.executiveSummary.appName,
      },
    };

    // Remove existing item with identical repo name if any, putting the newest at top
    const filtered = history.filter(
      (item) => item.repoMetadata.fullName !== repoMetadata.fullName
    );

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (quotaErr) {
      // If quota exceeded, aggressively prune to top 5 and retry
      console.warn('Storage quota warning, pruning old scans:', quotaErr);
      const pruned = [newItem, ...filtered].slice(0, 5);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
      return pruned;
    }

    return updated;
  } catch (err) {
    console.warn('Failed to save scan to history:', err);
    return loadScanHistory();
  }
}

export function deleteScanFromHistory(id: string): ScanHistoryItem[] {
  try {
    const history = loadScanHistory();
    const updated = history.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to delete scan from history:', err);
    return loadScanHistory();
  }
}

export function clearScanHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear scan history:', err);
  }
}
