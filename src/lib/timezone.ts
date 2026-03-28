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
 * @deprecated Use fromNaiveISOString from naive-date.ts instead
 * Mantida apenas para compatibilidade
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
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Verificação de segurança para evitar o erro 'Invalid time value'
  if (isNaN(d.getTime())) {
    return 'Data inválida';
  }
  
  return format(d, formatStr);
}

/**
 * Formata data para input datetime-local (sem conversão UTC)
 */
export function formatForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Verifica se data está próxima (dentro de X minutos)
 */
export function isNearby(date: Date | string, minutesThreshold: number = 30): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return false;
  
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return diffMinutes > 0 && diffMinutes <= minutesThreshold;
}

/**
 * Cria lembrete automático: 1 dia antes às 16:00
 */
export function createAutoReminder(eventDate: Date | string): Date {
  const d = typeof eventDate === 'string' ? new Date(eventDate) : eventDate;
  if (isNaN(d.getTime())) return new Date(); // Fallback seguro
  
  // Subtrair 1 dia
  const reminderDate = new Date(d);
  reminderDate.setDate(reminderDate.getDate() - 1);
  
  // Setar horário para 16:00
  reminderDate.setHours(16, 0, 0, 0);
  
  return reminderDate;
}
