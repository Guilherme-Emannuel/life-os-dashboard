"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, Calendar, Flag, Target } from "lucide-react";
import { parseNaturalLanguage, ParsedEvent } from "@/lib/nlp-parser";
import { toLocalISOString, formatLocalDate } from "@/lib/timezone";
import { createNaiveISOString, debugTimezone } from "@/lib/naive-date";

interface QuickCaptureFormProps {
  modules: any[];
}

export function QuickCaptureForm({ modules }: QuickCaptureFormProps) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedEvent | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedType, setSelectedType] = useState<"TASK" | "EVENT">("TASK");

  // Set initial module when modules are loaded
  useEffect(() => {
    if (modules.length > 0 && !selectedArea) {
      setSelectedArea(modules[0].id);
    }
  }, [modules, selectedArea]);

  // Parse em tempo real
  const handleTextChange = (value: string) => {
    setText(value);
    if (value.trim()) {
      const parsed = parseNaturalLanguage(value);
      setParsedData(parsed);
    } else {
      setParsedData(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      setLoading(true);
      
      const parsed = parsedData || parseNaturalLanguage(text);
      
      // Usar apenas a data extraída pelo NLP como mestre
      const eventDate = parsed.date;
      
      // Verificar se a data é válida antes de processar
      if (!eventDate || isNaN(eventDate.getTime())) {
        console.log("⚠️ QuickCapture - Data inválida, usando agora:", eventDate);
        toast.error("Data inválida detectada, usando data atual");
        setLoading(false);
        return;
      }
      
      debugTimezone(eventDate, "QuickCapture - Event Date");
      
      // Criar string ingênua manualmente (sem Z)
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, '0');
      const day = String(eventDate.getDate()).padStart(2, '0');
      const hours = String(eventDate.getHours()).padStart(2, '0');
      const minutes = String(eventDate.getMinutes()).padStart(2, '0');
      const seconds = String(eventDate.getSeconds()).padStart(2, '0');
      
      const naiveDateString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      
      const eventData = {
        title: parsed.title,
        type: selectedType,
        priority: parsed.priority || "MEDIUM",
        startDate: naiveDateString,
        dueDate: naiveDateString,
        brief: text,
        moduleId: selectedArea || (modules[0]?.id || ""),
        attachmentUrls: [],
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      
      if (!res.ok) {
        console.error("❌ QuickCapture - Erro ao criar evento:", res.status, res.statusText);
        throw new Error("Erro ao salvar evento");
      }
      
      console.log("✅ QuickCapture - Evento criado com sucesso:", eventData);
      
      // Invalidar queries para atualizar EventsBoard e CalendarBoard
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      qc.invalidateQueries({ queryKey: ["monitoring-events"] });
      qc.invalidateQueries({ queryKey: ["overdue-items"] });
      
      toast.success("Evento criado com sucesso!");
      
      setText("");
      setParsedData(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao salvar captura rápida.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <form onSubmit={onSubmit} className="w-full">
        <div className="flex items-start gap-2 rounded-xl border border-slate-300 bg-slate-50 p-3 shadow-inner shadow-slate-200/60">
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Ex: 'Arrumar servidor até 15/03/2026 as 23:00 com importância média'"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              disabled={loading}
            />
            
            {parsedData && (
              <div className="flex flex-wrap gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                {parsedData.date && (
                  <div className="flex items-center gap-1 text-xs text-blue-700">
                    <Calendar className="h-3 w-3" />
                    {parsedData.date.toLocaleString('pt-BR')}
                  </div>
                )}
                {parsedData.priority && (
                  <div className="flex items-center gap-1 text-xs text-blue-700">
                    <Flag className="h-3 w-3" />
                    Prioridade: {parsedData.priority}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-blue-700">
                  <Target className="h-3 w-3" />
                  Título: "{parsedData.title}"
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Área da Vida</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as "TASK" | "EVENT")}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TASK">Tarefa</option>
                <option value="EVENT">Evento</option>
              </select>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="mt-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
