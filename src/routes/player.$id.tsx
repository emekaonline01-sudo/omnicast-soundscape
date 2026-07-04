import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Rewind, FastForward, Volume2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { episodeQuery, episodesQuery } from "@/lib/episodes";
import { usePlayer } from "@/lib/player";
import { formatDuration } from "@/lib/format";

export const Route = createFileRoute("/player/$id")({
  loader: async ({ context, params }) => {
    const ep = await context.queryClient.ensureQueryData(episodeQuery(params.id));
    if (!ep) throw notFound();
    await context.queryClient.ensureQueryData(episodesQuery);
    return { title: ep.title };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.title ?? "Now Playing"} — OmniCast` }] }),
  component: PlayerPage,
});

const RATES = [1, 1.25, 1.5, 2];

function PlayerPage() {
  const { id } = Route.useParams();
  const { data: ep } = useSuspenseQuery(episodeQuery(id));
  const { data: all } = useSuspenseQuery(episodesQuery);
  const p = usePlayer();

  // Autoplay this episode when the player screen mounts
  useEffect(() => {
    if (ep && p.current?.id !== ep.id) p.play(ep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep?.id]);

  if (!ep) return null;
  const list = all;
  const idx = list.findIndex((e) => e.id === ep.id);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  return (
    <AppShell hideNav>
      <div className="min-h-screen flex flex-col bg-gradient-hero">
        <header className="px-4 pt-6 pb-2 flex items-center justify-between">
          <Link to="/episode/$id" params={{ id: ep.id }} className="h-10 w-10 rounded-full bg-surface/60 backdrop-blur flex items-center justify-center">
            <ChevronDown className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Now playing</p>
            <p className="text-xs font-semibold">{ep.podcast_title}</p>
          </div>
          <div className="w-10" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
          <div className="w-full max-w-sm aspect-square rounded-3xl overflow-hidden shadow-glow bg-surface-2">
            {ep.cover_url && <img src={ep.cover_url} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="mt-8 w-full max-w-sm text-center">
            <h1 className="text-2xl font-bold leading-tight">{ep.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{ep.author ?? ep.podcast_title}</p>
          </div>

          <div className="w-full max-w-sm mt-8">
            <input
              type="range"
              min={0}
              max={p.duration || ep.duration_seconds || 100}
              step={1}
              value={p.currentTime}
              onChange={(e) => p.seek(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="Seek"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground mt-1 font-mono">
              <span>{formatDuration(p.currentTime)}</span>
              <span>{formatDuration(p.duration || ep.duration_seconds || 0)}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button onClick={() => p.skip(-15)} className="h-11 w-11 rounded-full bg-surface/60 flex items-center justify-center hover:bg-surface" aria-label="Back 15">
              <Rewind className="h-5 w-5" />
            </button>
            <button
              disabled={!prev}
              onClick={() => prev && p.play(prev)}
              className="h-11 w-11 rounded-full bg-surface/60 flex items-center justify-center hover:bg-surface disabled:opacity-30"
              aria-label="Previous"
            >
              <SkipBack className="h-5 w-5 fill-current" />
            </button>
            <button
              onClick={p.toggle}
              className="h-16 w-16 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-glow hover:opacity-90"
              aria-label="Play/Pause"
            >
              {p.isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="h-7 w-7 fill-current ml-0.5" />}
            </button>
            <button
              disabled={!next}
              onClick={() => next && p.play(next)}
              className="h-11 w-11 rounded-full bg-surface/60 flex items-center justify-center hover:bg-surface disabled:opacity-30"
              aria-label="Next"
            >
              <SkipForward className="h-5 w-5 fill-current" />
            </button>
            <button onClick={() => p.skip(30)} className="h-11 w-11 rounded-full bg-surface/60 flex items-center justify-center hover:bg-surface" aria-label="Forward 30">
              <FastForward className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-8 w-full max-w-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              {RATES.map((r) => (
                <button
                  key={r}
                  onClick={() => p.setRate(r)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${p.rate === r ? "bg-primary text-primary-foreground" : "bg-surface/60 hover:bg-surface"}`}
                >
                  {r}×
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-[140px]">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={p.volume}
                onChange={(e) => p.setVolume(Number(e.target.value))}
                className="flex-1 accent-primary"
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
