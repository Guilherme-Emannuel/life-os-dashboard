import { getActiveModules } from "@/lib/modules";
import { ArrowRightCircle, Plus, Settings2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getDayProgress() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const ratio = Math.min(Math.max(elapsed / total, 0), 1);
  return Math.round(ratio * 100);
}

export default async function Home() {
  const [modules, dayProgress] = await Promise.all([
    getActiveModules(),
    getDayProgress(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-950 via-zinc-950 to-black text-zinc-50">
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-zinc-100">
              OS
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-300">
                Life OS
              </span>
              <span className="text-xs text-zinc-500">
                Seu painel unificado de gestão pessoal
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <Link
              href="/admin/modules"
              className="inline-flex items-center gap-1 rounded-full border border-zinc-700/80 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-200 shadow-sm transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Gerenciar módulos
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6">
        <section className="grid gap-4 md:grid-cols-[minmax(0,2fr),minmax(0,1.1fr)]">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 shadow-lg shadow-black/40">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-sm font-semibold text-zinc-100">
                  Hoje
                </h1>
                <p className="text-xs text-zinc-500">
                  Barra mostra quanto do seu dia já passou.
                </p>
              </div>
              <span className="rounded-full bg-zinc-900 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
                Antiesquecimento ligado
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Progresso do dia</span>
                <span className="font-medium text-zinc-200">
                  {dayProgress}%
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-red-500 transition-all`}
                  style={{ width: `${dayProgress}%` }}
                />
                {dayProgress > 75 && (
                  <div className="pointer-events-none absolute inset-0 animate-pulse bg-red-500/20" />
                )}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                Tarefas{" "}
                <span className="font-semibold text-red-400">
                  críticas abertas
                </span>{" "}
                vão ganhar destaque visual e notificações conforme o dia
                termina.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-4 shadow-lg shadow-black/40">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-100">
                Captura rápida
              </p>
              <span className="text-[10px] text-zinc-500">
                Pense pouco, capture tudo.
              </span>
            </div>
            <form
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/90 px-3 py-2.5 text-xs shadow-inner shadow-black/60"
            >
              <Plus className="h-4 w-4 text-emerald-400" />
              <input
                type="text"
                placeholder="Escreva em 2 segundos o que não quer esquecer..."
                className="h-7 flex-1 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-400"
              >
                salvar
                <ArrowRightCircle className="h-3.5 w-3.5" />
              </button>
            </form>
            <p className="mt-2 text-[11px] text-zinc-500">
              O sistema organiza isso depois nas categorias corretas.
            </p>
          </div>
        </section>

        <section className="mt-1 flex flex-col gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-3 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-medium text-zinc-300">
              Áreas da sua vida
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {modules.map((module) => (
              <button
                key={module.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-[11px] font-medium text-zinc-200 shadow-sm transition hover:border-zinc-600 hover:bg-zinc-900"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {module.name}
              </button>
            ))}
          </div>
          <p className="mt-1 px-1 text-[11px] text-zinc-500">
            Use o painel de administração para renomear, ocultar, excluir ou
            criar novas abas como Saúde, Projetos, etc.
          </p>
        </section>

        {/* A área principal de conteúdo (tarefas, calendário etc.) será construída nos próximos passos */}
        <section className="mb-4 flex-1 rounded-2xl border border-dashed border-zinc-800/80 bg-zinc-950/60 px-4 py-8 text-center text-xs text-zinc-500">
          Em breve: visão de Hoje com tarefas críticas, calendário interativo,
          filtros por tipo/prioridade/status e lista estilo Notion.
        </section>
      </main>
    </div>
  );
}

