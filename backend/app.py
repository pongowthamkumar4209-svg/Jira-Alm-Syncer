from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import subprocess
import json
import os
import sys
import re

app = Flask(__name__)

# Allow requests from both local dev and Vercel deployed frontend
CORS(app, origins=[
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "https://*.vercel.app",
    "*"  # Remove this in production and list exact origins
])

# Path to your PowerShell script — update this to where your .ps1 file lives
PS1_SCRIPT_PATH = os.path.join(os.path.dirname(__file__), "..", "Jira-ALMGeneric.ps1")


def find_powershell():
    """Find PowerShell executable on Windows."""
    candidates = [
        "pwsh.exe",          # PowerShell 7+
        "powershell.exe",    # Windows PowerShell 5.1
    ]
    for exe in candidates:
        try:
            result = subprocess.run([exe, "-Command", "echo ok"],
                                    capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                return exe
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    return None


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint — frontend uses this to verify backend is running."""
    ps = find_powershell()
    script_exists = os.path.isfile(PS1_SCRIPT_PATH)
    return jsonify({
        "status": "ok",
        "powershell": ps or "not found",
        "script_path": os.path.abspath(PS1_SCRIPT_PATH),
        "script_exists": script_exists
    })


@app.route("/api/sync", methods=["POST"])
def sync():
    """
    Accepts JSON body with all PowerShell script parameters.
    Streams stdout line-by-line back as Server-Sent Events (SSE).
    The frontend reads each event and appends to the console.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON body received"}), 400

    # Validate required fields
    required = ["schema", "jiraUrl", "jiraToken", "almHost",
                "almUsername", "almPassword", "almDomain", "almProject"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    ps_exe = find_powershell()
    if not ps_exe:
        return jsonify({"error": "PowerShell not found on this machine."}), 500

    script_path = os.path.abspath(PS1_SCRIPT_PATH)
    if not os.path.isfile(script_path):
        return jsonify({
            "error": f"Script not found at: {script_path}. "
                     f"Please place Jira-ALMGeneric.ps1 next to the backend folder."
        }), 500

    # Build PowerShell argument list — maps directly to the param() block in the .ps1
    ps_args = [
        ps_exe,
        "-ExecutionPolicy", "Bypass",
        "-NonInteractive",
        "-File", script_path,
        "-SSchema",      data["schema"],
        "-Ttoken",       data["jiraToken"],
        "-AAlmusername", data["almUsername"],
        "-AAlmpassword", data["almPassword"],
        "-DDomain",      data["almDomain"],
        "-PProject",     data["almProject"],
        "-jiraUrl",      data["jiraUrl"],
        "-almHost",      data["almHost"],
    ]

    # Optional DB params — only add if provided
    if data.get("dbHost"):
        ps_args += ["-DB_Host", data["dbHost"]]
    if data.get("dbName"):
        ps_args += ["-DB_Name", data["dbName"]]
    if data.get("dbUsername"):
        ps_args += ["-DBUserName", data["dbUsername"]]
    if data.get("dbPassword"):
        ps_args += ["-DBPassword", data["dbPassword"]]

    def generate():
        """Stream PowerShell output as Server-Sent Events."""
        process = None
        try:
            process = subprocess.Popen(
                ps_args,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,   # Merge stderr into stdout
                text=True,
                encoding="utf-8",
                errors="replace",
                bufsize=1,                  # Line-buffered
                cwd=os.path.dirname(script_path)
            )

            yield _sse_event("start", {"message": "PowerShell process started"})

            for line in process.stdout:
                line = line.rstrip("\n\r")
                if not line.strip():
                    continue

                # Determine log type from line content
                log_type = classify_line(line)

                yield _sse_event("log", {"type": log_type, "message": line})

            process.wait()
            exit_code = process.returncode

            if exit_code == 0:
                # Try to parse the final JSON output from the script
                yield _sse_event("done", {
                    "exitCode": exit_code,
                    "message": "Sync completed successfully"
                })
            else:
                yield _sse_event("done", {
                    "exitCode": exit_code,
                    "message": f"Script exited with code {exit_code}"
                })

        except Exception as e:
            yield _sse_event("error", {"message": str(e)})
        finally:
            if process and process.poll() is None:
                process.kill()

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


def _sse_event(event_type: str, data: dict) -> str:
    """Format a Server-Sent Event string."""
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


def classify_line(line: str) -> str:
    """
    Classify a PowerShell output line into a log type
    so the UI can colour it correctly.
    """
    line_lower = line.lower()

    # Errors
    if any(x in line_lower for x in [
        "error", "exception", "failed", "failure",
        "block create", "block update", "block unknown",
        "cannot", "not found", "unauthorized", "access denied"
    ]):
        return "error"

    # Warnings
    if any(x in line_lower for x in [
        "warning", "warn", "orphan", "mismatch",
        "truncated", "tbd", "substituted"
    ]):
        return "warning"

    # Success
    if any(x in line_lower for x in [
        "success", "created", "updated", "complete",
        "authenticated", "established", "done", "jira update"
    ]):
        return "success"

    # Default info
    return "info"


if __name__ == "__main__":
    print("=" * 55)
    print("  ALM OPS — Jira-ALM Sync Backend")
    print("  Running on http://localhost:5000")
    print("=" * 55)

    ps = find_powershell()
    script_path = os.path.abspath(PS1_SCRIPT_PATH)

    print(f"\n  PowerShell  : {ps or 'NOT FOUND'}")
    print(f"  Script path : {script_path}")
    print(f"  Script found: {'YES' if os.path.isfile(script_path) else 'NO — place Jira-ALMGeneric.ps1 one folder up'}")
    print("\n  Ready. Press Ctrl+C to stop.\n")

    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
