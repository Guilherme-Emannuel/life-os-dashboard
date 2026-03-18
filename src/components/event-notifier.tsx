"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { isNearby } from "@/lib/timezone";

async function fetchUpcomingEvents() {
  const res = await fetch("/api/events");
  if (!res.ok) throw new Error("Erro ao buscar eventos");
  return res.json();
}

export function EventNotifier() {
  const { data: events } = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: fetchUpcomingEvents,
    refetchInterval: 60000, // Verificar a cada minuto
  });

  useEffect(() => {
    if (!events) return;

    const now = new Date();
    const notifiedEvents = new Set<string>(); // Evitar notificações duplicadas

    events.forEach((event: any) => {
      const eventId = event.id;
      
      // Pular se já notificado
      if (notifiedEvents.has(eventId)) return;
      
      // Verificar se evento está próximo (dentro de 30 minutos)
      if (isNearby(event.dueDate, 30)) {
        toast.info(`⏰ Evento próximo: ${event.title}`, {
          description: `Começa em breve!`,
          duration: 5000,
        });
        notifiedEvents.add(eventId);
      }
    });
  }, [events]);

  return null; // Componente invisível, apenas para notificações
}
