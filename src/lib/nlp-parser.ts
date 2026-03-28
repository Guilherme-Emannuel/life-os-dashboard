import { pt } from 'chrono-node';
import { format, parseISO, isToday, isTomorrow, isPast, isFuture, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toLocalISOString, formatLocalDate } from './timezone';

// Configurar Chrono para português brasileiro
const chrono = pt;

export interface ParsedEvent {
  title: string;
  date?: Date | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  cleanedText: string;
}

export function parseNaturalLanguage(text: string): ParsedEvent {
  let cleanedText = text.trim();
  let date: Date | undefined | null = undefined;
  let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined;

  // Extrair prioridade
  const priorityPatterns = [
    { pattern: /\b(baixa|low)\b/gi, level: 'LOW' as const },
    { pattern: /\b(média|media|medium)\b/gi, level: 'MEDIUM' as const },
    { pattern: /\b(alta|high)\b/gi, level: 'HIGH' as const },
    { pattern: /\b(crítica|critica|critical|urgente)\b/gi, level: 'CRITICAL' as const },
  ];

  for (const { pattern, level } of priorityPatterns) {
    if (pattern.test(text)) {
      priority = level;
      cleanedText = cleanedText.replace(pattern, '').trim();
      break;
    }
  }

  // Extrair data/hora com chrono-node em português
  const dateResults = chrono.parse(text, new Date(), { forwardDate: true });
  if (dateResults.length > 0) {
    const result = dateResults[0];
    const parsedDate = result.start.date();
    
    // Verificar se a data é válida antes de processar
    if (isNaN(parsedDate.getTime())) {
      date = null;
    } else {
      // Forçar timezone local - extrair componentes e reconstruir data local
      const year = parsedDate.getFullYear();
      const month = parsedDate.getMonth();
      const day = parsedDate.getDate();
      const hours = parsedDate.getHours();
      const minutes = parsedDate.getMinutes();
      const seconds = parsedDate.getSeconds();
      
      // Criar data usando componentes locais (sem conversão UTC)
      date = new Date(year, month, day, hours, minutes, seconds);
      
      // Verificar se a data reconstruída é válida
      if (isNaN(date.getTime())) {
        date = null;
      }
    }
    
    // Remover partes de data do texto
    const dateText = result.text;
    cleanedText = cleanedText.replace(dateText, '').trim();
  } else {
    // Função auxiliar para encontrar o próximo dia da semana
    function getNextWeekday(targetDayName: string): Date {
      const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
      const targetDay = days.indexOf(targetDayName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      const now = new Date();
      const currentDay = now.getDay();
      const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
      const result = new Date(now.getTime() + daysUntil * 24 * 60 * 60 * 1000);
      
      // Garantir anti-viagem no tempo - nunca retornar data no passado
      if (result < now) {
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      
      return result;
    }

    // Função auxiliar para calcular múltiplos dias da semana no futuro
    function getMultipleWeekdays(targetDayName: string, count: number): Date {
      const firstOccurrence = getNextWeekday(targetDayName);
      // Adicionar (count - 1) semanas ao primeiro dia encontrado
      return new Date(firstOccurrence.getTime() + (count - 1) * 7 * 24 * 60 * 60 * 1000);
    }

    // Função auxiliar para converter números por extenso
    function parseExtendedNumber(text: string): number {
      const extendedNumbers: { [key: string]: number } = {
        'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'três': 3, 'tres': 3,
        'quatro': 4, 'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8,
        'nove': 9, 'dez': 10, 'onze': 11, 'doze': 12
      };
      
      return extendedNumbers[text.toLowerCase()] || parseInt(text) || 0;
    }

    // Tentar expressões comuns em português que chrono pode não pegar
    const portuguesePatterns = [
      // Regra 1: Daqui a X tempo (horas, dias, semanas, meses) - Aceita "um", "uma" ou números
      { 
        pattern: /daqui a\s+(um|uma|\d+)\s+(hora|horas|dia|dias|semana|semanas|mês|meses|mes)/i, 
        handler: (match: string, qtd: string, tipo: string) => {
          if (!qtd || !tipo) return null;
          const num = (qtd.toLowerCase() === 'um' || qtd.toLowerCase() === 'uma') ? 1 : parseInt(qtd);
          const now = new Date();
          
          if (tipo.startsWith('hora')) return new Date(now.getTime() + num * 60 * 60 * 1000);
          if (tipo.startsWith('dia')) return new Date(now.getFullYear(), now.getMonth(), now.getDate() + num, now.getHours(), now.getMinutes());
          if (tipo.startsWith('semana')) return new Date(now.getFullYear(), now.getMonth(), now.getDate() + (num * 7), now.getHours(), now.getMinutes());
          if (tipo.startsWith('mê') || tipo.startsWith('mes')) {
            const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + num, now.getDate(), now.getHours(), now.getMinutes());
            return nextMonthDate;
          }
          return now;
        }
      },

      // Regra 2: Daqui a X dias da semana (ex: "daqui a 3 sábados") - Aceita "um", "uma" ou números
      { 
        pattern: /daqui a\s+(um|uma|\d+)\s+(segunda|terça|quarta|quinta|sexta|s[áa]bado|domingo)s?/i, 
        handler: (match: string, qtd: string, dayStr: string) => {
          if (!qtd || !dayStr) return null;
          const num = (qtd.toLowerCase() === 'um' || qtd.toLowerCase() === 'uma') ? 1 : parseInt(qtd);
          const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
          
          const normalizedDay = dayStr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const targetDay = days.indexOf(normalizedDay);
          
          const now = new Date();
          const currentDay = now.getDay();
          
          // Quantos dias até o PRÓXIMO dia da semana pedido?
          let daysUntilNext = (targetDay - currentDay + 7) % 7;
          if (daysUntilNext === 0) daysUntilNext = 7; // Se hoje é sábado e peço "próximo sábado", são 7 dias.
          
          // Soma os dias até o próximo, mais (N-1) semanas.
          const totalDaysToAdd = daysUntilNext + ((num - 1) * 7);
          
          return new Date(now.getFullYear(), now.getMonth(), now.getDate() + totalDaysToAdd, now.getHours(), now.getMinutes());
        }
      },

      // Regra 3: Dias da semana simples no futuro (ex: "até terça", "na quarta", "sexta")
      { 
        pattern: /(?:at[ée]|na|para|nesta|neste|pr[óo]xima|pr[óo]ximo)?\s*(segunda|terça|quarta|quinta|sexta|s[áa]bado|domingo)/i, 
        handler: (match: string, dayStr: string) => {
          if (!dayStr) return null;
          // Evitar conflito com a regra anterior ("daqui a X...")
          if (match.toLowerCase().includes('daqui a')) return null;

          const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
          const normalizedDay = dayStr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const targetDay = days.indexOf(normalizedDay);
          
          const now = new Date();
          const currentDay = now.getDay();
          
          let daysUntilNext = (targetDay - currentDay + 7) % 7;
          if (daysUntilNext === 0) daysUntilNext = 7; 
          
          return new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilNext, now.getHours(), now.getMinutes());
        }
      },
      { pattern: /hoje\s+as\s+(\d{1,2}):?(\d{0,2})/i, handler: (match: string, h: string, m: string) => {
        if (!h) return null;
        const now = new Date();
        const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(h), parseInt(m || '0'));
        
        // Verificar se a data é válida
        if (isNaN(localDate.getTime())) {
          return null;
        }
        
        return localDate;
      }},
      { pattern: /hoje\s+as\s+(\d{1,2})h/i, handler: (match: string, h: string) => {
        if (!h) return null;
        const now = new Date();
        const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(h), 0);
        
        // Verificar se a data é válida
        if (isNaN(localDate.getTime())) {
          return null;
        }
        
        return localDate;
      }},
      { pattern: /amanha\s+as\s+(\d{1,2}):?(\d{0,2})/i, handler: (match: string, h: string, m: string) => {
        if (!h) return null;
        const now = new Date();
        const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, parseInt(h), parseInt(m || '0'));
        
        // Verificar se a data é válida
        if (isNaN(localDate.getTime())) {
          return null;
        }
        
        return localDate;
      }},
      { pattern: /amanhã\s+as\s+(\d{1,2}):?(\d{0,2})/i, handler: (match: string, h: string, m: string) => {
        if (!h) return null;
        const now = new Date();
        const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, parseInt(h), parseInt(m || '0'));
        
        // Verificar se a data é válida
        if (isNaN(localDate.getTime())) {
          return null;
        }
        
        return localDate;
      }},
      { pattern: /amanha\s+as\s+(\d{1,2})h/i, handler: (match: string, h: string) => {
        if (!h) return null;
        const now = new Date();
        const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, parseInt(h), 0);
        
        // Verificar se a data é válida
        if (isNaN(localDate.getTime())) {
          return null;
        }
        
        return localDate;
      }},
      { pattern: /amanhã\s+as\s+(\d{1,2})h/i, handler: (match: string, h: string) => {
        if (!h) return null;
        const now = new Date();
        const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, parseInt(h), 0);
        
        // Verificar se a data é válida
        if (isNaN(localDate.getTime())) {
          return null;
        }
        
        return localDate;
      }}
    ];

    for (const { pattern, handler } of portuguesePatterns) {
      const match = text.match(pattern);
      if (match) {
        date = handler(match[0], match[1], match[2]);
        cleanedText = cleanedText.replace(match[0], '').trim();
        break;
      }
    }
  }

  // Limpar palavras de conexão e artigos (removendo números por extenso da limpeza)
  cleanedText = cleanedText
    .replace(/\b(ate|até|para|em|o|a|os|as|de|do|da|dos|das)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Se não encontrar data, usar padrão (agora + 1 dia)
  if (!date) {
    date = addDays(new Date(), 1);
  }

  // Verificação final de data válida e anti-viagem no tempo
  if (date && isNaN(date.getTime())) {
    date = addDays(new Date(), 1);
  } else if (date && date < new Date()) {
    // Garantir anti-viagem no tempo - se a data calculada estiver no passado, usar amanhã
    date = addDays(new Date(), 1);
  }

  // Simplificar: não converter para ISO, manter Date local
  // A conversão para string ingênua será feita no QuickCapture

  // Se não encontrar prioridade, usar MEDIUM como padrão
  if (!priority) {
    priority = 'MEDIUM';
  }

  return {
    title: cleanedText || text, // Fallback para texto original se limpar demais
    date,
    priority,
    cleanedText,
  };
}

