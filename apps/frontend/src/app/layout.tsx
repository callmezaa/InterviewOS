import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { MotionConfig } from "motion/react";
import { Toaster } from "../components/ui/Toaster";
import { ShortcutsModal } from "../components/ui/ShortcutsModal";
import { SkipLink } from "../components/ui/SkipLink";
import { NavigationProgress } from "../components/ui/NavigationProgress";
import PageAnimatePresence from "../components/ui/PageAnimatePresence";
import { PostHogProvider } from "../components/PostHogProvider";
import { PwaRegister } from "../components/PwaRegister";
import { CommandPaletteLoader } from "../components/ui/CommandPaletteLoader";
import { BrandingProvider } from "../components/providers/BrandingProvider";
import { SentryProvider } from "../components/providers/SentryProvider";
import { ClientInit } from "../components/ClientInit";
import { cn } from "@/lib/utils";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});
const jakartaMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: "InterviewOS — AI Realtime Interview Platform",
  description: "Experience premium, cinematic realtime technical interviews powered by WebRTC signaling, collaborative coding, and AI-driven Whisper transcription.",
  authors: [{ name: "InterviewOS Team" }],
  keywords: ["interviews", "realtime", "webrtc", "coding editor", "whisper transcript", "ai feedback"],
  manifest: "/favicon/manifest.json",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any", type: "image/x-icon" },
      { url: "/favicon/icon0.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/favicon/icon1.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/favicon/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/favicon/icon0.svg", color: "#0066cc" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "InterviewOS",
    "msapplication-TileColor": "#0066cc",
    "msapplication-TileImage": "/icons/icon-144x144.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0066cc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", "safe-area-inset", "font-sans", jakartaSans.variable, jakartaMono.variable)} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t)t=window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface-black text-white">
        <SkipLink />
        <Suspense fallback={null}><NavigationProgress /></Suspense>
        <div aria-live="polite" aria-label="Application announcements" className="sr-only" role="status" />
        <MotionConfig reducedMotion="user">
          <PostHogProvider>
            <BrandingProvider>
              <SentryProvider>
              <Toaster />
              <CommandPaletteLoader />
              <ShortcutsModal />
              <PwaRegister />
              <ClientInit />
              <PageAnimatePresence>{children}</PageAnimatePresence>
              </SentryProvider>
            </BrandingProvider>
          </PostHogProvider>
        </MotionConfig>
      </body>
    </html>
  );
}

