import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, Trash2, Edit3, Eye, EyeOff, Plus, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { allEpisodesAdminQuery, type Episode } from "@/lib/episodes";
import { CATEGORIES, formatShortDuration } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — OmniCast" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Episode | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: episodes, refetch } = useQuery({ ...allEpisodesAdminQuery, enabled: !!isAdmin });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
    if (!loading && user && !isAdmin) navigate({ to: "/" });
  }, [user, isAdmin, loading, navigate]);

  if (loading || !user) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="p-8 text-center">Not authorized.</div>;

  const remove = async (id: string) => {
    if (!confirm("Delete this episode?")) return;
    const { error } = await supabase.from("episodes").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); refetch(); }
  };

  const togglePub = async (ep: Episode) => {
    const { error } = await supabase.from("episodes").update({ published: !ep.published }).eq("id", ep.id);
    if (error) toast.error(error.message);
    else { toast.success(ep.published ? "Unpublished" : "Published"); refetch(); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl">
        <header className="px-4 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="h-9 w-9 rounded-full bg-surface flex items-center justify-center hover:bg-surface-2">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Admin</h1>
              <p className="text-xs text-muted-foreground">Manage podcast episodes</p>
            </div>
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-glow">
            <Plus className="h-4 w-4" /> New episode
          </button>
        </header>

        <div className="px-4 space-y-2">
          {episodes?.map((ep) => (
            <div key={ep.id} className="flex items-center gap-3 rounded-xl bg-surface border border-border p-3">
              <div className="h-14 w-14 rounded-md overflow-hidden bg-surface-2 shrink-0">
                {ep.cover_url && <img src={ep.cover_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{ep.title}</p>
                  {!ep.published && <span className="text-[10px] rounded bg-muted px-1.5 py-0.5">DRAFT</span>}
                  {ep.featured && <span className="text-[10px] rounded bg-primary/20 text-primary px-1.5 py-0.5">FEATURED</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{ep.podcast_title} · {ep.category} · {formatShortDuration(ep.duration_seconds)}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => togglePub(ep)} className="h-8 w-8 rounded-md hover:bg-surface-2 flex items-center justify-center" aria-label="Toggle publish">
                  {ep.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => { setEditing(ep); setShowForm(true); }} className="h-8 w-8 rounded-md hover:bg-surface-2 flex items-center justify-center" aria-label="Edit">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button onClick={() => remove(ep.id)} className="h-8 w-8 rounded-md hover:bg-destructive/20 text-destructive flex items-center justify-center" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {episodes && episodes.length === 0 && (
            <p className="text-center text-muted-foreground py-16 text-sm">No episodes yet. Create your first one.</p>
          )}
        </div>
      </div>

      {showForm && (
        <EpisodeForm
          episode={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refetch(); }}
        />
      )}
    </div>
  );
}

function EpisodeForm({ episode, onClose, onSaved }: { episode: Episode | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: episode?.title ?? "",
    podcast_title: episode?.podcast_title ?? "",
    author: episode?.author ?? "",
    description: episode?.description ?? "",
    category: episode?.category ?? CATEGORIES[0],
    cover_url: episode?.cover_url ?? "",
    audio_url: episode?.audio_url ?? "",
    duration_seconds: episode?.duration_seconds ?? 0,
    publish_date: (episode?.publish_date ?? new Date().toISOString()).slice(0, 10),
    published: episode?.published ?? true,
    featured: episode?.featured ?? false,
  });
  const [busy, setBusy] = useState(false);

  const uploadFile = async (bucket: "covers" | "audio", file: File): Promise<string | null> => {
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); return null; }
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    return data?.signedUrl ?? null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.audio_url) { toast.error("Audio URL is required"); return; }
    setBusy(true);
    const payload = {
      ...form,
      duration_seconds: Number(form.duration_seconds) || null,
      publish_date: new Date(form.publish_date).toISOString(),
    };
    const { error } = episode
      ? await supabase.from("episodes").update(payload).eq("id", episode.id)
      : await supabase.from("episodes").insert(payload);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(episode ? "Updated" : "Created"); onSaved(); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface border border-border shadow-card my-8">
        <header className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold">{episode ? "Edit episode" : "New episode"}</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-surface-2 flex items-center justify-center"><X className="h-4 w-4" /></button>
        </header>
        <form onSubmit={submit} className="p-4 space-y-3">
          <Field label="Episode title">
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
          </Field>
          <Field label="Podcast title">
            <input required value={form.podcast_title} onChange={(e) => setForm({ ...form, podcast_title: e.target.value })} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Author"><input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="input" /></Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input resize-none" />
          </Field>
          <Field label="Cover image">
            <div className="flex gap-2">
              <input placeholder="https://... or upload" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} className="input flex-1" />
              <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-surface-2 border border-border px-3 text-xs font-semibold hover:bg-accent">
                <Upload className="h-3.5 w-3.5" /> Upload
                <input type="file" accept="image/*" hidden onChange={async (e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  const url = await uploadFile("covers", f);
                  if (url) setForm((s) => ({ ...s, cover_url: url }));
                }} />
              </label>
            </div>
            {form.cover_url && <img src={form.cover_url} alt="" className="mt-2 h-20 w-20 rounded-md object-cover" />}
          </Field>
          <Field label="Audio file">
            <div className="flex gap-2">
              <input required placeholder="https://... or upload" value={form.audio_url} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} className="input flex-1" />
              <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-surface-2 border border-border px-3 text-xs font-semibold hover:bg-accent">
                <Upload className="h-3.5 w-3.5" /> Upload
                <input type="file" accept="audio/*" hidden onChange={async (e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  toast.info("Uploading audio…");
                  const url = await uploadFile("audio", f);
                  if (url) { setForm((s) => ({ ...s, audio_url: url })); toast.success("Audio uploaded"); }
                }} />
              </label>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration (seconds)">
              <input type="number" min={0} value={form.duration_seconds} onChange={(e) => setForm({ ...form, duration_seconds: Number(e.target.value) })} className="input" />
            </Field>
            <Field label="Publish date">
              <input type="date" value={form.publish_date} onChange={(e) => setForm({ ...form, publish_date: e.target.value })} className="input" />
            </Field>
          </div>
          <div className="flex items-center gap-4 pt-1">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              Published
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              Featured on home
            </label>
          </div>
          <div className="pt-2">
            <button type="submit" disabled={busy} className="w-full h-11 rounded-lg bg-gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-50">
              {busy ? "Saving…" : episode ? "Save changes" : "Create episode"}
            </button>
          </div>
        </form>
      </div>
      <style>{`.input { width: 100%; height: 40px; border-radius: 8px; background: var(--color-input); border: 1px solid var(--color-border); padding: 0 12px; font-size: 14px; color: var(--color-foreground); } .input:focus { outline: none; border-color: var(--color-primary); } textarea.input { padding: 8px 12px; height: auto; }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
