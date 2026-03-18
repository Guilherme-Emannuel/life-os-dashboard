"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { updateModule, createModule, deleteModule, getAllModules } from "./actions";

export default function ModulesAdminPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar módulos
  useEffect(() => {
    const loadModules = async () => {
      try {
        const data = await getAllModules();
        setModules(data);
      } catch (error) {
        console.error("Erro ao carregar módulos:", error);
      }
    };
    
    loadModules();
  }, []);

  // Handlers manuais
  const handleUpdate = async (formData: FormData) => {
    setLoading(true);
    try {
      await updateModule(formData);
      // Recarregar lista
      const data = await getAllModules();
      setModules(data);
    } catch (error) {
      console.error("Erro ao atualizar módulo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: FormData) => {
    setLoading(true);
    try {
      await createModule(formData);
      // Recarregar lista
      const data = await getAllModules();
      setModules(data);
    } catch (error) {
      console.error("Erro ao criar módulo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (formData: FormData) => {
    if (!confirm("Tem certeza que deseja excluir este módulo?")) return;
    
    setLoading(true);
    try {
      await deleteModule(formData);
      // Recarregar lista
      const data = await getAllModules();
      setModules(data);
    } catch (error) {
      console.error("Erro ao excluir módulo:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 bg-gradient-to-b from-slate-50 via-white to-blue-50 px-4 py-8 text-slate-900">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Gerenciar módulos
            </h1>
            <p className="text-sm text-slate-600">
              Renomeie, oculte, exclua ou crie novas abas para o seu Life OS.
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/50">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Módulos existentes
        </h2>
        <div className="space-y-3">
          {modules.map((module: any) => (
            <form
              key={module.id}
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdate(formData);
              }}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <input type="hidden" name="id" value={module.id} />
              <input
                name="name"
                defaultValue={module.name}
                className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={module.isActive}
                  className="h-4 w-4 rounded border-slate-300 bg-white text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                Visível
              </label>
              <button
                type="button"
                onClick={() => {
                  const formData = new FormData();
                  formData.set("id", module.id);
                  handleDelete(formData);
                }}
                className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                Excluir
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/50">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Novo módulo
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleCreate(formData);
          }}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
        >
          <input
            name="name"
            placeholder="Ex.: Saúde, Projetos, Família..."
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Adicionando..." : "Adicionar"}
          </button>
        </form>
      </section>
    </div>
  );
}

