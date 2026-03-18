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
    <div className="fixed bottom-4 left-1/2 z-20 w-full max-w-md -translate-x-1/2 rounded-full border border-blue-400 bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1.5 text-[11px] text-white shadow-xl shadow-blue-900/30 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Bell className="h-3.5 w-3.5 text-white" />
        <p className="flex-1">
          Ative as notificações do navegador para ser avisado sobre tarefas
          críticas perto do prazo.
        </p>
      </div>
    </div>
  );
}

