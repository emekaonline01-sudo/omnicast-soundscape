import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.omnicast',
  appName: 'OmniCast',
  webDir: 'dist',
  // Remove the `server` block for a fully offline production build.
  // Kept here so `npx cap run` can hot-reload from the Lovable preview during development.
  server: {
    url: 'https://20065c0a-6d8e-4b2f-9229-b0da55ab4423.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  android: {
    backgroundColor: '#0b1220',
  },
  ios: {
    backgroundColor: '#0b1220',
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0b1220',
      showSpinner: false,
      androidSplashResourceName: 'splash',
    },
  },
};

export default config;
