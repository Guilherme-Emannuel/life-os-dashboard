"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

async function requestPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

export function NotificationBanner() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setSupported(true);
      requestPermission();
    }
  }, []);

  if (!supported) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-20 w-full max-w-md -translate-x-1/2 rounded-full border border-zinc-800 bg-zinc-950/90 px-3 py-1.5 text-[11px] text-zinc-300 shadow-xl shadow-black/40">
      <div className="flex items-center gap-2">
        <Bell className="h-3.5 w-3.5 text-emerald-400" />
        <p className="flex-1">
          Ative as notificações do navegador para ser avisado sobre tarefas
          críticas perto do prazo.
        </p>
      </div>
    </div>
  );
}

