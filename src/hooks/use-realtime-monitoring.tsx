import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatLocalDate, fromLocalISOString } from "@/lib/timezone";

interface OverdueItem {
  id: string;
  title: string;
  dueDate: string;
  type: string;
  priority: string;
  status: string;
}

// Hook para monitoramento em tempo real de eventos
export function useRealtimeMonitoring() {
  const qc = useQueryClient();
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

  // Buscar eventos pendentes e em andamento
  const { data: events } = useQuery({
    queryKey: ["monitoring-events"],
    queryFn: async () => {
      const res = await fetch("/api/events?status=PENDING&status=IN_PROGRESS");
      if (!res.ok) throw new Error("Erro ao buscar eventos");
      return res.json();
    },
    // refetchInterval: 300000, // TEMPORARIAMENTE DESABILITADO PARA EVITAR SOBRECARGA
  });

  // Solicitar permissão para notificações do navegador
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        setHasNotificationPermission(permission === "granted");
      });
    } else if ("Notification" in window) {
      setHasNotificationPermission(Notification.permission === "granted");
    }
  }, []);

  // Verificar eventos que atingiram o prazo
  const checkDueEvents = useCallback(() => {
    if (!events) return;

    const now = new Date();
    const notifiedEvents = new Set<string>(); // Evitar notificações duplicadas

    events.forEach((event: any) => {
      const eventDate = fromLocalISOString(event.dueDate);
      const eventId = event.id;

      // Pular se já notificado recentemente
      if (notifiedEvents.has(eventId)) return;

      // Comparação local estrita - usar apenas timestamps
      const nowTime = now.getTime();
      const eventTime = eventDate.getTime();
      const timeDiff = eventTime - nowTime;
      
      // Lógica estrita: só está atrasado se o tempo do evento for menor que agora
      const isOverdue = eventTime < nowTime;
      const isDue = Math.abs(timeDiff) <= 30000; // ±30 segundos para notificação

      if (isDue && event.status !== "COMPLETED") {
        // Notificação Sonner
        toast.error(`⏰ Evento atingiu o prazo: ${event.title}`, {
          description: `Horário: ${formatLocalDate(event.dueDate)}`,
          duration: 10000,
          action: {
            label: "Ver detalhes",
            onClick: () => {
              // Abrir modal do evento (implementar lógica)
              window.dispatchEvent(new CustomEvent("open-event-modal", { detail: { eventId: event.id } }));
            },
          },
        });

        // Notificação nativa do navegador
        if (hasNotificationPermission) {
          new Notification("⏰ Evento atingiu o prazo", {
            body: `${event.title}\nHorário: ${formatLocalDate(event.dueDate)}`,
            icon: "/favicon.ico",
            tag: eventId,
          });
        }

        notifiedEvents.add(eventId);
      }
    });
  }, [events, hasNotificationPermission]);

  // Buscar itens atrasados
  const { data: overdueItems } = useQuery({
    queryKey: ["overdue-items"],
    queryFn: async () => {
      const now = new Date();
      const nowTime = now.getTime();
      
      // Criar string ingênua para comparar com o banco (sem timezone)
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getMinutes()).padStart(2, '0');
      
      const naiveNowISO = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      
      // Buscar eventos pendentes/em andamento com dueDate antes de agora (local)
      const res = await fetch(`/api/events?status=PENDING&status=IN_PROGRESS&dueDate_before=${naiveNowISO}`);
      if (!res.ok) throw new Error("Erro ao buscar itens atrasados");
      const items = await res.json();
      
      // FILTRO DUPO: Validar localmente cada item para garantir que está realmente atrasado
      const trulyOverdueItems = items.filter((item: any) => {
        // Converter dueDate do banco para Date local
        const eventDate = fromLocalISOString(item.dueDate);
        const eventTime = eventDate.getTime();
        
        // Regra estrita: só está atrasado se o tempo do evento for MENOR que agora
        const isActuallyOverdue = eventTime < nowTime;
        
        return isActuallyOverdue;
      });
      
      return trulyOverdueItems;
    },
  });

  return {
    overdueItems: overdueItems || [],
    hasNotificationPermission,
    events,
  };
}

