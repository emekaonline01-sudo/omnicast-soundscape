import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search, Play, Headphones } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EpisodeCard } from "@/components/EpisodeCard";
import { AdBanner } from "@/components/AdSlot";
import { episodesQuery, type Episode } from "@/lib/episodes";
import { CATEGORIES, slugifyCategory, formatShortDuration } from "@/lib/format";
import { usePlayer } from "@/lib/player";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(episodesQuery),
  component: Home,
});

function Home() {
  const { data: episodes } = useSuspenseQuery(episodesQuery);
  const featured = episodes.find((e) => e.featured) ?? episodes[0];
  const latest = episodes.slice(0, 8);
  const popular = [...episodes].sort((a, b) => (b.duration_seconds ?? 0) - (a.duration_seconds ?? 0)).slice(0, 6);

  return (
    <AppShell>
      <header className="flex items-center justify-between px-4 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Headphones className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">OmniCast</h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Podcasts, sharpened.</p>
          </div>
        </div>
        <Link to="/search" className="h-10 w-10 rounded-full bg-surface flex items-center justify-center hover:bg-surface-2 transition-colors" aria-label="Search">
          <Search className="h-5 w-5" />
        </Link>
      </header>

      {featured && <FeaturedBanner ep={featured} />}

      <section className="px-4 mt-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              to="/category/$slug"
              params={{ slug: slugifyCategory(c) }}
              className="shrink-0 rounded-full border border-border bg-surface hover:bg-surface-2 hover:border-primary/50 px-4 py-2 text-xs font-medium transition-colors"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      <Section title="Latest Episodes" href="/categories">
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
          {latest.map((ep) => <EpisodeCard key={ep.id} ep={ep} variant="grid" />)}
        </div>
      </Section>

      <Section title="Popular">
        <div className="px-4 divide-y divide-border/40">
          {popular.map((ep) => <EpisodeCard key={ep.id} ep={ep} />)}
        </div>
      </Section>

      <div className="px-4 mt-8">
        <AdBanner placement="home-bottom" />
      </div>
    </AppShell>
  );
}

function Section({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {href && <Link to={href} className="text-xs text-primary hover:underline">See all</Link>}
      </div>
      {children}
    </section>
  );
}

function FeaturedBanner({ ep }: { ep: Episode }) {
  const { play } = usePlayer();
  return (
    <section className="px-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero border border-border shadow-card">
        {ep.cover_url && (
          <div
            className="absolute inset-0 opacity-30 blur-2xl"
            style={{ backgroundImage: `url(${ep.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        )}
        <div className="relative p-4 flex gap-4 items-center">
          <div className="h-24 w-24 rounded-xl overflow-hidden shrink-0 shadow-glow">
            {ep.cover_url && <img src={ep.cover_url} alt={ep.title} className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-glow">Featured</p>
            <h2 className="text-base font-bold line-clamp-2 mt-1">{ep.title}</h2>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ep.podcast_title} · {formatShortDuration(ep.duration_seconds)}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => play(ep)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:bg-primary-glow transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Play
              </button>
              <Link to="/episode/$id" params={{ id: ep.id }} className="inline-flex items-center rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold hover:bg-accent transition-colors">
                Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
