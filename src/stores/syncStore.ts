import { ProjectMapping, SyncLogEntry, SyncStatus } from "@/types/sync";

// In-memory store for project mappings
let mappings: ProjectMapping[] = [
  {
    id: "1",
    jiraProject: "INFRA Dashboard",
    almSchema: "INFRA_SCHEMA",
    almDomain: "INFRASTRUCTURE",
    almProject: "Infra_Requirements",
  },
  {
    id: "2",
    jiraProject: "APP Dashboard",
    almSchema: "APP_SCHEMA",
    almDomain: "APPLICATION",
    almProject: "App_Requirements",
  },
];

let syncStatuses: SyncStatus[] = [];

// Mock sync log data
const mockLogs: SyncLogEntry[] = [
  {
    id: "1", dateTime: "2026-02-10 09:15:23", jiraIssueKey: "INFRA-1024",
    almRequirementID: "REQ-4501", syncType: "CREATE", result: "Success",
    almSchema: "INFRA_SCHEMA", requirementName: "Network Firewall Update",
    requirementType: "Functional", status: "Active", otitProject: "INFRA-2026",
    parentRTMID: "RTM-100", traceStatus: "Linked", warnings: "", scriptErrors: "", plannedRelease: "R2026.Q1",
  },
  {
    id: "2", dateTime: "2026-02-10 09:15:45", jiraIssueKey: "INFRA-1025",
    almRequirementID: "REQ-4502", syncType: "UPDATE", result: "Success",
    almSchema: "INFRA_SCHEMA", requirementName: "Load Balancer Config",
    requirementType: "Non-Functional", status: "Active", otitProject: "INFRA-2026",
    parentRTMID: "RTM-100", traceStatus: "Linked", warnings: "Field mismatch resolved", scriptErrors: "", plannedRelease: "R2026.Q1",
  },
  {
    id: "3", dateTime: "2026-02-10 09:16:02", jiraIssueKey: "APP-512",
    almRequirementID: "REQ-4503", syncType: "CREATE", result: "Success",
    almSchema: "APP_SCHEMA", requirementName: "User Auth Module",
    requirementType: "Functional", status: "New", otitProject: "APP-2026",
    parentRTMID: "RTM-201", traceStatus: "Pending", warnings: "", scriptErrors: "", plannedRelease: "R2026.Q2",
  },
  {
    id: "4", dateTime: "2026-02-10 09:16:30", jiraIssueKey: "APP-513",
    almRequirementID: "", syncType: "BLOCK", result: "Blocked",
    almSchema: "APP_SCHEMA", requirementName: "Payment Gateway Integration",
    requirementType: "Functional", status: "Blocked", otitProject: "APP-2026",
    parentRTMID: "", traceStatus: "Unlinked", warnings: "Missing parent RTM", scriptErrors: "HTTP 403 from ALM", plannedRelease: "R2026.Q2",
  },
  {
    id: "5", dateTime: "2026-02-09 14:22:10", jiraIssueKey: "INFRA-1020",
    almRequirementID: "REQ-4490", syncType: "UPDATE", result: "Success",
    almSchema: "INFRA_SCHEMA", requirementName: "DNS Migration Plan",
    requirementType: "Technical", status: "Closed", otitProject: "INFRA-2026",
    parentRTMID: "RTM-100", traceStatus: "Linked", warnings: "", scriptErrors: "", plannedRelease: "R2026.Q1",
  },
];

export const getMappings = () => [...mappings];

export const addMapping = (m: Omit<ProjectMapping, "id">) => {
  const newMapping = { ...m, id: Date.now().toString() };
  mappings = [...mappings, newMapping];
  return newMapping;
};

export const updateMapping = (id: string, m: Partial<ProjectMapping>) => {
  mappings = mappings.map((x) => (x.id === id ? { ...x, ...m } : x));
};

export const removeMapping = (id: string) => {
  mappings = mappings.filter((x) => x.id !== id);
};

export const getSyncStatuses = () => [...syncStatuses];
export const setSyncStatuses = (s: SyncStatus[]) => { syncStatuses = s; };

export const getSyncLogs = () => [...mockLogs];
