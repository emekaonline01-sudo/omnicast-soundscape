import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, Play, Bookmark, Share2, Calendar, Clock, Tag, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { EpisodeCard } from "@/components/EpisodeCard";
import { AdBanner } from "@/components/AdSlot";
import { episodeQuery, episodesQuery } from "@/lib/episodes";
import { formatDate, formatShortDuration } from "@/lib/format";
import { usePlayer } from "@/lib/player";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/episode/$id")({
  loader: async ({ context, params }) => {
    const ep = await context.queryClient.ensureQueryData(episodeQuery(params.id));
    if (!ep) throw notFound();
    await context.queryClient.ensureQueryData(episodesQuery);
    return { title: ep.title, description: ep.description ?? "", cover: ep.cover_url };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Episode"} — OmniCast` },
      { name: "description", content: loaderData?.description?.slice(0, 155) ?? "Podcast episode on OmniCast." },
      ...(loaderData?.cover ? [{ property: "og:image", content: loaderData.cover }] : []),
    ],
  }),
  component: EpisodeDetails,
});

function EpisodeDetails() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: ep } = useSuspenseQuery(episodeQuery(id));
  const { data: all } = useSuspenseQuery(episodesQuery);
  const { play } = usePlayer();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const { data: favRow, refetch: refetchFav } = useQuery({
    queryKey: ["favorite", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("*").eq("user_id", user!.id).eq("episode_id", id).maybeSingle();
      return data;
    },
  });
  useEffect(() => setSaved(!!favRow), [favRow]);

  if (!ep) return null;

  const related = all.filter((e) => e.category === ep.category && e.id !== ep.id).slice(0, 6);

  const toggleFav = async () => {
    if (!user) { toast.error("Sign in to save favorites"); navigate({ to: "/auth" }); return; }
    if (saved) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("episode_id", id);
      setSaved(false);
      toast.success("Removed from library");
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, episode_id: id });
      setSaved(true);
      toast.success("Saved to library");
    }
    refetchFav();
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: ep.title, text: ep.podcast_title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {}
  };

  return (
    <AppShell>
      <div className="relative">
        {ep.cover_url && (
          <div className="absolute inset-x-0 top-0 h-72 opacity-25 blur-2xl -z-0"
            style={{ backgroundImage: `url(${ep.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        )}
        <header className="relative px-4 pt-6 pb-2">
          <Link to="/" className="inline-flex h-9 w-9 rounded-full bg-surface items-center justify-center hover:bg-surface-2">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </header>

        <div className="relative px-4 pt-2 pb-4 flex flex-col items-center text-center">
          <div className="h-56 w-56 rounded-2xl overflow-hidden shadow-glow bg-surface-2">
            {ep.cover_url && <img src={ep.cover_url} alt={ep.title} className="h-full w-full object-cover" />}
          </div>
          <h1 className="mt-5 text-xl font-bold leading-tight">{ep.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{ep.podcast_title}</p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {ep.author && <span className="inline-flex items-center gap-1"><UserIcon className="h-3.5 w-3.5" />{ep.author}</span>}
            <span className="inline-flex items-center gap-1"><Tag className="h-3.5 w-3.5" />{ep.category}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatShortDuration(ep.duration_seconds)}</span>
            <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(ep.publish_date)}</span>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => { play(ep); navigate({ to: "/player/$id", params: { id: ep.id } }); }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary text-primary-foreground px-6 py-3 font-semibold shadow-glow hover:opacity-90"
            >
              <Play className="h-5 w-5 fill-current" /> Play
            </button>
            <button onClick={toggleFav} className={`h-12 w-12 rounded-full border border-border flex items-center justify-center ${saved ? "bg-primary/10 text-primary" : "bg-surface hover:bg-surface-2"}`} aria-label="Bookmark">
              <Bookmark className={`h-5 w-5 ${saved ? "fill-current" : ""}`} />
            </button>
            <button onClick={share} className="h-12 w-12 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-surface-2" aria-label="Share">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {ep.description && (
        <section className="px-4 mt-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">About this episode</h2>
          <p className="text-sm leading-relaxed text-foreground/90">{ep.description}</p>
        </section>
      )}

      <div className="px-4 mt-6">
        <AdBanner placement="episode-details" />
      </div>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="px-4 text-lg font-bold mb-3">Related episodes</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
            {related.map((r) => <EpisodeCard key={r.id} ep={r} variant="grid" />)}
          </div>
        </section>
      )}
    </AppShell>
  );
}
