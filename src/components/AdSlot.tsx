// AdMob-ready placeholders. Ad unit IDs come from env vars.
// When packaged with Capacitor + @capacitor-community/admob, swap these
// divs with native AdMob banner/interstitial calls using the same IDs.

const BANNER_ID = import.meta.env.VITE_ADMOB_BANNER_ID || "ca-app-pub-3940256099942544/6300978111"; // Google test banner
const INTERSTITIAL_ID = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || "ca-app-pub-3940256099942544/1033173712";

export function AdBanner({ placement, className = "" }: { placement: string; className?: string }) {
  return (
    <div
      className={`w-full rounded-lg border border-dashed border-border bg-surface/50 text-center text-xs text-muted-foreground py-3 ${className}`}
      data-admob-unit={BANNER_ID}
      data-placement={placement}
      aria-label={`Ad banner (${placement})`}
    >
      Ad · {placement}
    </div>
  );
}

export function useInterstitialAd() {
  return {
    unitId: INTERSTITIAL_ID,
    // In native (Capacitor) shell, call AdMob.showInterstitial() here.
    maybeShow: async (_context: string) => {
      // Web: no-op. Native wrapper will hook this to show an interstitial.
    },
  };
}
