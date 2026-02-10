import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings, Server, Database, Globe, Lock } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integration Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage connection parameters for JIRA, ALM, and database services. These values are injected as environment variables during script execution.
        </p>
      </div>

      <Card className="enterprise-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="w-4 h-4" />
            JIRA Connection
          </CardTitle>
          <p className="text-xs text-muted-foreground">REST API endpoint for fetching requirements and dashboard data</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">JIRA Base URL</Label>
            <Input placeholder="https://jira.domain.com" disabled className="text-sm" />
          </div>
        </CardContent>
      </Card>

      <Card className="enterprise-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Server className="w-4 h-4" />
            ALM Connection
          </CardTitle>
          <p className="text-xs text-muted-foreground">Micro Focus ALM host used by the PowerShell script for requirement creation and updates</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">ALM Host</Label>
            <Input placeholder="mfalm.domain.com" disabled className="text-sm" />
          </div>
        </CardContent>
      </Card>

      <Card className="enterprise-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="w-4 h-4" />
            Database Connection
          </CardTitle>
          <p className="text-xs text-muted-foreground">SQL Server instance where sync logs and execution metadata are stored</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">DB Host</Label>
              <Input placeholder="db-server.domain.com" disabled className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">DB Name</Label>
              <Input placeholder="SyncDB" disabled className="text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
        <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          Connection parameters will be configurable when backend integration is implemented. Credentials are managed via environment variables and are never stored in application code.
        </span>
      </div>
    </div>
  );
};

export default SettingsPage;
