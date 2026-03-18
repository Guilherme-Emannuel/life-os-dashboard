"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatEventDate } from "@/lib/nlp-parser";
import { formatForInput } from "@/lib/timezone";
import { RemindersSection } from "@/components/reminders-section";

// Definição manual de tipos para evitar importar o Prisma Client no navegador
type EventStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
type EventType = "TASK" | "EVENT" | "REMINDER";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
};

const priorityColor: Record<Priority, string> = {
  LOW: "#64748b", // slate-500
  MEDIUM: "#3b82f6", // blue-500
  HIGH: "#f97316", // orange-500
  CRITICAL: "#ef4444", // red-500
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

  return events;
}

export function CalendarBoard() {
  const [type, setType] = useState<"ALL" | EventType>("ALL");
  const [status, setStatus] = useState<"ALL" | EventStatus>("ALL");
  const [priority, setPriority] = useState<"ALL" | Priority>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [eventStatus, setEventStatus] = useState<string>("");
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["calendar-events", type, status, priority],
    queryFn: () => fetchCalendarEvents({ type, status, priority }),
  });

  // Listener para eventos customizados (abrir modal via Pendências Urgentes)
  useEffect(() => {
    const handleOpenModal = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventId = customEvent.detail.eventId;
      
      // Buscar evento completo
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (res.ok) {
          const eventData = await res.json();
          setSelectedEvent(eventData);
          setEditForm(eventData);
          setEventStatus(eventData.status || "PENDING");
          setShowModal(true);
          setIsEditing(false);
        }
      } catch (error) {
        console.error("Erro ao buscar evento:", error);
      }
    };

    window.addEventListener("open-event-modal", handleOpenModal);
    
    return () => {
      window.removeEventListener("open-event-modal", handleOpenModal);
    };
  }, []);

  // Mapear eventos para o formato do FullCalendar com cores
  const calendarEvents = (data as any[])?.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startDate,
    end: e.dueDate,
    backgroundColor: priorityColor[e.priority as Priority] || "#71717a",
    borderColor: priorityColor[e.priority as Priority] || "#71717a",
  })) || [];

  const handleEventClick = (info: any) => {
    // Encontrar o evento completo nos dados
    const fullEvent = (data as any[])?.find(e => e.id === info.event.id);
    setSelectedEvent(fullEvent);
    setEditForm(fullEvent || {});
    setEventStatus(fullEvent?.status || "PENDING");
    setShowModal(true);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao deletar evento");
      
      // Invalidar queries para atualizar todos os componentes
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      
      toast.success("Evento excluído com sucesso!");
      setShowModal(false);
      setSelectedEvent(null);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao deletar evento");
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedEvent) return;
    
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, status: eventStatus }),
      });
      
      if (!res.ok) throw new Error("Erro ao salvar evento");
      
      // Invalidar queries para atualizar todos os componentes
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      qc.invalidateQueries({ queryKey: ["monitoring-events"] });
      qc.invalidateQueries({ queryKey: ["overdue-items"] });
      
      toast.success("Evento atualizado com sucesso!");
      setShowModal(false);
      setSelectedEvent(null);
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar evento");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/50">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">
            Calendário interativo
          </p>
          <p className="text-xs text-slate-600">
            Visualize compromissos por tipo, prioridade e status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <option value="ALL">Todos os tipos</option>
            <option value="TASK">Tarefas</option>
            <option value="EVENT">Eventos</option>
            <option value="REMINDER">Lembretes</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <option value="ALL">Todos os status</option>
            <option value="PENDING">Pendentes</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="COMPLETED">Concluídos</option>
            <option value="OVERDUE">Atrasados</option>
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            <option value="ALL">Todas as prioridades</option>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="CRITICAL">Crítica</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-slate-600 text-center py-4">
          Carregando eventos do calendário...
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 text-center py-4">
          Erro ao carregar calendário. Tente recarregar a página.
        </p>
      )}

      {data && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2">
          <style jsx>{`
            .fc {
              --fc-border-color: #e2e8f0;
              --fc-button-bg-color: #3b82f6;
              --fc-button-text-color: #ffffff;
              --fc-button-hover-bg-color: #2563eb;
              --fc-button-active-bg-color: #1d4ed8;
              --fc-event-bg-color: #3b82f6;
              --fc-event-border-color: #2563eb;
              --fc-event-text-color: #ffffff;
              --fc-today-bg-color: #eff6ff;
              --fc-non-business-color: #f8fafc;
            }
            .fc .fc-button-primary {
              background-color: var(--fc-button-bg-color);
              color: var(--fc-button-text-color);
            }
            .fc .fc-button-primary:hover {
              background-color: var(--fc-button-hover-bg-color);
            }
            .fc .fc-daygrid-day.fc-day-today {
              background-color: var(--fc-today-bg-color);
            }
            .fc .fc-event {
              background-color: var(--fc-event-bg-color);
              border-color: var(--fc-event-border-color);
              color: var(--fc-event-text-color);
            }
          `}</style>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            height="auto"
            events={calendarEvents}
            firstDay={1}
            eventClick={handleEventClick}
          />
        </div>
      )}

      {/* Modal de detalhes do evento */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Detalhes do Evento</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Título</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.title || ""}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium text-slate-900">{selectedEvent.title}</p>
                )}
              </div>
              
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Data e Hora</label>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    value={formatForInput(editForm.dueDate || selectedEvent.dueDate)}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-slate-600">
                    {formatEventDate(selectedEvent.startDate)}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição</label>
                {isEditing ? (
                  <textarea
                    value={editForm.brief || ""}
                    onChange={(e) => setEditForm({ ...editForm, brief: e.target.value })}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedEvent.brief || "Sem descrição"}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Prioridade</label>
                {isEditing ? (
                  <select
                    value={editForm.priority || selectedEvent.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="CRITICAL">Crítica</option>
                  </select>
                ) : (
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedEvent.priority === "CRITICAL" ? "bg-red-100 text-red-700" :
                      selectedEvent.priority === "HIGH" ? "bg-orange-100 text-orange-700" :
                      selectedEvent.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {selectedEvent.priority === "CRITICAL" ? "Crítica" :
                       selectedEvent.priority === "HIGH" ? "Alta" :
                       selectedEvent.priority === "MEDIUM" ? "Média" : "Baixa"}
                    </span>
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo</label>
                {isEditing ? (
                  <select
                    value={editForm.type || selectedEvent.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TASK">Tarefa</option>
                    <option value="EVENT">Evento</option>
                    <option value="REMINDER">Lembrete</option>
                  </select>
                ) : (
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedEvent.type === "TASK" ? "Tarefa" :
                     selectedEvent.type === "EVENT" ? "Evento" : "Lembrete"}
                  </p>
                )}
              </div>
              
              {selectedEvent.attachments && selectedEvent.attachments.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Anexos</label>
                  <div className="mt-1 space-y-1">
                    {selectedEvent.attachments.map((attachment: any) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        {attachment.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Campo de Status */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</label>
              {isEditing ? (
                <select
                  value={editForm.status || eventStatus}
                  onChange={(e) => {
                    setEditForm({ ...editForm, status: e.target.value });
                    setEventStatus(e.target.value);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING">Pendente</option>
                  <option value="IN_PROGRESS">Em andamento</option>
                  <option value="COMPLETED">Concluído</option>
                  <option value="OVERDUE">Atrasado</option>
                </select>
              ) : (
                <p className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    eventStatus === "COMPLETED" ? "bg-green-100 text-green-700" :
                    eventStatus === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                    eventStatus === "OVERDUE" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {eventStatus === "COMPLETED" ? "Concluído" :
                     eventStatus === "IN_PROGRESS" ? "Em andamento" :
                     eventStatus === "OVERDUE" ? "Atrasado" : "Pendente"}
                  </span>
                </p>
              )}
            </div>
            
            {/* Seção de Lembretes */}
            <RemindersSection
              eventId={selectedEvent.id}
              reminders={selectedEvent.reminders || []}
              eventDate={new Date(selectedEvent.dueDate)}
              onRemindersChange={(reminders) => {
                // Aqui você pode implementar a lógica para salvar lembretes
                // Por enquanto, apenas atualiza o estado local
                setSelectedEvent({
                  ...selectedEvent,
                  reminders,
                });
              }}
            />
            
            <div className="flex justify-between gap-2 pt-4 border-t border-slate-200">
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Apagar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                    >
                      Salvar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}