// Componente para exibir itens atrasados
export function OverdueAlerts({ overdueItems }: { overdueItems: OverdueItem[] }) {
  if (overdueItems.length === 0) return null;

  return (
    <div className="mb-4 rounded-2xl border-2 border-red-500/50 bg-red-950/40 p-4 shadow-lg shadow-red-500/20 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-red-100 flex items-center gap-2">
          <span className="text-2xl">🚨</span>
          Pendências Urgentes
        </h3>
        <span className="rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white">
          {overdueItems.length} {overdueItems.length === 1 ? 'item' : 'itens'}
        </span>
      </div>
      
      <div className="space-y-2">
        {overdueItems.map((item) => (
          <OverdueItemCard key={item.id} item={item} />
        ))}
      </div>
      
      <div className="mt-3 text-xs text-red-200">
        ⚠️ Esses itens passaram do prazo e precisam de atenção imediata
      </div>
    </div>
  );
}

// Card individual para item atrasado
function OverdueItemCard({ item }: { item: OverdueItem }) {
  const qc = useQueryClient();

  const handleQuickComplete = async () => {
    try {
      const res = await fetch(`/api/events/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      
      if (!res.ok) throw new Error("Erro ao concluir item");
      
      toast.success("Item marcado como concluído!");
      
      // Invalidar queries para atualizar UI
      qc.invalidateQueries({ queryKey: ["overdue-items"] });
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      qc.invalidateQueries({ queryKey: ["monitoring-events"] });
    } catch (error: any) {
      toast.error(error?.message || "Erro ao concluir item");
    }
  };

  const handleOpenModal = () => {
    // Disparar evento para abrir modal (implementar com estado global)
    window.dispatchEvent(new CustomEvent("open-event-modal", { detail: { eventId: item.id } }));
  };

  // Cálculo de tempo relativo usando data local estrita
  const now = new Date();
  const eventDate = fromLocalISOString(item.dueDate);
  const nowTime = now.getTime();
  const eventTime = eventDate.getTime();
  
  // Só calcular atraso se realmente estiver atrasado (evitar valores negativos)
  const timeDiff = nowTime - eventTime;
  const overdueHours = timeDiff > 0 ? Math.floor(timeDiff / (1000 * 60 * 60)) : 0;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-red-900/30 border border-red-500/30 hover:bg-red-900/50 transition-colors cursor-pointer group">
      <div className="flex-1" onClick={handleOpenModal}>
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-red-100 group-hover:text-white transition-colors">
            {item.title}
          </h4>
          <span className={`text-xs px-2 py-1 rounded-full ${
            item.priority === "CRITICAL" ? "bg-red-500 text-white" :
            item.priority === "HIGH" ? "bg-orange-500 text-white" :
            "bg-yellow-500 text-black"
          }`}>
            {item.priority === "CRITICAL" ? "Crítica" :
             item.priority === "HIGH" ? "Alta" :
             item.priority === "MEDIUM" ? "Média" : "Baixa"}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-red-200">
          <span className="flex items-center gap-1">
            ⏰ {formatLocalDate(item.dueDate)}
          </span>
          <span className="text-red-400 font-medium">
            Atrasado há {overdueHours}h
          </span>
          <span className="text-red-300">
            {item.type === "TASK" ? "📝 Tarefa" : "📅 Evento"}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2 ml-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenModal();
          }}
          className="px-3 py-1.5 text-xs font-medium text-red-100 bg-red-800/50 hover:bg-red-700/50 rounded-lg transition-colors"
        >
          Editar
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleQuickComplete();
          }}
          className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
        >
          Concluir
        </button>
      </div>
    </div>
  );
}
