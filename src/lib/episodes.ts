import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export type Episode = {
  id: string;
  title: string;
  podcast_title: string;
  author: string | null;
  description: string | null;
  category: string;
  cover_url: string | null;
  audio_url: string;
  duration_seconds: number | null;
  publish_date: string;
  published: boolean;
  featured: boolean;
};

export const episodesQuery = queryOptions({
  queryKey: ["episodes"],
  queryFn: async (): Promise<Episode[]> => {
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .eq("published", true)
      .order("publish_date", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Episode[];
  },
});

export const allEpisodesAdminQuery = queryOptions({
  queryKey: ["episodes", "admin"],
  queryFn: async (): Promise<Episode[]> => {
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Episode[];
  },
});

export function episodeQuery(id: string) {
  return queryOptions({
    queryKey: ["episode", id],
    queryFn: async (): Promise<Episode | null> => {
      const { data, error } = await supabase.from("episodes").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data as Episode) ?? null;
    },
  });
}
