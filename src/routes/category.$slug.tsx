import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EpisodeCard } from "@/components/EpisodeCard";
import { episodesQuery } from "@/lib/episodes";
import { unslugifyCategory } from "@/lib/format";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ context, params }) => {
    const cat = unslugifyCategory(params.slug);
    if (!cat) throw notFound();
    await context.queryClient.ensureQueryData(episodesQuery);
    return { category: cat };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.category ?? "Category"} — OmniCast` },
      { name: "description", content: `Podcast episodes in ${loaderData?.category ?? ""}.` },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const { data: episodes } = useSuspenseQuery(episodesQuery);
  const filtered = episodes.filter((e) => e.category === category);
  return (
    <AppShell>
      <header className="px-4 pt-6 pb-4 flex items-center gap-3">
        <Link to="/categories" className="h-9 w-9 rounded-full bg-surface flex items-center justify-center hover:bg-surface-2">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{category}</h1>
          <p className="text-xs text-muted-foreground">{filtered.length} episodes</p>
        </div>
      </header>
      <div className="px-4 divide-y divide-border/40">
        {filtered.length === 0 ? (
          <p className="text-center py-20 text-muted-foreground text-sm">No episodes yet in this category.</p>
        ) : (
          filtered.map((ep) => <EpisodeCard key={ep.id} ep={ep} />)
        )}
      </div>
    </AppShell>
  );
}
