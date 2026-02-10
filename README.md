🚀 JIRA–ALM Syncher

Enterprise Requirement Synchronization Platform

A web-based orchestration platform to synchronize requirements from JIRA to Micro Focus ALM across multiple projects and schemas, with centralized configuration, execution control, and audit logging.

🔗 Live Application: https://jira-alm-syncer.vercel.app

🔐 Demo Credentials

Username: admin

Password: admin123

🧩 Problem Statement

In large enterprises, business teams manage requirements in JIRA, while testing teams execute and maintain them in ALM.
Manual synchronization across multiple projects and schemas is error-prone, time-consuming, and difficult to audit.

This platform solves that by providing:

Centralized project mapping

Controlled execution of sync jobs

Visibility into sync results and failures

Enterprise-grade audit logs

✨ Key Features
🔐 Authentication

Secure login (POC-based authentication)

Role-based access ready for extension

📊 Dashboard

High-level synchronization overview

Recent sync activity with status indicators

Success / failure / blocked metrics

🔁 Project & Schema Mapping

Map JIRA Dashboards to ALM Schemas

Configure ALM Domain and Project per mapping

Each mapping represents an execution context

▶ Execute Synchronization

One-click execution of JIRA → ALM sync

Sequential processing per schema

Real-time execution state (pending / running / completed / failed)

🧾 Sync Logs

SQL-backed synchronization audit logs

Filter by schema, sync type, and date

Full traceability for compliance and debugging

⚙ Integration Configuration

Centralized configuration for:

JIRA base URL

ALM host

Database connection details

Designed to inject credentials securely during execution (never hardcoded)

🏗 Architecture Overview
Web UI (React)
   ↓
Configuration & Mapping
   ↓
Execution Trigger
   ↓
PowerShell Sync Script
   ↓
JIRA REST APIs → ALM APIs
   ↓
SQL Server (Sync Logs)


UI acts as an orchestration layer

Core business logic resides in PowerShell automation

Logs persisted for audit and reporting (Power BI ready)

🛠 Tech Stack

Frontend: React + TypeScript + Vite

UI: shadcn/ui, Tailwind CSS

Routing: React Router

State / Data: TanStack Query

Backend Logic: PowerShell (REST API based)

Database: SQL Server

Deployment: Vercel

Source Control: GitHub

🔐 Security & Credentials

Credentials are not hardcoded

Designed to pass:

JIRA API token

ALM username & password

Database credentials
as environment variables during execution

UI stores only configuration metadata

📌 Use Cases

Multi-project JIRA → ALM requirement synchronization

Enterprise ALM administration and automation

Audit-compliant requirement traceability

Foundation for CI/CD-driven test governance

📄 Documentation

Architecture documentation available in docs/architecture.md

PowerShell synchronization script preserved for transparency and reuse

🚧 Future Enhancements

Secure credential vault integration

Scheduler / cron-based execution

Role-based access control (RBAC)

Power BI embedded dashboards

Email / Teams notifications on sync failures

👤 Author

Pongowtham Kumar
Enterprise Automation | RPA | ALM | Integration Engineering
