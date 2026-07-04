import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Shield } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EpisodeCard } from "@/components/EpisodeCard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Episode } from "@/lib/episodes";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "Your Library — OmniCast" }] }),
  component: Library,
});

function Library() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const { data: favs } = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Episode[]> => {
      const { data, error } = await supabase
        .from("favorites")
        .select("episode:episodes(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: { episode: Episode }) => r.episode).filter(Boolean);
    },
  });

  if (loading) return <AppShell><div className="p-8 text-center text-muted-foreground text-sm">Loading…</div></AppShell>;

  if (!user) {
    return (
      <AppShell>
        <div className="px-4 pt-6">
          <h1 className="text-2xl font-bold">Your Library</h1>
          <div className="mt-8 rounded-2xl bg-surface border border-border p-6 text-center">
            <p className="font-semibold">Sign in to build your library</p>
            <p className="text-sm text-muted-foreground mt-1">Save episodes, resume where you left off, and sync across devices.</p>
            <Link to="/auth" className="inline-block mt-4 rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:bg-primary-glow">
              Sign in
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="px-4 pt-6 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Library</h1>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link to="/admin" className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/30 px-3 py-1.5 text-xs font-semibold">
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}
            className="inline-flex items-center gap-1 rounded-full bg-surface border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface-2"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      <section className="mt-6 px-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Saved episodes</h2>
        {!favs || favs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">You haven't saved any episodes yet.</p>
        ) : (
          <div className="divide-y divide-border/40">
            {favs.map((ep) => <EpisodeCard key={ep.id} ep={ep} />)}
          </div>
        )}
      </section>
    </AppShell>
  );
}
