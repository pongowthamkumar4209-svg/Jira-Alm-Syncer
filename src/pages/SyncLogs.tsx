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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { getSyncLogs, getExecutions } from "@/stores/syncStore";
import { SyncLogEntry } from "@/types/sync";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const SyncLogs = () => {
  const logs = getSyncLogs();
  const executions = getExecutions();
  const [schemaFilter, setSchemaFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [execFilter, setExecFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<SyncLogEntry | null>(null);

  const schemas = useMemo(() => [...new Set(logs.map((l) => l.almSchema))], [logs]);
  const syncTypes = useMemo(() => [...new Set(logs.map((l) => l.syncType))], [logs]);
  const execIds = useMemo(() => [...new Set(executions.map((e) => e.id))], [executions]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (schemaFilter !== "all" && l.almSchema !== schemaFilter) return false;
      if (typeFilter !== "all" && l.syncType !== typeFilter) return false;
      if (dateFilter && !l.dateTime.startsWith(dateFilter)) return false;
      if (execFilter !== "all" && l.executionId !== execFilter) return false;
      return true;
    });
  }, [logs, schemaFilter, typeFilter, dateFilter, execFilter]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Sync Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed synchronization history from the SQL Server log table. Click any row to view full details.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Execution ID</Label>
          <Select value={execFilter} onValueChange={setExecFilter}>
            <SelectTrigger className="w-52 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Executions</SelectItem>
              {execIds.map((id) => (
                <SelectItem key={id} value={id}>{id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Exec ID</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">JIRA Key</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">ALM Req ID</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Sync Type</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Result</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Schema</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Req Name</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Trace</th>
                  <th className="px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Release</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-muted-foreground">
                      No log entries match the current filters.
                    </td>
                  </tr>
                )}
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{log.dateTime}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs text-muted-foreground">{log.executionId || "—"}</td>
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
                      }`}>{log.result}</span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{log.almSchema}</td>
                    <td className="px-3 py-2.5 max-w-[160px] truncate" title={log.requirementName}>{log.requirementName}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{log.status}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{log.traceStatus}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{log.plannedRelease}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Drill-Down Drawer */}
      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedLog?.result === "Success"
                ? <CheckCircle2 className="w-5 h-5 text-success" />
                : <XCircle className="w-5 h-5 text-destructive" />}
              {selectedLog?.jiraIssueKey}
            </SheetTitle>
          </SheetHeader>
          {selectedLog && (
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Requirement Details</h3>
                <div className="space-y-2">
                  <DetailRow label="Requirement Name" value={selectedLog.requirementName} />
                  <DetailRow label="Requirement Type" value={selectedLog.requirementType} />
                  <DetailRow label="ALM Requirement ID" value={selectedLog.almRequirementID || "—"} />
                  <DetailRow label="ALM Schema" value={selectedLog.almSchema} />
                  <DetailRow label="Status" value={selectedLog.status} />
                  <DetailRow label="OTIT Project" value={selectedLog.otitProject} />
                  <DetailRow label="Planned Release" value={selectedLog.plannedRelease} />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sync Execution</h3>
                <div className="space-y-2">
                  <DetailRow label="Timestamp" value={selectedLog.dateTime} />
                  <DetailRow label="Execution ID" value={selectedLog.executionId || "—"} mono />
                  <DetailRow label="Sync Type" value={selectedLog.syncType} />
                  <DetailRow label="Result" value={selectedLog.result} highlight={selectedLog.result === "Success" ? "success" : "destructive"} />
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Traceability</h3>
                <div className="space-y-2">
                  <DetailRow label="Parent RTM ID" value={selectedLog.parentRTMID || "—"} />
                  <DetailRow label="Trace Status" value={selectedLog.traceStatus} />
                </div>
              </div>
              {(selectedLog.warnings || selectedLog.scriptErrors) && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Diagnostics</h3>
                    {selectedLog.warnings && (
                      <div className="flex items-start gap-2 p-2.5 rounded bg-warning/10 text-warning text-xs mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{selectedLog.warnings}</span>
                      </div>
                    )}
                    {selectedLog.scriptErrors && (
                      <div className="flex items-start gap-2 p-2.5 rounded bg-destructive/10 text-destructive text-xs">
                        <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{selectedLog.scriptErrors}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const DetailRow = ({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: "success" | "destructive" }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-medium ${mono ? "font-mono text-xs" : ""} ${
      highlight === "success" ? "text-success" : highlight === "destructive" ? "text-destructive" : ""
    }`}>{value}</span>
  </div>
);

export default SyncLogs;
