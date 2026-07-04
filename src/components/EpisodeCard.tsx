import { Link } from "@tanstack/react-router";
import type { Episode } from "@/lib/episodes";
import { formatShortDuration } from "@/lib/format";

export function EpisodeCard({ ep, variant = "row" }: { ep: Episode; variant?: "row" | "grid" }) {
  if (variant === "grid") {
    return (
      <Link
        to="/episode/$id"
        params={{ id: ep.id }}
        className="group block w-40 shrink-0"
      >
        <div className="aspect-square rounded-xl overflow-hidden bg-surface-2 shadow-card">
          {ep.cover_url ? (
            <img src={ep.cover_url} alt={ep.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
          ) : (
            <div className="h-full w-full bg-gradient-primary" />
          )}
        </div>
        <h3 className="mt-2 text-sm font-semibold line-clamp-2">{ep.title}</h3>
        <p className="text-xs text-muted-foreground">{ep.podcast_title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatShortDuration(ep.duration_seconds)}</p>
      </Link>
    );
  }
  return (
    <Link
      to="/episode/$id"
      params={{ id: ep.id }}
      className="flex gap-3 items-center py-2 group"
    >
      <div className="h-16 w-16 rounded-lg overflow-hidden bg-surface-2 shrink-0">
        {ep.cover_url && (
          <img src={ep.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold truncate group-hover:text-primary">{ep.title}</h3>
        <p className="text-xs text-muted-foreground truncate">{ep.podcast_title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatShortDuration(ep.duration_seconds)} · {ep.category}</p>
      </div>
    </Link>
  );
}
