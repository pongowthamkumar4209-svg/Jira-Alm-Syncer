import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getMappings, generateExecutionId, addExecution, updateMappingLastSync } from "@/stores/syncStore";
import { SyncStatus, SyncExecution, DryRunResult } from "@/types/sync";
import { useAuth } from "@/contexts/AuthContext";
import {
  Play, Loader2, CheckCircle2, XCircle, Clock, Eye, Hash,
  User, Timer, ArrowRight, AlertTriangle, FileText,
} from "lucide-react";

const statusIcon: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-muted-foreground" />,
  running: <Loader2 className="w-4 h-4 text-primary animate-spin" />,
  completed: <CheckCircle2 className="w-4 h-4 text-success" />,
  failed: <XCircle className="w-4 h-4 text-destructive" />,
};

const statusLabel: Record<string, string> = {
  pending: "Pending",
  running: "Running…",
  completed: "Completed",
  failed: "Failed",
};

const RunSync = () => {
  const { username } = useAuth();
  const [statuses, setStatuses] = useState<SyncStatus[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [overallStatus, setOverallStatus] = useState<string | null>(null);
  const [dryRunResults, setDryRunResults] = useState<DryRunResult[] | null>(null);
  const [isDryRunning, setIsDryRunning] = useState(false);

  const mappings = getMappings();

  const runDryRun = async () => {
    setIsDryRunning(true);
    setDryRunResults(null);
    await new Promise((r) => setTimeout(r, 1200));
    const results: DryRunResult[] = mappings.map((m) => ({
      mappingId: m.id,
      jiraProject: m.jiraProject,
      almSchema: m.almSchema,
      expectedCreate: Math.floor(Math.random() * 8) + 1,
      expectedUpdate: Math.floor(Math.random() * 12) + 2,
      expectedBlock: Math.floor(Math.random() * 3),
    }));
    setDryRunResults(results);
    setIsDryRunning(false);
  };

  const runSync = async () => {
    if (mappings.length === 0) return;

    const execId = generateExecutionId();
    const start = new Date();
    setExecutionId(execId);
    setStartTime(start);
    setOverallStatus("running");
    setIsRunning(true);
    setDryRunResults(null);

    const initial: SyncStatus[] = mappings.map((m) => ({
      mappingId: m.id,
      jiraProject: m.jiraProject,
      almSchema: m.almSchema,
      status: "pending",
      progress: 0,
    }));
    setStatuses(initial);

    const finalStatuses: SyncStatus[] = [...initial];

    for (let i = 0; i < mappings.length; i++) {
      setStatuses((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, status: "running", startedAt: new Date(), progress: 10 } : s
        )
      );

      // Simulate progress
      for (let p = 20; p <= 80; p += 20) {
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
        setStatuses((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, progress: p } : s))
        );
      }

      await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));

      const success = Math.random() > 0.15;
      const finalStatus: SyncStatus = {
        ...initial[i],
        status: success ? "completed" : "failed",
        progress: 100,
        completedAt: new Date(),
        startedAt: finalStatuses[i].startedAt,
        error: success ? undefined : "Script execution error: HTTP 403 — ALM rejected request",
      };
      finalStatuses[i] = finalStatus;

      updateMappingLastSync(mappings[i].id, success ? "Success" : "Failed");

      setStatuses((prev) =>
        prev.map((s, idx) => (idx === i ? finalStatus : s))
      );
    }

    const hasFail = finalStatuses.some((s) => s.status === "failed");
    const allFail = finalStatuses.every((s) => s.status === "failed");
    const status = allFail ? "failed" : hasFail ? "partial" : "completed";
    setOverallStatus(status);

    addExecution({
      id: execId,
      triggeredBy: username,
      startTime: start,
      endTime: new Date(),
      overallStatus: status,
      statuses: finalStatuses,
    });

    setIsRunning(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Execute Synchronization</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Orchestrate JIRA → ALM requirement synchronization across all configured schemas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runDryRun} disabled={isRunning || isDryRunning || mappings.length === 0}>
            {isDryRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
            Dry Run
          </Button>
          <Button onClick={runSync} disabled={isRunning || mappings.length === 0} size="lg">
            {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            {isRunning ? "Executing…" : "Execute Sync"}
          </Button>
        </div>
      </div>

      {/* Pre-Run Summary */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pre-Run Summary</h2>
        <Card className="enterprise-shadow">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">JIRA Dashboard</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">ALM Schema</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Last Sync</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Last Result</th>
                </tr>
              </thead>
              <tbody>
                {mappings.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-muted-foreground">No project mappings configured.</td></tr>
                ) : mappings.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5 font-medium">{m.jiraProject}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{m.almSchema}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{m.lastSyncTime || "Never"}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        m.lastResult === "Success" ? "bg-success/10 text-success" :
                        m.lastResult === "Failed" ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-muted-foreground"
                      }`}>{m.lastResult || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Dry Run Results */}
      {dryRunResults && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dry Run Results — Expected Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dryRunResults.map((dr) => (
              <Card key={dr.mappingId} className="enterprise-shadow">
                <CardContent className="p-4">
                  <p className="font-medium text-sm mb-2">{dr.jiraProject} <span className="text-muted-foreground font-normal">→ {dr.almSchema}</span></p>
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1 text-success"><CheckCircle2 className="w-3 h-3" /> {dr.expectedCreate} CREATE</span>
                    <span className="flex items-center gap-1 text-primary"><ArrowRight className="w-3 h-3" /> {dr.expectedUpdate} UPDATE</span>
                    <span className="flex items-center gap-1 text-warning"><AlertTriangle className="w-3 h-3" /> {dr.expectedBlock} BLOCK</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Execution Context */}
      {executionId && (
        <>
          <Separator />
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Execution Context</h2>
            <Card className="enterprise-shadow">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Execution ID</p>
                      <p className="font-mono font-medium text-xs">{executionId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Triggered By</p>
                      <p className="font-medium">{username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Started</p>
                      <p className="font-medium">{startTime?.toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Overall Status</p>
                      <p className={`font-medium ${
                        overallStatus === "completed" ? "text-success" :
                        overallStatus === "failed" ? "text-destructive" :
                        overallStatus === "partial" ? "text-warning" : "text-primary"
                      }`}>{overallStatus === "partial" ? "Partial Success" : overallStatus?.charAt(0).toUpperCase() + overallStatus!.slice(1)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Per-Schema Progress */}
      {statuses.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Schema Execution Status</h2>
          <div className="space-y-3">
            {statuses.map((s) => (
              <Card key={s.mappingId} className="enterprise-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {statusIcon[s.status]}
                      <div>
                        <p className="font-medium text-sm">{s.jiraProject}</p>
                        <p className="text-xs text-muted-foreground">Schema: {s.almSchema}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      s.status === "completed" ? "bg-success/10 text-success" :
                      s.status === "failed" ? "bg-destructive/10 text-destructive" :
                      s.status === "running" ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>{statusLabel[s.status]}</span>
                  </div>
                  <Progress value={s.progress || 0} className="h-2" />
                  {s.error && <p className="text-xs text-destructive mt-2">{s.error}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {statuses.length === 0 && !dryRunResults && (
        <Card className="enterprise-shadow">
          <CardContent className="py-10 text-center">
            <Play className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Review the pre-run summary above, then click <strong>Execute Sync</strong> to begin synchronization.
            </p>
            <p className="text-xs text-muted-foreground mt-1">Use <strong>Dry Run</strong> to preview expected actions without modifying data.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RunSync;
