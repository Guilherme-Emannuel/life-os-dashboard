import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Função para criar string ISO "ingênua" (naive) sem timezone
 * Formato: YYYY-MM-DDTHH:mm:ss (sem Z no final)
 * Isso força o Prisma a salvar exatamente o horário local
 */
export function createNaiveISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Converte string ISO "ingênua" para Date local
 */
export function fromNaiveISOString(dateString: string): Date {
  // Criar Date a partir da string sem timezone
  const [datePart, timePart] = dateString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timePart.split(':').map(Number);
  
  // Criar Date usando componentes locais
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

/**
 * Formata data para exibição com timezone específico
 */
export function formatWithTimezone(date: Date | string, formatStr: string = "dd/MM/yyyy 'às' HH:mm"): string {
  const localDate = typeof date === 'string' ? fromNaiveISOString(date) : date;
  
  // Verificação de segurança
  if (isNaN(localDate.getTime())) {
    return 'Data inválida';
  }

  // Usar imports estáticos
  return format(localDate, formatStr, { locale: ptBR });
}

/**
 * Verificação de debug para timezone
 */
export function debugTimezone(date: Date | string, label: string = "Debug"): void {
  const localDate = typeof date === 'string' ? fromNaiveISOString(date) : date;
  
  console.log(`🔍 ${label}:`, {
    input: date,
    inputType: typeof date,
    localDate: localDate,
    localISOString: localDate.toISOString(),
    naiveISOString: createNaiveISOString(localDate),
    localString: localDate.toLocaleString('pt-BR'),
    timezoneOffset: localDate.getTimezoneOffset(),
    processEnvTZ: process.env.TZ,
    nodeTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
}
