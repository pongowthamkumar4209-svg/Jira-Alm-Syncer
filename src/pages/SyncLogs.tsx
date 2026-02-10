import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSyncLogs } from "@/stores/syncStore";

const SyncLogs = () => {
  const logs = getSyncLogs();
  const [schemaFilter, setSchemaFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const schemas = useMemo(() => [...new Set(logs.map((l) => l.almSchema))], [logs]);
  const syncTypes = useMemo(() => [...new Set(logs.map((l) => l.syncType))], [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (schemaFilter !== "all" && l.almSchema !== schemaFilter) return false;
      if (typeFilter !== "all" && l.syncType !== typeFilter) return false;
      if (dateFilter && !l.dateTime.startsWith(dateFilter)) return false;
      return true;
    });
  }, [logs, schemaFilter, typeFilter, dateFilter]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Sync Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View synchronization history from the SQL Server log table
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Schema</Label>
          <Select value={schemaFilter} onValueChange={setSchemaFilter}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schemas</SelectItem>
              {schemas.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Sync Type</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {syncTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-40 h-9 text-sm"
          />
        </div>
      </div>

      <Card className="enterprise-shadow">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">DateTime</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">JIRA Key</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">ALM Req ID</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Sync Type</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Result</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Schema</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Req Name</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Type</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">OTIT Project</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Parent RTM</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Trace</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Warnings</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Errors</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Release</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={15} className="text-center py-8 text-muted-foreground">
                      No log entries match the current filters.
                    </td>
                  </tr>
                )}
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{log.dateTime}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-medium">{log.jiraIssueKey}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{log.almRequirementID || "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                        {log.syncType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.result === "Success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      }`}>
                        {log.result}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{log.almSchema}</td>
                    <td className="px-3 py-2.5 max-w-[180px] truncate" title={log.requirementName}>{log.requirementName}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{log.requirementType}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{log.status}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{log.otitProject}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{log.parentRTMID || "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{log.traceStatus}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-warning">{log.warnings || "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-destructive">{log.scriptErrors || "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{log.plannedRelease}</td>
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

export default SyncLogs;
