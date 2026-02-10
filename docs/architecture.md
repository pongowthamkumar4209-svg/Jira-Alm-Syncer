# Architecture

## Data Flow

```
JIRA Dashboard → PowerShell Script → ALM → SQL Server Logs → Web UI
```

## Components

### Frontend (React + TypeScript)
- **Login** – Simple credential-based auth (dummy for now)
- **Dashboard** – Overview stats from sync logs
- **Project Mapping** – CRUD for JIRA↔ALM project pairs
- **Run Sync** – Orchestration UI that triggers the PowerShell script per schema
- **Sync Logs** – Read-only view of SQL Server log entries with filtering
- **Settings** – Placeholder for connection parameters

### Orchestration Layer (Future Backend)
- Exposes REST API endpoint to trigger sync
- Loops over configured project mappings
- Invokes `Jira-ALMGeneric.ps1` per ALM schema with parameters:
  - `$SSchema`, `$Ttoken`, `$AAlmusername`, `$AAlmpassword`
  - `$DDomain`, `$PProject`, `$DB_Host`, `$DB_Name`
  - `$DBUserName`, `$DBPassword`, `$jiraUrl`, `$almHost`
- Captures exit codes and execution status

### PowerShell Script (`Jira-ALMGeneric.ps1`)
- Fetches requirements from JIRA via REST API
- Creates/updates ALM requirements via ALM REST API
- Manages traceability links
- Writes all operations to SQL Server log table

### SQL Server
- Stores sync log entries with columns:
  - DateTime, JiraIssueKey, ALMRequirementID, SyncType, Result
  - ALMSchema, Name, RequirementType, RequirementStatus
  - OTITProject, ParentRTMID, TraceStatus, Warnings, ScriptErrors, PlannedRelease

## Security
- All credentials passed as environment variables / parameters
- No secrets hardcoded in source code
- Frontend uses dummy auth (Phase 1)
