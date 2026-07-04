export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds < 0) return "--:--";
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatShortDuration(seconds: number | null | undefined): string {
  if (!seconds) return "";
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export const CATEGORIES = [
  "Artificial Intelligence",
  "Technology",
  "Business",
  "Finance",
  "Education",
  "Motivation",
  "Health",
  "Lifestyle",
  "News",
  "Religion",
  "Meditation",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function slugifyCategory(c: string): string {
  return c.toLowerCase().replace(/\s+/g, "-");
}
export function unslugifyCategory(slug: string): Category | null {
  const match = CATEGORIES.find((c) => slugifyCategory(c) === slug);
  return match ?? null;
}
