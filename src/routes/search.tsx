import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EpisodeCard } from "@/components/EpisodeCard";
import { episodesQuery } from "@/lib/episodes";

export const Route = createFileRoute("/search")({
  loader: ({ context }) => context.queryClient.ensureQueryData(episodesQuery),
  head: () => ({ meta: [{ title: "Search — OmniCast" }, { name: "description", content: "Search podcast episodes by title, show or category." }] }),
  component: SearchPage,
});

function SearchPage() {
  const { data: episodes } = useSuspenseQuery(episodesQuery);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return episodes;
    return episodes.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        e.podcast_title.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query) ||
        (e.author ?? "").toLowerCase().includes(query),
    );
  }, [episodes, q]);

  return (
    <AppShell>
      <header className="px-4 pt-6 pb-3 sticky top-0 z-10 bg-background/95 backdrop-blur">
        <h1 className="text-2xl font-bold mb-3">Search</h1>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search episodes, podcasts, categories..."
            className="w-full h-11 rounded-full bg-surface border border-border pl-10 pr-10 text-sm focus:outline-none focus:border-primary transition-colors"
            autoFocus
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-surface-2 flex items-center justify-center">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      <div className="px-4 mt-2">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="h-16 w-16 rounded-full bg-surface mx-auto flex items-center justify-center">
              <SearchIcon className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mt-4 font-semibold">No results found</p>
            <p className="text-sm text-muted-foreground">Try a different keyword or category.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((ep) => (
              <div key={ep.id} className="py-2">
                <EpisodeCard ep={ep} />
                {ep.description && <p className="text-xs text-muted-foreground line-clamp-2 pl-[76px] -mt-1">{ep.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
