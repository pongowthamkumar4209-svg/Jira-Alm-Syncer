import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMappings, getSyncLogs } from "@/stores/syncStore";
import {
  FolderSync,
  CheckCircle2,
  AlertTriangle,
  Activity,
} from "lucide-react";

const Dashboard = () => {
  const mappings = getMappings();
  const logs = getSyncLogs();
  const successCount = logs.filter((l) => l.result === "Success").length;
  const failCount = logs.filter((l) => l.result !== "Success").length;

  const stats = [
    {
      label: "Project Mappings",
      value: mappings.length,
      icon: FolderSync,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total Syncs",
      value: logs.length,
      icon: Activity,
      color: "text-muted-foreground",
      bg: "bg-muted",
    },
    {
      label: "Successful",
      value: successCount,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Failed / Blocked",
      value: failCount,
      icon: AlertTriangle,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          JIRA–ALM synchronization overview
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="enterprise-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Logs */}
      <Card className="enterprise-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Sync Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Time</th>
                  <th className="pb-2 font-medium text-muted-foreground">JIRA Key</th>
                  <th className="pb-2 font-medium text-muted-foreground">Type</th>
                  <th className="pb-2 font-medium text-muted-foreground">Schema</th>
                  <th className="pb-2 font-medium text-muted-foreground">Result</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 5).map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="py-2.5 text-muted-foreground">{log.dateTime}</td>
                    <td className="py-2.5 font-medium">{log.jiraIssueKey}</td>
                    <td className="py-2.5">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                        {log.syncType}
                      </span>
                    </td>
                    <td className="py-2.5 text-muted-foreground">{log.almSchema}</td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          log.result === "Success"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
