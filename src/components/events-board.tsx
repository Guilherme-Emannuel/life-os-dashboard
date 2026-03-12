"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Event, EventStatus, EventType, Priority } from "@prisma/client";
import { useState } from "react";
import { Trash2 } from "lucide-react";

type EventWithExtras = Event & {
  attachments: { id: string; url: string }[];
};

async function fetchEvents(moduleId?: string): Promise<EventWithExtras[]> {
  const params = new URLSearchParams();
  if (moduleId) params.set("moduleId", moduleId);
  const res = await fetch(`/api/events?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Erro ao carregar eventos");
  return res.json();
}

export function EventsBoard({ moduleId }: { moduleId?: string }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>(EventType.TASK);
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [brief, setBrief] = useState("");
  const [deadline, setDeadline] = useState("");
  const [attachmentUrls, setAttachmentUrls] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["events", moduleId],
    queryFn: () => fetchEvents(moduleId),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!title || !deadline || !moduleId) return;

      const due = new Date(deadline);
      const now = new Date();

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type,
          status: EventStatus.PENDING,
          startDate: now.toISOString(),
          dueDate: due.toISOString(),
          priority,
          brief,
          moduleId,
          attachmentUrls: attachmentUrls
            .split(",")
            .map((u) => u.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Erro ao criar evento");
      }
    },
    onSuccess: () => {
      setTitle("");
      setBrief("");
      setDeadline("");
      setAttachmentUrls("");
      qc.invalidateQueries({ queryKey: ["events", moduleId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir evento");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", moduleId] });
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-zinc-300">
            Adicionar evento / tarefa
          </p>
          <span className="text-[10px] text-zinc-500">
            Título + prazo + prioridade.
          </span>
        </div>
        <div className="grid gap-2 md:grid-cols-[2fr,1fr]">
          <div className="space-y-2 text-xs">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título rápido (ex.: pagar boleto, revisar matéria, enviar relatório...)"
              className="h-8 w-full rounded-md border border-zinc-700/70 bg-zinc-950 px-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Briefing inicial (opcional). O que você precisa lembrar sobre isso?"
              rows={2}
              className="w-full rounded-md border border-zinc-700/70 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
            <input
              value={attachmentUrls}
              onChange={(e) => setAttachmentUrls(e.target.value)}
              placeholder="URLs de anexos separados por vírgula (Drive, Notion, PDFs...)"
              className="h-8 w-full rounded-md border border-zinc-700/70 bg-zinc-950 px-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2 text-xs">
            <label className="space-y-1">
              <span className="text-[11px] text-zinc-400">Prazo (deadline)</span>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-8 w-full rounded-md border border-zinc-700/70 bg-zinc-950 px-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[11px] text-zinc-400">Tipo</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as EventType)}
                  className="h-8 w-full rounded-md border border-zinc-700/70 bg-zinc-950 px-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value={EventType.TASK}>Tarefa</option>
                  <option value={EventType.EVENT}>Evento</option>
                  <option value={EventType.REMINDER}>Lembrete</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[11px] text-zinc-400">Prioridade</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="h-8 w-full rounded-md border border-zinc-700/70 bg-zinc-950 px-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value={Priority.LOW}>Baixa</option>
                  <option value={Priority.MEDIUM}>Média</option>
                  <option value={Priority.HIGH}>Alta</option>
                  <option value={Priority.CRITICAL}>Crítica</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={
                createMutation.isPending ||
                !title ||
                !deadline ||
                !moduleId
              }
              className="mt-auto h-8 rounded-md bg-emerald-500 text-[11px] font-semibold text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/40"
            >
              {createMutation.isPending ? "Salvando..." : "Salvar evento"}
            </button>
            {createMutation.isError && (
              <p className="text-[11px] text-red-400">
                {(createMutation.error as any)?.message ??
                  "Erro ao salvar evento."}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-zinc-300">
            Lista de eventos
          </p>
          <span className="text-[10px] text-zinc-500">
            Estilo lista compacta que expande ao clicar.
          </span>
        </div>
        {isLoading && (
          <p className="text-[11px] text-zinc-500">Carregando eventos...</p>
        )}
        {error && (
          <p className="text-[11px] text-red-400">
            Erro ao carregar eventos. Tente recarregar a página.
          </p>
        )}
        <div className="space-y-1 text-xs">
          {data?.map((event) => {
            const isOverdue =
              event.dueDate &&
              new Date(event.dueDate).getTime() < Date.now() &&
              event.status !== EventStatus.COMPLETED;

            const priorityColorMap: Record<Priority, string> = {
              [Priority.LOW]: "bg-zinc-500",
              [Priority.MEDIUM]: "bg-emerald-500",
              [Priority.HIGH]: "bg-amber-400",
              [Priority.CRITICAL]: "bg-red-500",
            };

            return (
              <details
                key={event.id}
                className={`group rounded-xl border px-3 py-2 ${
                  isOverdue
                    ? "border-red-500/70 bg-red-950/40 font-semibold text-red-200 animate-pulse"
                    : "border-zinc-800 bg-zinc-950/80 text-zinc-100"
                }`}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-6 rounded-full ${priorityColorMap[event.priority]}`}
                    />
                    <span className="truncate">{event.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span>
                      {new Date(event.dueDate).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        deleteMutation.mutate(event.id);
                      }}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700/70 text-zinc-500 hover:border-red-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </summary>
                <div className="mt-2 space-y-1 text-[11px] text-zinc-300">
                  {event.brief && (
                    <p className="text-zinc-300">{event.brief}</p>
                  )}
                  {event.attachments.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {event.attachments.map((a) => (
                        <a
                          key={a.id}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-200 hover:border-emerald-400"
                        >
                          Anexo
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-[10px] text-zinc-500">
                    Para concluir ou adiar, edite o evento (próxima versão)
                    preenchendo o campo de descrição final com o motivo.
                  </p>
                </div>
              </details>
            );
          })}
          {data && data.length === 0 && (
            <p className="text-[11px] text-zinc-500">
              Nenhum evento cadastrado ainda para esta aba.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

