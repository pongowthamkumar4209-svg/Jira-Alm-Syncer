Jira–ALM Requirement Synchronization
Problem Statement
Business teams create and maintain requirements in JIRA across multiple projects, while testing activities are performed in ALM.

Manually syncing requirements between JIRA and ALM for multiple projects was time-consuming and often led to mismatches and outdated data.

Solution
Developed an automated integration using REST APIs to synchronize requirements from JIRA to ALM.

The solution supports daily updates, ensuring that requirement changes in JIRA are consistently reflected in ALM.

All synchronization activities are logged and visualized through dashboards for monitoring and traceability.

Key Features
Fetches requirements from JIRA using REST APIs
Uploads and updates requirements in ALM
Handles day-to-day incremental changes
Centralized logging stored in a database
Power BI dashboard for sync status and insights
Tech Stack
REST APIs
Python / PowerShell
Database for logs
Power BI for reporting and visualization
Impact
Eliminated manual requirement synchronization
Improved requirement traceability between tools
Increased confidence in test coverage and data accuracy