export function formatEventDate(date: Date): string {
  // Converter para data local antes de formatar
  const localDate = formatLocalDate(date);
  return localDate;
}

export function getDateStatus(date: Date): 'overdue' | 'today' | 'tomorrow' | 'future' {
  const now = new Date();
  
  // Comparação local estrita - usar apenas timestamp para evitar timezone issues
  const nowTime = now.getTime();
  const eventTime = date.getTime();
  
  // Se o tempo do evento for menor que agora, está atrasado
  if (eventTime < nowTime) return 'overdue';
  
  // Verificar se é hoje, amanhã ou futuro
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = addDays(today, 1);
  const eventDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (isToday(date)) return 'today';
  if (isTomorrow(date)) return 'tomorrow';
  return 'future';
}

export function getDateColor(status: ReturnType<typeof getDateStatus>): string {
  switch (status) {
    case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
    case 'today': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'tomorrow': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'future': return 'text-green-600 bg-green-50 border-green-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

// Geração de cores distintas para áreas/módulos
const areaColors = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-green-100 text-green-700 border-green-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-yellow-100 text-yellow-700 border-yellow-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-teal-100 text-teal-700 border-teal-200',
];

export function getAreaColor(areaId: string): string {
  // Hash simples para gerar cores consistentes
  let hash = 0;
  for (let i = 0; i < areaId.length; i++) {
    hash = areaId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return areaColors[Math.abs(hash) % areaColors.length];
}
