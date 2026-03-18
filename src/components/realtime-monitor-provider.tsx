"use client";

import { ReactNode } from "react";
import { useRealtimeMonitoring } from "@/hooks/use-realtime-monitoring";

interface RealtimeMonitorProviderProps {
  children: ReactNode;
}

export function RealtimeMonitorProvider({ children }: RealtimeMonitorProviderProps) {
  // Hook de monitoramento ativo
  useRealtimeMonitoring();

  return <>{children}</>;
}
