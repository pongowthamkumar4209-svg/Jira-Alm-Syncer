import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMappings } from "@/stores/syncStore";
import { SyncStatus } from "@/types/sync";
import { Play, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

const statusIcon = {
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
  const [statuses, setStatuses] = useState<SyncStatus[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runSync = async () => {
    const mappings = getMappings();
    if (mappings.length === 0) return;

    setIsRunning(true);

    // Initialize all as pending
    const initial: SyncStatus[] = mappings.map((m) => ({
      mappingId: m.id,
      jiraProject: m.jiraProject,
      almSchema: m.almSchema,
      status: "pending",
    }));
    setStatuses(initial);

    // Simulate sequential execution per schema
    for (let i = 0; i < mappings.length; i++) {
      // Set current to running
      setStatuses((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, status: "running", startedAt: new Date() } : s
        )
      );

      // Simulate script execution (1.5-3s)
      await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500));

      // Random success/failure (90% success)
      const success = Math.random() > 0.1;
      setStatuses((prev) =>
        prev.map((s, idx) =>
          idx === i
            ? {
                ...s,
                status: success ? "completed" : "failed",
                completedAt: new Date(),
                error: success ? undefined : "Script execution error: HTTP 403",
              }
            : s
        )
      );
    }

    setIsRunning(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Run Sync</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Execute JIRA → ALM synchronization across all configured projects
          </p>
        </div>
        <Button onClick={runSync} disabled={isRunning} size="lg">
          {isRunning ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          {isRunning ? "Syncing…" : "Run JIRA → ALM Sync"}
        </Button>
      </div>

      {statuses.length === 0 ? (
        <Card className="enterprise-shadow">
          <CardContent className="py-12 text-center">
            <Play className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Click "Run JIRA → ALM Sync" to start synchronization for all configured project mappings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {statuses.map((s) => (
            <Card key={s.mappingId} className="enterprise-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusIcon[s.status]}
                    <div>
                      <p className="font-medium text-sm">{s.jiraProject}</p>
                      <p className="text-xs text-muted-foreground">
                        Schema: {s.almSchema}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        s.status === "completed"
                          ? "bg-success/10 text-success"
                          : s.status === "failed"
                          ? "bg-destructive/10 text-destructive"
                          : s.status === "running"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {statusLabel[s.status]}
                    </span>
                  </div>
                </div>
                {s.error && (
                  <p className="text-xs text-destructive mt-2 pl-7">{s.error}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RunSync;
