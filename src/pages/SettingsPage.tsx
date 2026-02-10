import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configuration placeholders for backend connectivity
        </p>
      </div>

      <Card className="enterprise-shadow">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Connection Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>JIRA Base URL</Label>
              <Input placeholder="https://jira.domain.com" disabled />
            </div>
            <div className="space-y-2">
              <Label>ALM Host</Label>
              <Input placeholder="mfalm.domain.com" disabled />
            </div>
            <div className="space-y-2">
              <Label>DB Host</Label>
              <Input placeholder="db-server.domain.com" disabled />
            </div>
            <div className="space-y-2">
              <Label>DB Name</Label>
              <Input placeholder="SyncDB" disabled />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            These settings will be configurable when backend integration is implemented.
            Credentials are managed via environment variables — never hardcoded.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
