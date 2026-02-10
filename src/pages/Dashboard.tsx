import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getMappings, getSyncLogs, getExecutions } from "@/stores/syncStore";
import { useAuth } from "@/contexts/AuthContext";
import {
  FolderSync, CheckCircle2, AlertTriangle, Activity,
  Wifi, Database, Server, Clock, ArrowRight,
} from "lucide-react";

const Dashboard = () => {
  const { username } = useAuth();
  const mappings = getMappings();
  const logs = getSyncLogs();
  const executions = getExecutions();
  const successCount = logs.filter((l) => l.result === "Success").length;
  const failCount = logs.filter((l) => l.result !== "Success").length;

  const stats = [
    { label: "Project Mappings", value: mappings.length, icon: FolderSync, color: "text-primary", bg: "bg-primary/10" },
    { label: "Total Sync Records", value: logs.length, icon: Activity, color: "text-muted-foreground", bg: "bg-muted" },
    { label: "Successful", value: successCount, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "Failed / Blocked", value: failCount, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
  ];

  const systemChecks = [
    { label: "JIRA REST API", status: "reachable", icon: Wifi },
    { label: "ALM Service Endpoint", status: "reachable", icon: Server },
    { label: "SQL Server (Logs DB)", status: "reachable", icon: Database },
  ];

  const lastExec = executions[0];

  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Operations Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          JIRA–ALM synchronization overview — Welcome back, <span className="font-medium text-foreground">{username}</span>
        </p>
      </div>

      {/* Overview Section */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="enterprise-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5">{s.value}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <Card className="enterprise-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">System Health</CardTitle>
            <p className="text-xs text-muted-foreground">Connectivity status of integrated services (simulated)</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemChecks.map((check) => (
              <div key={check.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <check.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{check.label}</span>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Reachable
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Last Execution */}
        <Card className="enterprise-shadow lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Last Execution</CardTitle>
            <p className="text-xs text-muted-foreground">Most recent synchronization run details</p>
          </CardHeader>
          <CardContent>
            {lastExec ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Execution ID</p>
                    <p className="font-mono text-xs font-medium">{lastExec.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Triggered By</p>
                    <p className="font-medium">{lastExec.triggeredBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Started</p>
                    <p className="font-medium">{lastExec.startTime.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className={`font-medium ${
                      lastExec.overallStatus === "completed" ? "text-success" :
                      lastExec.overallStatus === "failed" ? "text-destructive" :
                      "text-warning"
                    }`}>{lastExec.overallStatus === "partial" ? "Partial Success" : lastExec.overallStatus.charAt(0).toUpperCase() + lastExec.overallStatus.slice(1)}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  {lastExec.statuses.map((s) => (
                    <div key={s.mappingId} className="flex items-center justify-between text-sm">
                      <span>{s.jiraProject} <ArrowRight className="w-3 h-3 inline text-muted-foreground mx-1" /> {s.almSchema}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        s.status === "completed" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      }`}>{s.status === "completed" ? "Completed" : "Failed"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No executions recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Activity</h2>
        <Card className="enterprise-shadow">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">Time</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">JIRA Key</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">Schema</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">Requirement</th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 5).map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{log.dateTime}</td>
                      <td className="px-4 py-2.5 font-medium whitespace-nowrap">{log.jiraIssueKey}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">{log.syncType}</span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{log.almSchema}</td>
                      <td className="px-4 py-2.5 max-w-[160px] truncate" title={log.requirementName}>{log.requirementName}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          log.result === "Success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        }`}>{log.result}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
