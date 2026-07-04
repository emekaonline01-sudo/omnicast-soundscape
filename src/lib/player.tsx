import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Episode } from "./episodes";
import { supabase } from "@/integrations/supabase/client";

type PlayerCtx = {
  current: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  rate: number;
  volume: number;
  play: (ep: Episode, opts?: { resume?: boolean }) => void;
  toggle: () => void;
  seek: (t: number) => void;
  skip: (delta: number) => void;
  setRate: (r: number) => void;
  setVolume: (v: number) => void;
};

const Ctx = createContext<PlayerCtx | null>(null);

const LS_KEY = "omnicast:last";

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(1);
  const [volume, setVolumeState] = useState(1);

  // Init audio element on client
  useEffect(() => {
    if (typeof window === "undefined") return;
    const a = new Audio();
    a.preload = "metadata";
    audioRef.current = a;
    const onTime = () => setCurrentTime(a.currentTime);
    const onDur = () => setDuration(a.duration || 0);
    const onEnd = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onDur);
    a.addEventListener("ended", onEnd);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.pause();
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onDur);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, []);

  // Persist last position periodically
  useEffect(() => {
    if (!current) return;
    const id = window.setInterval(async () => {
      const a = audioRef.current;
      if (!a || a.paused) return;
      try {
        localStorage.setItem(LS_KEY + ":" + current.id, String(a.currentTime));
        const { data: sess } = await supabase.auth.getSession();
        if (sess.session) {
          await supabase.from("playback_positions").upsert({
            user_id: sess.session.user.id,
            episode_id: current.id,
            position_seconds: Math.floor(a.currentTime),
          });
        }
      } catch {}
    }, 5000);
    return () => window.clearInterval(id);
  }, [current]);

  const play = useCallback(async (ep: Episode, opts?: { resume?: boolean }) => {
    const a = audioRef.current;
    if (!a) return;
    if (current?.id !== ep.id) {
      a.src = ep.audio_url;
      a.playbackRate = rate;
      a.volume = volume;
      setCurrent(ep);
      let resumeTo = 0;
      if (opts?.resume !== false) {
        try {
          const local = Number(localStorage.getItem(LS_KEY + ":" + ep.id) || "0");
          if (local > 3) resumeTo = local;
          const { data: sess } = await supabase.auth.getSession();
          if (sess.session) {
            const { data } = await supabase
              .from("playback_positions")
              .select("position_seconds")
              .eq("user_id", sess.session.user.id)
              .eq("episode_id", ep.id)
              .maybeSingle();
            if (data?.position_seconds && data.position_seconds > resumeTo) resumeTo = data.position_seconds;
          }
        } catch {}
      }
      const start = () => {
        if (resumeTo > 0) a.currentTime = resumeTo;
        a.play().catch(() => {});
        a.removeEventListener("loadedmetadata", start);
      };
      a.addEventListener("loadedmetadata", start);
    } else {
      a.play().catch(() => {});
    }
  }, [current, rate, volume]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, [current]);

  const seek = useCallback((t: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(a.duration || 0, t));
  }, []);

  const skip = useCallback((delta: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + delta));
  }, []);

  const setRate = useCallback((r: number) => {
    setRateState(r);
    if (audioRef.current) audioRef.current.playbackRate = r;
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  return (
    <Ctx.Provider value={{ current, isPlaying, currentTime, duration, rate, volume, play, toggle, seek, skip, setRate, setVolume }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePlayer() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlayer must be inside PlayerProvider");
  return c;
}
