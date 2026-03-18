import { Chrono } from 'chrono-node';
import { format, parseISO, isToday, isTomorrow, isPast, isFuture, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toLocalISOString, formatLocalDate } from './timezone';

// Configurar Chrono para português brasileiro
const chrono = new Chrono();

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

  // Extrair data/hora com chrono-node
  const dateResults = chrono.parse(text, new Date(), { forwardDate: true });
  if (dateResults.length > 0) {
    const result = dateResults[0];
    const parsedDate = result.start.date();
    
    // Verificar se a data é válida antes de processar
    if (isNaN(parsedDate.getTime())) {
      console.log("⚠️ Chrono retornou data inválida:", parsedDate);
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
        console.log("⚠️ Data reconstruída inválida:", { year, month, day, hours, minutes, seconds });
        date = null;
      } else {
        console.log("🔍 Chrono parse:", {
          original: text,
          parsed: parsedDate,
          parsedISO: parsedDate.toISOString(),
          parsedLocal: parsedDate.toLocaleString('pt-BR'),
          forcedLocal: date,
          forcedLocalISO: date.toISOString(),
          forcedLocalString: date.toLocaleString('pt-BR'),
          timezoneOffset: date.getTimezoneOffset()
        });
      }
    }
    
    // Remover partes de data do texto
    const dateText = result.text;
    cleanedText = cleanedText.replace(dateText, '').trim();
  } else {
    // Tentar expressões comuns em português que chrono pode não pegar
    const portuguesePatterns = [
      { pattern: /daqui a (\d+)\s*(hora|horas|dia|dias|semana|semanas|mês|meses)/gi, handler: (match: string, p1: string, p2: string) => {
        const num = parseInt(p1);
        const now = new Date();
        if (p2.startsWith('hora')) return new Date(now.getTime() + num * 60 * 60 * 1000);
        if (p2.startsWith('dia')) return new Date(now.getTime() + num * 24 * 60 * 60 * 1000);
        if (p2.startsWith('semana')) return new Date(now.getTime() + num * 7 * 24 * 60 * 60 * 1000);
        if (p2.startsWith('mê') || p2.startsWith('mes')) return new Date(now.getFullYear(), now.getMonth() + num, now.getDate());
        return now;
      }},
      { pattern: /proximo|pr[óo]ximo\s+(segunda|terça|quarta|quinta|sexta|s[áa]bado|domingo)/gi, handler: (match: string, day: string) => {
        const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
        const targetDay = days.indexOf(day.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
        const now = new Date();
        const currentDay = now.getDay();
        const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
        return new Date(now.getTime() + daysUntil * 24 * 60 * 60 * 1000);
      }},
      { pattern: /hoje\s+as\s+(\d{1,2}):?(\d{0,2})/gi, handler: (match: string, h: string, m: string) => {
        const now = new Date();
        const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(h), parseInt(m || '0'));
        
        // Verificar se a data é válida
        if (isNaN(localDate.getTime())) {
          console.log("⚠️ Pattern 'hoje as' criou data inválida:", { hours: h, minutes: m || '0' });
          return null;
        }
        
        console.log("🔍 Pattern 'hoje as':", {
          match,
          hours: h,
          minutes: m || '0',
          result: localDate,
          resultISO: localDate.toISOString(),
          resultLocal: localDate.toLocaleString('pt-BR')
        });
        
        return localDate;
      }},
      { pattern: /amanha\s+as\s+(\d{1,2}):?(\d{0,2})/gi, handler: (match: string, h: string, m: string) => {
        const now = new Date();
        const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, parseInt(h), parseInt(m || '0'));
        
        // Verificar se a data é válida
        if (isNaN(localDate.getTime())) {
          console.log("⚠️ Pattern 'amanha as' criou data inválida:", { hours: h, minutes: m || '0' });
          return null;
        }
        
        console.log("🔍 Pattern 'amanha as':", {
          match,
          hours: h,
          minutes: m || '0',
          result: localDate,
          resultISO: localDate.toISOString(),
          resultLocal: localDate.toLocaleString('pt-BR')
        });
        
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

  // Limpar palavras de conexão e artigos
  cleanedText = cleanedText
    .replace(/\b(ate|até|para|em|o|a|os|as|de|do|da|dos|das|um|uma|uns|umas)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Se não encontrar data, usar padrão (agora + 1 dia)
  if (!date) {
    date = addDays(new Date(), 1);
  }

  // Verificação final de data válida
  if (date && isNaN(date.getTime())) {
    console.log("⚠️ Data final inválida, usando padrão:", date);
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
