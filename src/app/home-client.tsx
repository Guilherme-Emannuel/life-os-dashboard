"use client";

import { Settings2, LogOut } from "lucide-react";
import Link from "next/link";
import { EventsBoard } from "@/components/events-board";
import { CalendarBoard } from "@/components/calendar-board";
import { QuickCaptureForm } from "@/components/quick-capture-form";
import { useRealtimeMonitoring, OverdueAlerts } from "@/hooks/use-realtime-monitoring";
import { usePersistentReminders, CriticalAlertModal } from "@/hooks/use-persistent-reminders";
import { toast } from "sonner";

interface HomeClientProps {
  modules: any[];
  dayProgress: number;
  hasCritical: boolean;
}

export default function HomeClient({ 
  modules, 
  dayProgress, 
  hasCritical
}: HomeClientProps) {
  const { overdueItems } = useRealtimeMonitoring();
  const { activeAlert, handleComplete, handlePostpone, handleDismiss } = usePersistentReminders();
  const firstModule = modules[0];

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer logout');
      }

      toast.success('Logout realizado com sucesso!');
      window.location.href = '/login';

    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout. Tente novamente.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-blue-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
              OS
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-900">
                Life OS
              </span>
              <span className="text-xs text-slate-600">
                Seu painel unificado de gestão pessoal
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <Link
              href="/admin/modules"
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Gerenciar módulos
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm transition hover:border-red-400 hover:bg-red-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6">
        {/* Painel de Pendências Urgentes */}
        <OverdueAlerts overdueItems={overdueItems} />

        <section className="grid gap-4 md:grid-cols-[minmax(0,2fr),minmax(0,1.1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/50">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-sm font-semibold text-slate-900">
                  Hoje
                </h1>
                <p className="text-xs text-slate-600">
                  Barra mostra quanto do seu dia já passou.
                </p>
              </div>
              <span className="rounded-full bg-blue-500 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white">
                Antiesquecimento ligado
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Progresso do dia</span>
                <span className="font-medium text-slate-800">
                  {dayProgress}%
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 transition-all`}
                  style={{ width: `${dayProgress}%` }}
                />
                {dayProgress > 75 && hasCritical && (
                  <div className="pointer-events-none absolute inset-0 animate-pulse bg-blue-500/20" />
                )}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                Tarefas{" "}
                <span className="font-semibold text-blue-700">
                  críticas abertas
                </span>{" "}
                vão ganhar destaque visual e notificações conforme o dia
                termina.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/50">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">
                Captura rápida
              </p>
              <span className="text-[10px] text-slate-500">
                Pense pouco, capture tudo.
              </span>
            </div>
            <QuickCaptureForm modules={modules} />
            <p className="mt-2 text-[11px] text-slate-600">
              O sistema organiza isso depois nas categorias corretas.
            </p>
          </div>
        </section>

        <section className="mt-1 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/50">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-medium text-slate-700">
              Áreas da sua vida
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {modules.map((module: any) => (
              <button
                key={module.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                {module.name}
              </button>
            ))}
          </div>
          <p className="mt-1 px-1 text-[11px] text-slate-600">
            <Link 
              href="/admin/modules"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Gerencie seus módulos aqui
            </Link>{" "}
            para renomear, ocultar, excluir ou criar novas abas como Saúde, Projetos, etc.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-[minmax(0,1.2fr),minmax(0,1.1fr)] mb-4 flex-1">
          <div className="space-y-4">
            <EventsBoard 
              filterType="TASK" 
              filterStatus="ALL"
              filterPriority="ALL"
            />
            <EventsBoard 
              filterType="EVENT" 
              filterStatus="ALL"
              filterPriority="ALL"
            />
          </div>
          <div className="min-h-[260px]">
            <CalendarBoard />
          </div>
        </section>
      </main>
      
      {/* Modal de Alerta Crítico */}
      {activeAlert && (
        <CriticalAlertModal
          reminder={activeAlert!}
          onDismiss={handleDismiss}
          onComplete={handleComplete}
          onPostpone={handlePostpone}
        />
      )}
    </div>
  );
}
