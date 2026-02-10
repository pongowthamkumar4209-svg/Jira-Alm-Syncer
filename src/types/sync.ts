export interface ProjectMapping {
  id: string;
  jiraProject: string;
  almSchema: string;
  almDomain: string;
  almProject: string;
  lastSyncTime?: string;
  lastResult?: "Success" | "Failed" | "Blocked" | "—";
}

export interface SyncStatus {
  mappingId: string;
  jiraProject: string;
  almSchema: string;
  status: "pending" | "running" | "completed" | "failed";
  progress?: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface SyncExecution {
  id: string;
  triggeredBy: string;
  startTime: Date;
  endTime?: Date;
  overallStatus: "running" | "completed" | "partial" | "failed";
  statuses: SyncStatus[];
}

export interface DryRunResult {
  mappingId: string;
  jiraProject: string;
  almSchema: string;
  expectedCreate: number;
  expectedUpdate: number;
  expectedBlock: number;
}

export interface SyncLogEntry {
  id: string;
  executionId?: string;
  dateTime: string;
  jiraIssueKey: string;
  almRequirementID: string;
  syncType: string;
  result: string;
  almSchema: string;
  requirementName: string;
  requirementType: string;
  status: string;
  otitProject: string;
  parentRTMID: string;
  traceStatus: string;
  warnings: string;
  scriptErrors: string;
  plannedRelease: string;
}
