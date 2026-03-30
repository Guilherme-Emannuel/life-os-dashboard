import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function createNaiveISOString(date: Date): string {
  // Agora o celular envia a data com a "assinatura" exata do seu fuso horário (UTC absoluto)
  return date.toISOString();
}

export function fromNaiveISOString(dateString: string): Date {
  // O navegador do celular recebe a data global e converte sozinho para o horário local
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