export interface ProjectMapping {
  id: string;
  jiraProject: string;
  almSchema: string;
  almDomain: string;
  almProject: string;
}

export interface SyncStatus {
  mappingId: string;
  jiraProject: string;
  almSchema: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface SyncLogEntry {
  id: string;
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
