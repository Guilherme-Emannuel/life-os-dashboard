"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatLocalDate, formatForInput, toLocalISOString } from "@/lib/timezone";
import { Plus, X, Clock } from "lucide-react";

interface Reminder {
  id?: string;
  remindAt: Date;
}

interface RemindersSectionProps {
  eventId: string;
  reminders: Reminder[];
  eventDate: Date;
  onRemindersChange: (reminders: Reminder[]) => void;
}

export function RemindersSection({ 
  eventId, 
  reminders, 
  eventDate, 
  onRemindersChange 
}: RemindersSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newReminderDate, setNewReminderDate] = useState("");

  const handleAddReminder = () => {
    if (!newReminderDate) return;

    const reminderDate = new Date(newReminderDate);
    
    // Validar se a data do lembrete é anterior ao evento
    if (reminderDate >= eventDate) {
      toast.error("O lembrete deve ser anterior à data do evento");
      return;
    }

    const newReminder: Reminder = {
      remindAt: reminderDate,
    };

    onRemindersChange([...reminders, newReminder]);
    setNewReminderDate("");
    setIsAdding(false);
    toast.success("Lembrete adicionado com sucesso!");
  };

  const handleRemoveReminder = (index: number) => {
    const updatedReminders = reminders.filter((_, i) => i !== index);
    onRemindersChange(updatedReminders);
    toast.success("Lembrete removido com sucesso!");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Lembretes
        </h4>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus className="h-3 w-3" />
          Adicionar Lembrete
        </button>
      </div>

      {/* Lista de Lembretes */}
      <div className="space-y-2">
        {reminders.length === 0 && !isAdding && (
          <p className="text-xs text-slate-500 italic">
            Nenhum lembrete configurado
          </p>
        )}
        
        {reminders.map((reminder, index) => (
          <div
            key={reminder.id || index}
            className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-slate-400" />
              <span className="text-xs text-slate-700">
                {formatLocalDate(reminder.remindAt)}
              </span>
            </div>
            <button
              onClick={() => handleRemoveReminder(index)}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Formulário de Novo Lembrete */}
        {isAdding && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-2">
              <label className="text-xs font-medium text-blue-900">
                Data e Hora do Lembrete
              </label>
              <input
                type="datetime-local"
                value={newReminderDate}
                onChange={(e) => setNewReminderDate(e.target.value)}
                max={formatForInput(new Date(eventDate.getTime() - 60 * 60 * 1000))} // Mínimo 1 hora antes
                className="w-full rounded border border-blue-200 bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddReminder}
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewReminderDate("");
                  }}
                  className="px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
