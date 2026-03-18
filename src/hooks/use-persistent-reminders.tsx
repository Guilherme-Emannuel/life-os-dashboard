"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface ReminderAlert {
  id: string;
  title: string;
  dueDate: string;
  eventId: string;
}

interface CriticalAlertModalProps {
  reminder: ReminderAlert;
  onDismiss: () => void;
  onComplete: (eventId: string) => void;
  onPostpone: (eventId: string) => void;
}

function CriticalAlertModal({ reminder, onDismiss, onComplete, onPostpone }: CriticalAlertModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Tocar som de alerta
  useEffect(() => {
    if (!isPlaying) return;
    
    // Usar áudio pré-carregado para evitar bloqueio autoplay
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    
    audio.play().catch(error => {
      console.log("🔊 Erro ao tocar áudio:", error);
      // Fallback para Web Audio API se o arquivo não funcionar
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        setTimeout(() => {
          oscillator.stop();
          setIsPlaying(false);
        }, 500);
      } catch (fallbackError) {
        console.error("❌ Erro no fallback de áudio:", fallbackError);
        setIsPlaying(false);
      }
    });
    
    // Reset do estado após tocar
    setTimeout(() => {
      setIsPlaying(false);
    }, 1000);
  }, [isPlaying]);

  const handleComplete = () => {
    onComplete(reminder.eventId);
    onDismiss();
  };

  const handlePostpone = () => {
    onPostpone(reminder.eventId);
    onDismiss();
  };

  const handlePlaySound = () => {
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 animate-pulse">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border-4 border-red-500">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900">⚠️ Lembrete Crítico</h3>
              <p className="text-sm text-red-700">Horário do lembrete atingido!</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-red-600" />
          </button>
        </div>
        
        <div className="mb-6">
          <h4 className="font-semibold text-slate-900 mb-2">{reminder.title}</h4>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="h-4 w-4" />
            <span>{new Date(reminder.dueDate).toLocaleString('pt-BR')}</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handlePlaySound}
            disabled={isPlaying}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Clock className="h-4 w-4" />
            {isPlaying ? "Tocando..." : "Tocar Alarme"}
          </button>
          
          <button
            onClick={handlePostpone}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Adiar 5 min
          </button>
          
          <button
            onClick={handleComplete}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

export function usePersistentReminders() {
  const [activeAlert, setActiveAlert] = useState<ReminderAlert | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Solicitar permissão de notificação
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then((perm) => {
        setPermission(perm);
        console.log("🔔 Permissão de notificação:", perm);
      });
    }
  }, []);

  // Verificar lembretes a cada 30 segundos
  const checkReminders = useCallback(async () => {
    console.log("🔍 Verificando lembretes...");
    
    try {
      const now = new Date();
      const nowISO = now.toISOString();
      
      // Buscar lembretes que deveriam disparar
      const res = await fetch(`/api/reminders?due_before=${nowISO}`);
      if (!res.ok) throw new Error("Erro ao buscar lembretes");
      
      const reminders = await res.json();
      console.log("📋 Lembretes encontrados:", reminders.length, reminders);
      
      // Encontrar o lembrete mais crítico (mais atrasado)
      const criticalReminder = reminders
        .filter((r: any) => new Date(r.remindAt) <= now)
        .sort((a: any, b: any) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime())[0];
      
      if (criticalReminder) {
        console.log("🚨 Lembrete crítico detectado:", criticalReminder);
        console.log("🔔 Disparando alarme para:", criticalReminder.event.title);
        
        // Disparar notificação nativa
        if (permission === 'granted') {
          new Notification("⚠️ Lembrete Crítico", {
            body: `${criticalReminder.event.title}\nHorário: ${new Date(criticalReminder.remindAt).toLocaleString('pt-BR')}`,
            icon: "/favicon.ico",
            tag: criticalReminder.id,
            requireInteraction: true,
          });
        }
        
        // Mostrar modal de alerta
        setActiveAlert({
          id: criticalReminder.id,
          title: criticalReminder.event.title,
          dueDate: criticalReminder.remindAt,
          eventId: criticalReminder.eventId,
        });
      }
    } catch (error) {
      console.error("❌ Erro ao verificar lembretes:", error);
    }
  }, [permission]);

  useEffect(() => {
    // Verificar imediatamente
    checkReminders();
    
    // Configurar verificação a cada 30 segundos
    const interval = setInterval(checkReminders, 30000);
    
    return () => clearInterval(interval);
  }, [checkReminders]);

  const handleComplete = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      
      if (!res.ok) throw new Error("Erro ao concluir evento");
      
      console.log("✅ Evento concluído via alerta:", eventId);
    } catch (error) {
      console.error("❌ Erro ao concluir evento:", error);
    }
  };

  const handlePostpone = async (reminderId: string) => {
    try {
      // Adiar 5 minutos
      const newDate = new Date(Date.now() + 5 * 60 * 1000);
      
      const res = await fetch(`/api/reminders/${reminderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          remindAt: newDate.toISOString()
        }),
      });
      
      if (!res.ok) throw new Error("Erro ao adiar lembrete");
      
      console.log("⏰ Lembrete adiado:", reminderId, newDate);
    } catch (error) {
      console.error("❌ Erro ao adiar lembrete:", error);
    }
  };

  const handleDismiss = () => {
    setActiveAlert(null);
  };

  return {
    activeAlert,
    handleComplete,
    handlePostpone,
    handleDismiss,
    permission,
  };
}

export { CriticalAlertModal };
