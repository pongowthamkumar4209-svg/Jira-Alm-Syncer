import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getMappings,
  addMapping,
  updateMapping,
  removeMapping,
} from "@/stores/syncStore";
import { ProjectMapping as PM } from "@/types/sync";
import { Plus, Pencil, Trash2 } from "lucide-react";

const emptyForm = { jiraProject: "", almSchema: "", almDomain: "", almProject: "" };

const ProjectMapping = () => {
  const [mappings, setMappings] = useState(getMappings);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = () => setMappings(getMappings());

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (m: PM) => {
    setEditId(m.id);
    setForm({
      jiraProject: m.jiraProject,
      almSchema: m.almSchema,
      almDomain: m.almDomain,
      almProject: m.almProject,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.jiraProject || !form.almSchema) return;
    if (editId) {
      updateMapping(editId, form);
    } else {
      addMapping(form);
    }
    refresh();
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    removeMapping(id);
    refresh();
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Project Mapping</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure JIRA to ALM project mappings
          </p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Mapping
        </Button>
      </div>

      <Card className="enterprise-shadow">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">JIRA Project</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">ALM Schema</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">ALM Domain</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">ALM Project</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mappings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No mappings configured. Click "Add Mapping" to get started.
                    </td>
                  </tr>
                )}
                {mappings.map((m) => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{m.jiraProject}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.almSchema}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.almDomain}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.almProject}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit" : "Add"} Project Mapping</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>JIRA Project / Dashboard Name</Label>
              <Input value={form.jiraProject} onChange={(e) => setForm({ ...form, jiraProject: e.target.value })} placeholder="e.g. INFRA Dashboard" />
            </div>
            <div className="space-y-2">
              <Label>ALM Schema ($SSchema)</Label>
              <Input value={form.almSchema} onChange={(e) => setForm({ ...form, almSchema: e.target.value })} placeholder="e.g. INFRA_SCHEMA" />
            </div>
            <div className="space-y-2">
              <Label>ALM Domain</Label>
              <Input value={form.almDomain} onChange={(e) => setForm({ ...form, almDomain: e.target.value })} placeholder="e.g. INFRASTRUCTURE" />
            </div>
            <div className="space-y-2">
              <Label>ALM Project</Label>
              <Input value={form.almProject} onChange={(e) => setForm({ ...form, almProject: e.target.value })} placeholder="e.g. Infra_Requirements" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editId ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectMapping;
