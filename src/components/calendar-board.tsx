"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useQuery } from "@tanstack/react-query";
import { EventStatus, EventType, Priority } from "@prisma/client";
import { useState } from "react";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
};

const priorityColor: Record<Priority, string> = {
  [Priority.LOW]: "#71717a",
  [Priority.MEDIUM]: "#22c55e",
  [Priority.HIGH]: "#f59e0b",
  [Priority.CRITICAL]: "#ef4444",
};

async function fetchCalendarEvents(params: {
  type?: string;
  status?: string;
  priority?: string;
}) {
  const search = new URLSearchParams();
  if (params.type && params.type !== "ALL") search.set("type", params.type);
  if (params.status && params.status !== "ALL")
    search.set("status", params.status);
  if (params.priority && params.priority !== "ALL")
    search.set("priority", params.priority);

  const res = await fetch(`/api/events?${search.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Erro ao carregar eventos do calendário");
  const events = await res.json();

  return (events as any[]).map<CalendarEvent>((e) => ({
    id: e.id,
    title: e.title,
    start: e.startDate,
    end: e.dueDate,
    backgroundColor: priorityColor[e.priority as Priority],
    borderColor: priorityColor[e.priority as Priority],
  }));
}

export function CalendarBoard() {
  const [type, setType] = useState<"ALL" | EventType>("ALL");
  const [status, setStatus] = useState<"ALL" | EventStatus>("ALL");
  const [priority, setPriority] = useState<"ALL" | Priority>("ALL");

  const { data, isLoading, error } = useQuery({
    queryKey: ["calendar-events", type, status, priority],
    queryFn: () => fetchCalendarEvents({ type, status, priority }),
  });

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-300">
            Calendário interativo
          </p>
          <p className="text-[11px] text-zinc-500">
            Visualize compromissos por tipo, prioridade e status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="h-7 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-[11px] text-zinc-100 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">Todos os tipos</option>
            <option value={EventType.TASK}>Tarefas</option>
            <option value={EventType.EVENT}>Eventos</option>
            <option value={EventType.REMINDER}>Lembretes</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="h-7 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-[11px] text-zinc-100 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">Todos os status</option>
            <option value={EventStatus.PENDING}>Pendentes</option>
            <option value={EventStatus.IN_PROGRESS}>Em andamento</option>
            <option value={EventStatus.COMPLETED}>Concluídos</option>
            <option value={EventStatus.OVERDUE}>Atrasados</option>
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="h-7 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-[11px] text-zinc-100 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">Todas as prioridades</option>
            <option value={Priority.LOW}>Baixa</option>
            <option value={Priority.MEDIUM}>Média</option>
            <option value={Priority.HIGH}>Alta</option>
            <option value={Priority.CRITICAL}>Crítica</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <p className="text-[11px] text-zinc-500">
          Carregando eventos do calendário...
        </p>
      )}
      {error && (
        <p className="text-[11px] text-red-400">
          Erro ao carregar calendário. Tente recarregar a página.
        </p>
      )}

      {data && (
        <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-100">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            height="auto"
            events={data}
            firstDay={1}
          />
        </div>
      )}
    </div>
  );
}

