"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ResourceField = { key: string; label: string; type?: "text" | "number" | "date" | "datetime-local" | "textarea" | "boolean" | "select" | "image"; required?: boolean; options?: string[]; folder?: string; objectKeyField?: string };

export function ResourceManager({ title, resource, fields }: { title: string; resource: string; fields: ResourceField[] }) {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [record, setRecord] = useState<Record<string, any> | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const blank = useMemo(() => Object.fromEntries(fields.map((field) => [field.key, field.type === "boolean" ? true : ""])), [fields]);

  async function load() {
    setLoading(true);
    const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
    const response = await fetch(`/api/admin/resources/${resource}`, { headers: session ? { Authorization: `Bearer ${session.access_token}` } : {} });
    const result = await response.json();
    if (response.ok) setRows(result.data ?? []); else setError(result.error ?? "Unable to load records");
    setLoading(false);
  }
  useEffect(() => { load(); }, [resource]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(fields.map((field) => [field.key, field.type === "boolean" ? form.get(field.key) === "on" : form.get(field.key) || null]));

    for (const field of fields.filter((item) => item.type === "image")) {
      const file = form.get(`${field.key}_file`);
      if (!(file instanceof File) || file.size === 0) continue;
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: field.folder ?? resource, contentType: file.type, fileName: file.name }),
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) { setError(uploadResult.error ?? "Unable to prepare image upload"); setSaving(false); return; }
      const { uploadUrl, objectKey, imageUrl } = uploadResult.data;
      const putResponse = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!putResponse.ok) { setError("Unable to upload image to Cloudflare R2"); setSaving(false); return; }
      values[field.key] = imageUrl;
      if (field.objectKeyField) values[field.objectKeyField] = objectKey;
    }
    const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
    const response = await fetch(`/api/admin/resources/${resource}`, { method: record?.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) }, body: JSON.stringify(record?.id ? { id: record.id, ...values } : values) });
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? "Unable to save record"); setSaving(false); return; }
    setOpen(false); setSaving(false); await load();
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
    const response = await fetch(`/api/admin/resources/${resource}`, { method: "DELETE", headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) }, body: JSON.stringify({ id }) });
    if (!response.ok) { const result = await response.json(); setError(result.error ?? "Unable to delete record"); return; }
    await load();
  }
  return <div className="space-y-6"><div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-muted-foreground">Create, edit, and remove records stored in Supabase.</p></div><Button onClick={() => { setRecord(blank); setError(""); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add</Button></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Card><CardContent className="p-0 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left">{fields.slice(0, 4).map((field) => <th key={field.key} className="px-4 py-3 font-medium">{field.label}</th>)}<th className="px-4 py-3" /></tr></thead><tbody>{loading ? <tr><td className="px-4 py-8 text-muted-foreground" colSpan={5}>Loading…</td></tr> : rows.length === 0 ? <tr><td className="px-4 py-8 text-muted-foreground" colSpan={5}>No records yet.</td></tr> : rows.map((row) => <tr key={row.id} className="border-b last:border-0">{fields.slice(0, 4).map((field) => <td key={field.key} className="px-4 py-3">{field.type === "boolean" ? (row[field.key] ? "Yes" : "No") : String(row[field.key] ?? "—")}</td>)}<td className="px-4 py-3 text-right whitespace-nowrap"><Button variant="ghost" size="icon" aria-label={`Edit ${row.id}`} onClick={() => { setRecord(row); setError(""); setOpen(true); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${row.id}`} className="text-destructive" onClick={() => remove(row.id)}><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody></table></CardContent></Card><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{record?.id ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`}</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="space-y-4 py-2">{fields.map((field) => <div key={field.key} className="space-y-1.5"><Label htmlFor={field.key}>{field.label}</Label>{field.type === "textarea" ? <Textarea id={field.key} name={field.key} defaultValue={record?.[field.key] ?? ""} required={field.required} /> : field.type === "image" ? <div className="space-y-2"><Input id={field.key} name={`${field.key}_file`} type="file" accept="image/*" required={field.required && !record?.[field.key]} />{record?.[field.key] && <a href={record[field.key]} target="_blank" rel="noreferrer" className="block truncate text-xs text-primary underline">Current image</a>}<Input name={field.key} type="hidden" defaultValue={record?.[field.key] ?? ""} /></div> : field.type === "boolean" ? <input id={field.key} name={field.key} type="checkbox" defaultChecked={Boolean(record?.[field.key])} className="h-4 w-4" /> : field.type === "select" ? <select id={field.key} name={field.key} defaultValue={record?.[field.key] ?? ""} className="h-10 w-full rounded-md border bg-background px-3" required={field.required}>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <Input id={field.key} name={field.key} type={field.type ?? "text"} defaultValue={record?.[field.key] ?? ""} required={field.required} />}</div>)}</div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button></DialogFooter></form></DialogContent></Dialog></div>;
}
