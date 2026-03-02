# 🔄 Jira-ALM Syncer

> A full-stack web application to synchronize Jira issues into OpenText ALM requirements — built with React, Python Flask, and a PowerShell integration engine.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-00e5ff?style=for-the-badge&logo=vercel&logoColor=black)](https://jira-alm-syncer-wovh.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Local%20via%20start.bat-e03030?style=for-the-badge&logo=windows&logoColor=white)](#-local-setup)
[![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![PowerShell](https://img.shields.io/badge/PowerShell-5.1%2B-5391FE?style=for-the-badge&logo=powershell&logoColor=white)](https://learn.microsoft.com/en-us/powershell/)

---

## 🚀 Live Application

**🔗 https://jira-alm-syncer-wovh.vercel.app**

> Login with demo credentials to explore all features without a real Jira or ALM connection.

---

## 📌 Overview

Keeping Jira issues in sync with ALM requirements manually is a repetitive, error-prone process. This application wraps the `Jira-ALMGeneric.ps1` PowerShell engine in a clean React web interface — providing real-time streaming logs, sync history, and full parameter control.

Built by an RPA Developer with 4+ years of ALM experience — handling traceability management, parent-child requirement mapping, and SQL-based sync logging.

---

## ✨ Features

### Core Sync Engine

| Sync Type | Description |
|---|---|
| ✅ **CREATE** | New Jira issue → create ALM requirement |
| 🔄 **UPDATE** | Changed Jira issue → update ALM requirement fields |
| 🔁 **JIRA UPDATE** | ALM-driven changes pushed back to Jira |
| 🚫 **BLOCK CREATE** | Create blocked/rejected requirements |
| 🚫 **BLOCK UPDATE** | Update existing blocked requirements |
| 👻 **ORPHAN TRACE** | Detect and manage orphaned traceability links |
| ⚠️ **WARNING UPDATE** | Update requirements flagged with warnings |
| 📝 **UPDATE NAME** | Sync requirement name changes from Jira |
| 🔗 **UPDATE PARENT TRACE** | Re-link parent-child traces after hierarchy changes |
| ❓ **BLOCK UNKNOWN** | Handle unknown block states |

### Two Operating Modes

| Mode | When | How |
|---|---|---|
| 🟢 **Live Mode** | Windows machine + `start.bat` running + `Jira-ALMGeneric.ps1` present | Real PowerShell execution with SSE streaming |
| 🟡 **Demo Mode** | No backend / any machine | 12-step simulated sync with realistic log output |

### Key Capabilities
- **Real-time streaming console** — SSE-based live log output from PowerShell
- **12-parameter configuration** — Full Jira, ALM, and optional SQL DB params
- **Sync history** — Searchable, filterable table with detail drawer
- **Session persistence** — All 12 params saved to localStorage across sessions
- **3-step authentication** — App login → Jira/ALM config → sync execution

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Deployed on **Vercel**

**Backend**
- Python 3.x
- Flask 3.0 REST API
- Flask-CORS
- Server-Sent Events (SSE) for real-time streaming
- Runs locally via `start.bat` (Windows)

**Sync Engine**
- PowerShell 5.1+ (`powershell.exe`) or PowerShell 7+ (`pwsh.exe`)
- `Jira-ALMGeneric.ps1` — custom sync script
- JQL-based Jira issue fetching
- ALM REST API for requirement CREATE/UPDATE
- Optional SQL Server logging

---

## 🏗️ Architecture

```
Browser (Vercel)
      │
      ▼
React Frontend ──────► Flask REST API (localhost:5000)
                              │
                    ┌─────────┴──────────┐
                    │                    │
            start.bat running?       Demo Mode
            + PS1 script present     (no backend)
                    │                    │
                    ▼                    ▼
         PowerShell Execution      Simulated Logs
         Jira-ALMGeneric.ps1       (12 demo steps)
                    │
          ┌─────────┴─────────┐
          │                   │
       Jira API           ALM REST API
    (fetch issues)    (CREATE/UPDATE reqs)
                            │
                      SQL Server DB
                     (optional logging)
```

---

## 🖥️ Local Setup

### Prerequisites
- Python 3.8+
- Node.js 18+
- Git
- Windows OS (for Live sync mode)
- PowerShell 5.1+ (built into Windows)
- `Jira-ALMGeneric.ps1` sync script

### 1. Clone the repository

```bash
git clone https://github.com/pongowthamkumar4209-svg/Jira-Alm-Syncer.git
cd Jira-Alm-Syncer
```

### 2. Place the PowerShell script

```
Jira-Alm-Syncer/
└── Jira-ALMGeneric.ps1   ← place here (root folder)
```

### 3. Start the Flask backend

```bash
# Option A — double-click start.bat (recommended)
start.bat

# Option B — manual
cd backend
pip install flask flask-cors
python app.py
# → Running on http://localhost:5000
```

### 4. Start the React frontend

```bash
npm install
npm run dev
# → Running on http://localhost:5173
```

### 5. Open in browser

```
http://localhost:5173

# Or use the Vercel deployment (backend must still be running locally)
https://jira-alm-syncer-wovh.vercel.app
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check backend + PowerShell availability |
| POST | `/api/sync` | Execute sync — streams SSE log output |

### Sync Parameters (12 total)

| Parameter | Description |
|---|---|
| `jiraUrl` | Jira server base URL |
| `jiraToken` | Jira API token |
| `schema` | ALM Schema Name (used in JQL filter) |
| `almHost` | ALM server hostname |
| `almUsername` | ALM username |
| `almPassword` | ALM password |
| `domain` | ALM domain |
| `project` | ALM project |
| `dbHost` | SQL DB host (optional) |
| `dbName` | SQL DB name (optional) |
| `dbUsername` | SQL DB username (optional) |
| `dbPassword` | SQL DB password (optional) |

---

## 📁 Project Structure

```
Jira-Alm-Syncer/
├── Jira-ALMGeneric.ps1     # PowerShell sync engine (user-supplied)
├── backend/
│   ├── app.py              # Flask REST API + SSE streaming
│   └── requirements.txt    # Python dependencies
├── src/
│   ├── pages/              # React page components
│   │   ├── UserLogin.tsx   # App-level login (username/password gate)
│   │   ├── Login.tsx       # Jira + ALM + DB config (3-tab form)
│   │   ├── Dashboard.tsx   # Connection summary + param preview
│   │   ├── Sync.tsx        # Sync execution + live console
│   │   ├── History.tsx     # Sync history table + detail drawer
│   │   └── NotFound.tsx
│   ├── services/
│   │   └── api.ts          # API service layer
│   ├── hooks/
│   │   └── useConsole.ts   # SSE streaming hook
│   ├── components/
│   │   ├── AppLayout.tsx   # Collapsible sidebar
│   │   ├── ExecutionConsole.tsx
│   │   └── Field.tsx
│   └── contexts/
│       ├── AuthContext.tsx      # Jira/ALM session
│       └── UserAuthContext.tsx  # App-level user session
├── start.bat               # Windows launcher — installs deps + starts backend
├── package.json
├── vercel.json
└── README.md
```

---

## 🔐 Authentication Flow

```
Step 1 — App Login (UserLogin.tsx)
  Enter username + password (app-level gate)
  Credentials: admin / Admin@123  |  demo / Demo@123

Step 2 — ALM Config (Login.tsx — 3 tabs)
  Tab 1: Jira URL + Token + Schema
  Tab 2: ALM Host + Username + Password + Domain + Project
  Tab 3: SQL DB Host + Name + Username + Password (optional)

Step 3 — Sync Execution (Sync.tsx)
  All 12 params passed to Jira-ALMGeneric.ps1
  Real-time output streamed via SSE → Execution Console
```

---

## 📊 Demo Mode Simulation

When the backend is offline, Demo mode simulates a full 12-step sync:

```
✓ Authenticating with Jira...
✓ Fetching issues via JQL filter...
✓ Found 12 Jira issues to process
✓ Authenticating with ALM...
✓ Processing DEMO-001 → CREATE requirement
✓ Processing DEMO-002 → UPDATE requirement
✓ Processing DEMO-003 → JIRA UPDATE
... (12 steps total)
✓ Sync complete — Created: 3 | Updated: 3 | Blocked: 1 | Duration: 0h 0m 18s
```

---

## 👨‍💻 Author

**Pongowtham Kumar S**
RPA Developer | Automation & ALM Integration Engineer

- 4+ years experience at Infosys
- 20+ production bots deployed
- ALM v16 → v24 upgrade specialist
- 4 GitHub automation repositories

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077b5?style=flat&logo=linkedin)](https://linkedin.com/in/pongowthamkumar)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-333?style=flat&logo=github)](https://github.com/pongowthamkumar4209-svg)

---

## 📄 License

This project is for portfolio and demonstration purposes.

---

<div align="center">
  <strong>⭐ Star this repo if you found it useful!</strong>
</div>
