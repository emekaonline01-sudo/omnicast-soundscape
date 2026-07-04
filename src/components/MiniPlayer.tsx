import { Link } from "@tanstack/react-router";
import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/lib/player";

export function MiniPlayer() {
  const { current, isPlaying, toggle, currentTime, duration } = usePlayer();
  if (!current) return null;
  const pct = duration ? (currentTime / duration) * 100 : 0;
  return (
    <div className="fixed bottom-16 inset-x-0 z-30 px-2 pb-2 pointer-events-none">
      <div className="mx-auto max-w-2xl pointer-events-auto">
        <div className="rounded-xl bg-surface-2/95 backdrop-blur-lg border border-border shadow-card overflow-hidden">
          <div className="h-0.5 bg-border">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center gap-3 p-2">
            <Link to="/player/$id" params={{ id: current.id }} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-md overflow-hidden bg-surface shrink-0">
                {current.cover_url && <img src={current.cover_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{current.title}</p>
                <p className="text-xs text-muted-foreground truncate">{current.podcast_title}</p>
              </div>
            </Link>
            <button
              onClick={toggle}
              className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary-glow transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
