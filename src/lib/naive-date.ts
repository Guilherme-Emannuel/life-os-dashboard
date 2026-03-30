import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function createNaiveISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export function fromNaiveISOString(dateString: string): Date {
  // Agora o Javascript lê a data. Se tiver "Z" (do banco), ele diminui 4 horas sozinho. 
  // Se vier seco (do formulário), ele assume horário local.
  return new Date(dateString);
}

export function formatWithTimezone(date: Date | string, formatStr: string = "dd/MM/yyyy 'às' HH:mm"): string {
  const localDate = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(localDate.getTime())) {
    return 'Data inválida';
  }

  return format(localDate, formatStr, { locale: ptBR });
}

export function debugTimezone(date: Date | string, label: string = "Debug"): void {
  // Removido para produção
}