"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Calendar, Flag, Edit2, X, ChevronLeft } from "lucide-react";
import { formatEventDate, getDateStatus, getDateColor, getAreaColor } from "@/lib/nlp-parser";
import { formatForInput, formatLocalDate } from "@/lib/timezone";
import { formatWithTimezone, fromNaiveISOString } from "@/lib/naive-date";

// Definição manual de tipos
type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type EventStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
type EventType = "TASK" | "EVENT" | "REMINDER";

interface EventWithExtras {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: Priority;
  brief: string | null;
  startDate: string;
  dueDate: string;
  moduleId: string;
  module?: { id: string; name: string; };
  attachments: { id: string; url: string; name?: string; mimeType?: string }[];
}

async function fetchEvents(moduleId?: string, type?: "TASK" | "EVENT" | "ALL", status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "ALL", priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "ALL"): Promise<EventWithExtras[]> {
  const params = new URLSearchParams();
  if (moduleId) params.set("moduleId", moduleId);
  if (type && type !== "ALL") params.set("type", type);
  if (status && status !== "ALL") params.set("status", status);
  if (priority && priority !== "ALL") params.set("priority", priority);

  const url = `/api/events?${params.toString()}`;

  const res = await fetch(url, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Erro ao carregar eventos");
  
  const events = await res.json();
  return events;
}

interface EventsBoardProps {
  moduleId?: string;
  filterType?: "TASK" | "EVENT" | "ALL";
  filterStatus?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "ALL";
  filterPriority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "ALL";
}

export function EventsBoard({ 
  moduleId: propModuleId, 
  filterType: propFilterType = "ALL", 
  filterStatus: propFilterStatus = "ALL", 
  filterPriority: propFilterPriority = "ALL" 
}: EventsBoardProps) {
  const qc = useQueryClient();
  const [editingEvent, setEditingEvent] = useState<EventWithExtras | null>(null);
  const [showEditPanel, setShowEditPanel] = useState(false);
  
  // Estados locais para filtros
  const [selectedModuleId, setSelectedModuleId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "ALL">(propFilterStatus);
  const [selectedPriority, setSelectedPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "ALL">(propFilterPriority);

  // Buscar módulos dinamicamente
  const { data: modules = [] } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const res = await fetch("/api/modules");
      if (!res.ok) throw new Error("Erro ao carregar módulos");
      return res.json();
    },
  });

  // Usar estados locais em vez das props
  const moduleId = selectedModuleId === "ALL" ? undefined : selectedModuleId;
  const filterType = propFilterType;
  const filterStatus = selectedStatus === "ALL" ? undefined : selectedStatus;
  const filterPriority = selectedPriority === "ALL" ? undefined : selectedPriority;

  const { data, isLoading, error } = useQuery({
    queryKey: ["events", moduleId, filterType, filterStatus, filterPriority],
    queryFn: () => fetchEvents(moduleId, filterType, filterStatus, filterPriority),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao deletar evento");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Evento excluído com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir evento");
    },
  });

  if (isLoading) return <div className="text-center text-slate-500">Carregando...</div>;
  if (error) return <div className="text-red-600">Erro ao carregar eventos</div>;

  const filteredEvents = data?.filter(event => {
    const typeMatch = filterType === "ALL" || event.type === filterType;
    const statusMatch = !filterStatus || event.status === filterStatus;
    const priorityMatch = !filterPriority || event.priority === filterPriority;
    const matches = typeMatch && statusMatch && priorityMatch;
    
    return matches;
  }) || [];

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/50">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {filterType === "TASK" ? "Tarefas" : filterType === "EVENT" ? "Eventos" : "Todos os itens"}
          </h2>
          <span className="text-sm text-slate-600">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
        
        {/* Filtros de Módulo, Status e Prioridade */}
        <div className="mb-4 flex gap-2 flex-wrap">
          {/* Filtro de Módulo */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-700">Área:</label>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todas</option>
              {modules.map((module: any) => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Filtro de Status */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-700">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendente</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="COMPLETED">Concluído</option>
              <option value="OVERDUE">Atrasado</option>
            </select>
          </div>
          
          {/* Filtro de Prioridade */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-700">Prioridade:</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as any)}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todas</option>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          {filteredEvents.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onDelete={() => deleteMutation.mutate(event.id)}
              onEdit={() => {
                setEditingEvent(event);
                setShowEditPanel(true);
              }}
            />
          ))}
          
          {filteredEvents.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <div className="mb-2">
                {filterType === "TASK" ? "📝" : filterType === "EVENT" ? "📅" : "📋"}
              </div>
              <p className="text-sm">
                {filterType === "TASK" 
                  ? "Nenhuma tarefa encontrada" 
                  : filterType === "EVENT" 
                  ? "Nenhum evento encontrado" 
                  : "Nenhum item encontrado"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      <EditPanel 
        isOpen={showEditPanel}
        onClose={() => {
          setShowEditPanel(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
      />
    </>
  );
}

function EventCard({ event, onDelete, onEdit }: {
  event: EventWithExtras;
  onDelete: () => void;
  onEdit: () => void;
}) {
  // Verificação de segurança antes de processar
  if (!event || !event.dueDate) {
    return (
      <div className="group rounded-lg border border-slate-200 bg-white p-3">
        <div className="text-red-500">Dados do evento inválidos</div>
      </div>
    );
  }

  const dueDate = new Date(event.dueDate);
  const dateStatus = getDateStatus(dueDate);
  const dateColorClass = getDateColor(dateStatus);
  
  const priorityColors = {
    CRITICAL: "text-red-600 bg-red-50 border-red-200",
    HIGH: "text-orange-600 bg-orange-50 border-orange-200", 
    MEDIUM: "text-blue-600 bg-blue-50 border-blue-200",
    LOW: "text-slate-600 bg-slate-50 border-slate-200",
  };

  return (
    <div className="group rounded-lg border border-slate-200 bg-white p-3 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-slate-900 truncate">{event.title}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors[event.priority]}`}>
              {event.priority}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${dateColorClass}`}>
              <Calendar className="h-3 w-3" />
              {formatWithTimezone(dueDate)}
            </span>
            
            {event.module && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded border ${getAreaColor(event.module.id)}`}>
                {event.module.name}
              </span>
            )}
            
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {event.type === "TASK" ? "📝 Tarefa" : "📅 Evento"}
            </span>
          </div>
          
          {event.brief && (
            <p className="mt-2 text-sm text-slate-600 line-clamp-2">{event.brief}</p>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EditPanel({ isOpen, onClose, event }: {
  isOpen: boolean;
  onClose: () => void;
  event: EventWithExtras | null;
}) {
  const qc = useQueryClient();
  const [uploadingFile, setUploadingFile] = useState(false);
  
  if (!isOpen || !event) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    
    try {
      // Upload do arquivo
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('Erro ao fazer upload');
      
      const uploadData = await uploadRes.json();
      
      // Vincular anexo ao evento
      const attachmentRes = await fetch(`/api/events/${event.id}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: uploadData.url,
          name: uploadData.name,
          mimeType: uploadData.mimeType
        })
      });
      
      if (!attachmentRes.ok) throw new Error('Erro ao vincular anexo');
      
      // Invalidar queries para atualizar a lista
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      qc.invalidateQueries({ queryKey: ["monitoring-events"] });
      qc.invalidateQueries({ queryKey: ["overdue-items"] });
      
      toast.success('Arquivo anexado com sucesso!');
      
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao anexar arquivo');
    } finally {
      setUploadingFile(false);
      // Limpar o input
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Tem certeza que deseja remover este anexo?')) return;
    
    try {
      const res = await fetch(`/api/events/${event.id}/attachments?attachmentId=${attachmentId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Erro ao remover anexo');
      
      // Invalidar queries para atualizar a lista
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      qc.invalidateQueries({ queryKey: ["monitoring-events"] });
      qc.invalidateQueries({ queryKey: ["overdue-items"] });
      
      toast.success('Anexo removido com sucesso!');
      
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao remover anexo');
    }
  };

  const handleSave = async (formData: FormData) => {
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          brief: formData.get("brief"),
          priority: formData.get("priority"),
          type: formData.get("type"),
          status: formData.get("status"), // Adicionando status
          dueDate: formData.get("dueDate"),
        }),
      });
      
      if (!res.ok) throw new Error("Erro ao salvar evento");
      
      // Invalidar queries para atualizar EventsBoard e CalendarBoard
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      qc.invalidateQueries({ queryKey: ["monitoring-events"] });
      qc.invalidateQueries({ queryKey: ["overdue-items"] });
      
      toast.success("Evento atualizado com sucesso!");
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao salvar evento");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="ml-auto relative h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Editar Evento</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleSave(formData);
        }}>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
              <input
                name="title"
                type="text"
                defaultValue={event.title}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
              <textarea
                name="brief"
                defaultValue={event.brief || ""}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={event.status}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING">Pendente</option>
                  <option value="IN_PROGRESS">Em andamento</option>
                  <option value="COMPLETED">Concluído</option>
                  <option value="OVERDUE">Atrasado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
                <select
                  name="priority"
                  defaultValue={event.priority}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <select
                name="type"
                defaultValue={event.type}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TASK">Tarefa</option>
                <option value="EVENT">Evento</option>
                <option value="REMINDER">Lembrete</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data de Vencimento</label>
              <input
                name="dueDate"
                type="datetime-local"
                defaultValue={formatForInput(event.dueDate)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Seção de Anexos */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Anexos</label>
              
              {/* Lista de anexos existentes */}
              {event.attachments && event.attachments.length > 0 && (
                <div className="space-y-2 mb-3">
                  {event.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <a 
                        href={attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 flex-1 min-w-0"
                      >
                        📎 {attachment.name || attachment.url.split('/').pop() || 'Arquivo sem nome'}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Remover anexo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload de novo anexo */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="file-upload"
                  className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  📎 Escolher arquivo
                </label>
                {uploadingFile && (
                  <span className="text-sm text-slate-500">Enviando...</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
