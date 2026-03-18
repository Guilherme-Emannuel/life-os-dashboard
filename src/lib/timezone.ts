import { format, parseISO } from 'date-fns';

/**
 * Converte data local para string ISO sem alterar o horário
 * Mantém exatamente o horário que o usuário digitou
 */
export function toLocalISOString(date: Date): string {
  // Criar string ISO mantendo o horário local (sem conversão UTC)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Converte string ISO para Date local (sem conversão UTC)
 */
export function fromLocalISOString(dateString: string): Date {
  // Criar Date a partir da string ISO como se fosse local
  const date = new Date(dateString);
  
  // Se for string ISO, ajustar para timezone local
  if (dateString.includes('T') && dateString.includes('Z')) {
    // Remover 'Z' para evitar conversão automática para UTC
    const localString = dateString.replace('Z', '');
    return new Date(localString);
  }
  
  return date;
}

/**
 * Formata data para exibição local
 */
export function formatLocalDate(date: Date | string, formatStr: string = "dd/MM/yyyy 'às' HH:mm"): string {
  const localDate = typeof date === 'string' ? fromLocalISOString(date) : date;
  return format(localDate, formatStr);
}

/**
 * Formata data para input datetime-local (sem conversão UTC)
 */
export function formatForInput(date: Date | string): string {
  const localDate = typeof date === 'string' ? fromLocalISOString(date) : date;
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Verifica se data está próxima (dentro de X minutos)
 */
export function isNearby(date: Date | string, minutesThreshold: number = 30): boolean {
  const localDate = typeof date === 'string' ? fromLocalISOString(date) : date;
  const now = new Date();
  const diffMs = localDate.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return diffMinutes > 0 && diffMinutes <= minutesThreshold;
}

/**
 * Cria lembrete automático: 1 dia antes às 16:00
 */
export function createAutoReminder(eventDate: Date | string): Date {
  const localDate = typeof eventDate === 'string' ? fromLocalISOString(eventDate) : eventDate;
  
  // Subtrair 1 dia
  const reminderDate = new Date(localDate);
  reminderDate.setDate(reminderDate.getDate() - 1);
  
  // Setar horário para 16:00
  reminderDate.setHours(16, 0, 0, 0);
  
  return reminderDate;
}
