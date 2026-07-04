import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { episodesQuery } from "@/lib/episodes";
import { CATEGORIES, slugifyCategory } from "@/lib/format";
import { Brain, Cpu, Briefcase, DollarSign, GraduationCap, Flame, HeartPulse, Sparkles, Newspaper, BookOpen, Wind } from "lucide-react";

export const Route = createFileRoute("/categories")({
  loader: ({ context }) => context.queryClient.ensureQueryData(episodesQuery),
  head: () => ({ meta: [{ title: "Categories — OmniCast" }, { name: "description", content: "Browse podcast categories on OmniCast." }] }),
  component: CategoriesPage,
});

const meta: Record<string, { icon: React.ComponentType<{ className?: string }>; gradient: string }> = {
  "Artificial Intelligence": { icon: Brain, gradient: "from-blue-500 to-indigo-600" },
  "Technology": { icon: Cpu, gradient: "from-cyan-500 to-blue-600" },
  "Business": { icon: Briefcase, gradient: "from-slate-500 to-slate-700" },
  "Finance": { icon: DollarSign, gradient: "from-emerald-500 to-teal-600" },
  "Education": { icon: GraduationCap, gradient: "from-amber-500 to-orange-600" },
  "Motivation": { icon: Flame, gradient: "from-red-500 to-rose-600" },
  "Health": { icon: HeartPulse, gradient: "from-pink-500 to-rose-600" },
  "Lifestyle": { icon: Sparkles, gradient: "from-violet-500 to-purple-600" },
  "News": { icon: Newspaper, gradient: "from-gray-500 to-slate-700" },
  "Religion": { icon: BookOpen, gradient: "from-yellow-600 to-amber-700" },
  "Meditation": { icon: Wind, gradient: "from-teal-400 to-cyan-600" },
};

function CategoriesPage() {
  const { data: episodes } = useSuspenseQuery(episodesQuery);
  const counts = new Map<string, number>();
  episodes.forEach((e) => counts.set(e.category, (counts.get(e.category) ?? 0) + 1));

  return (
    <AppShell>
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-muted-foreground">Browse by topic</p>
      </header>
      <div className="px-4 grid grid-cols-2 gap-3">
        {CATEGORIES.map((c) => {
          const m = meta[c];
          const Icon = m.icon;
          return (
            <Link
              key={c}
              to="/category/$slug"
              params={{ slug: slugifyCategory(c) }}
              className={`relative overflow-hidden rounded-2xl aspect-[4/3] p-4 flex flex-col justify-between bg-gradient-to-br ${m.gradient} text-white shadow-card hover:scale-[1.02] transition-transform`}
            >
              <Icon className="h-6 w-6" />
              <div>
                <div className="font-semibold text-sm leading-tight">{c}</div>
                <div className="text-[11px] opacity-80 mt-0.5">{counts.get(c) ?? 0} episodes</div>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
