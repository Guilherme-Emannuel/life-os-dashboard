import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Converte string do formulário datetime-local ('YYYY-MM-DDTHH:mm') 
 * para Date UTC considerando o fuso horário local (Brasil)
 */
export function parseLocalToUtcDate(localString: string): Date {
  if (!localString) return new Date();
  
  // Parse da string local
  const [datePart, timePart] = localString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Criar Date usando componentes locais (JavaScript converte automaticamente para UTC)
  const localDate = new Date(year, month - 1, day, hours, minutes);
  
  return localDate;
}

/**
 * Converte Date UTC para string de formulário datetime-local ('YYYY-MM-DDTHH:mm')
 * considerando o fuso horário local (Brasil)
 */
export function formatUtcToLocalInput(date: Date): string {
  if (!date || isNaN(date.getTime())) return '';
  
  // Converter UTC para local e formatar
  const localDate = new Date(date);
  
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formata Date UTC para exibição visual com timezone local
 */
export function formatWithTimezone(date: Date | string, formatStr: string = "dd/MM/yyyy 'às' HH:mm"): string {
  const localDate = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(localDate.getTime())) {
    return 'Data inválida';
  }

  return format(localDate, formatStr, { locale: ptBR });
}

// Funções legadas para compatibilidade
export function createNaiveISOString(date: Date): string {
  return date.toISOString();
}

export function fromNaiveISOString(dateString: string): Date {
  return new Date(dateString);
}

export function debugTimezone(date: Date | string, label: string = "Debug"): void {
  // Removido para produção
}