# Exporting OmniCast to Android / iOS with Capacitor

This project is Capacitor-ready. Follow these steps on your own machine (macOS for iOS, any OS for Android).


## 1. Export & clone

1. In Lovable, click **GitHub → Export to GitHub**.
2. `git clone` the repo locally and `cd` into it.
3. `npm install` (or `bun install`).

## 2. Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

(The `capacitor-plugin-safe-area` plugin is already in `package.json`.)

## 3. Initialize native platforms

```bash
npx cap init   # only if capacitor.config.ts is missing — this repo already has one
npx cap add android
npx cap add ios        # macOS only
```

## 4. Build the web app and sync

```bash
npm run build
npx cap sync
```

Run `npx cap sync` after **every** `git pull` from Lovable so the native
projects pick up new web assets and plugins.

## 5. Run on device / emulator

```bash
npx cap run android    # requires Android Studio + an emulator or device
npx cap run ios        # requires Xcode
```

Or open the native project directly:

```bash
npx cap open android
npx cap open ios
```

## 6. Going to production

`capacitor.config.ts` currently points `server.url` at the Lovable preview so
you get hot-reload during development. **Before shipping to the Play Store /
App Store, delete the entire `server` block** so the app loads the bundled
`dist/` assets instead of the remote preview.

```ts
// capacitor.config.ts (production)
const config: CapacitorConfig = {
  appId: 'app.lovable.omnicast',
  appName: 'OmniCast',
  webDir: 'dist',
  android: { backgroundColor: '#0b1220' },
  ios: { backgroundColor: '#0b1220', contentInset: 'always' },
};
```

Then rebuild:

```bash
npm run build && npx cap sync
```

## 7. AdMob (optional)

For real AdMob banners/interstitials on device:

```bash
npm install @capacitor-community/admob
npx cap sync
```

Set `VITE_ADMOB_BANNER_ID` and `VITE_ADMOB_INTERSTITIAL_ID` in `.env`, then
wire `AdMob.showBanner()` / `AdMob.showInterstitial()` inside
`src/components/AdSlot.tsx` and `useInterstitialAd()` — the unit IDs are
already plumbed through those helpers.

## Troubleshooting

- **White screen on device** — you probably didn't run `npm run build` before
  `npx cap sync`, or `server.url` is set but unreachable. Remove the `server`
  block for offline builds.
- **Auth redirects fail** — add your Capacitor scheme
  (`capacitor://localhost` on iOS, `https://localhost` on Android) to the
  allowed redirect URLs in your backend auth settings.
- **Changes not showing up** — always `npm run build && npx cap sync` after
  editing web code.
