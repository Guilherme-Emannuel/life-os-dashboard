"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

async function quickCapture(text: string) {
  const res = await fetch("/api/quick-capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error("Erro ao capturar rapidamente");
  }
}

export function QuickCaptureFloating() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!text.trim()) return;
    try {
      setLoading(true);
      setError(null);
      await quickCapture(text.trim());
      setText("");
      setOpen(false);
    } catch (err: any) {
      setError(err?.message ?? "Erro ao salvar captura rápida.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 shadow-xl shadow-emerald-500/40 transition hover:bg-emerald-400"
      >
        <Plus className="h-6 w-6" />
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-4 pb-16 sm:items-center sm:pb-0">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/60">
            <p className="mb-2 text-xs font-medium text-zinc-200">
              Captura rápida
            </p>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite em 2 segundos o que acabou de lembrar. O sistema organiza depois."
              rows={3}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
            {error && (
              <p className="mt-1 text-[11px] text-red-400">{error}</p>
            )}
            <div className="mt-3 flex justify-end gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-zinc-200 hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading || !text.trim()}
                onClick={onSubmit}
                className="rounded-md bg-emerald-500 px-3 py-1 font-semibold text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/40"
              >
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

