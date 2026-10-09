export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export type FindingCategory =
  | 'Security Flaw (SAST)'
  | 'Infrastructure & Docker'
  | 'Secret / Credential Leak'
  | 'Dependency (SCA)'
  | 'Code Quality & Logic'
  | 'CI/CD & Cloud';

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  category: FindingCategory;
  file: string;
  line?: number;
  cwe?: string;
  impact: string;
  description: string;
  recommendation: string;
  originalCode: string;
  fixedCode: string;
  status?: 'open' | 'reviewed' | 'ignored';
}

export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  authRequired?: boolean;
}

export interface CoreFeature {
  name: string;
  description: string;
  status: 'Complete' | 'Incomplete' | 'Flawed' | 'Stub';
}

export interface ExecutiveSummary {
  appName: string;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  healthScore: number;
  verdict: string;
  architectureType: string;
  primaryTechStack: string[];
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low';
  summaryDescription: string;
}

export interface FeaturesAndFunctionality {
  overview: string;
  coreFeatures: CoreFeature[];
  apiSurfaceAndEndpoints: ApiEndpoint[];
  authAndDataFlow: string;
}

export interface Recommendations {
  architecture: string[];
  securityHardening: string[];
  devOpsAndCI: string[];
  performanceAndScalability: string[];
}

export interface ActionPlanPhase {
  phase: string;
  timeframe: string;
  items: string[];
}

export interface ComprehensiveAuditResult {
  executiveSummary: ExecutiveSummary;
  featuresAndFunctionality: FeaturesAndFunctionality;
  findings: Finding[];
  recommendations: Recommendations;
  actionPlan: ActionPlanPhase[];
}

export interface RepoMetadata {
  name: string;
  fullName: string;
  owner?: string;
  description: string;
  stars?: number;
  forks?: number;
  openIssues?: number;
  license?: string;
  defaultBranch?: string;
  language?: string;
  htmlUrl?: string;
  totalFileCount?: number;
  scannedFileCount?: number;
}

export interface IngestedFile {
  path: string;
  content: string;
  size?: number;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  html_url: string;
  bio: string | null;
  public_repos: number;
  total_private_repos?: number;
}

export interface GitHubUserRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  default_branch: string;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: string;
  repoMetadata: RepoMetadata;
  auditResult: ComprehensiveAuditResult;
  files: IngestedFile[];
  summary: {
    grade: string;
    healthScore: number;
    findingsCount: number;
    criticalCount: number;
    appName: string;
  };
}


