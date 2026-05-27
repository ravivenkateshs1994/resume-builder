"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  const iosStandalone = typeof window.navigator !== "undefined" && "standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  const displayStandalone = window.matchMedia("(display-mode: standalone)").matches;
  return iosStandalone || displayStandalone;
}

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

export default function InstallAppButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const standalone = isStandaloneMode();
    setInstalled(standalone);
    setShowIosHelp(!standalone && isIosSafari());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setInstallEvent(null);
    }
  }

  if (installed) return null;

  if (!installEvent && showIosHelp) {
    return (
      <span className="hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 md:inline-flex">
        On iPhone: Share then Add to Home Screen
      </span>
    );
  }

  if (!installEvent) return null;

  return (
    <button
      type="button"
      onClick={() => {
        void handleInstall();
      }}
      className="hidden rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 md:inline-flex"
    >
      Install App
    </button>
  );
}
