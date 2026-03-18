# Life OS Dashboard

Um sistema inteligente de gestão de vida pessoal com processamento de linguagem natural, notificações críticas e painel de pendências urgentes.

## 🚀 Funcionalidades Principais

### 📝 Captura Rápida Inteligente
- **Processamento de Linguagem Natural**: Digite "reunião hoje às 14:30" e o sistema extrai automaticamente título, data e prioridade
- **Suporte a Datas Locais**: Reconhecimento de padrões em português brasileiro ("amanhã", "próxima segunda", "daqui a 2 dias")
- **Timezone Corrigido**: Horários salvos e exibidos no fuso horário local (America/Campo_Grande - UTC-4)
- **Sem Conversão UTC**: Strings ingênuas (sem "Z") garantem que 14:30 seja sempre 14:30

### 🗂️ Gestão de Áreas da Vida
- **Módulos Dinâmicos**: Organize sua vida em áreas como Trabalho, Faculdade, Pessoal, Saúde
- **Cores Distintas**: Cada área tem identidade visual única para fácil identificação
- **Filtros Inteligentes**: Visualize tarefas por área, tipo (Evento/Tarefa), status e prioridade
- **Interface Minimalista**: Design limpo e focado na produtividade

### 🔔 Sistema de Notificações Críticas
- **Alertas Visuais**: Modal crítico com animação pulse quando tarefas atingem o prazo
- **Notificações Sonoras**: Áudio pré-carregado para alertas imediatos
- **Notificações Nativas**: Integração com sistema de notificações do navegador
- **Persistentes**: Alertas permanecem visíveis até serem descartados

### 🚨 Painel de Pendências Urgentes
- **Inteligência Visual**: Apenas itens realmente atrasados aparecem no painel
- **Filtro Duplo**: Validação API + verificação local estrita
- **Timezone Local**: Comparação precisa usando fuso horário de Corumbá/MS
- **Contador de Atraso**: Exibe "Atrasado há X horas" apenas quando realmente atrasado
- **Ação Rápida**: Botões para editar ou concluir itens diretamente do painel

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 16.1.6 com TypeScript
- **UI**: TailwindCSS + Lucide Icons
- **Banco de Dados**: SQLite com Prisma ORM
- **Notificações**: Sonner + Web Audio API
- **Timezone**: date-fns + strings ingênuas (sem UTC)
- **Deploy**: Suporte a Vercel e Docker

## 🕐 Correções de Timezone

O sistema implementa uma abordagem rigorosa para tratamento de timezone:

### Problema Resolvido
- **Antes**: "10:30" → Salvo como "14:30" (UTC+4)
- **Depois**: "10:30" → Salvo como "10:30" (local)

### Implementação
```typescript
// Strings ingênuas (sem "Z")
const naiveDateString = "2026-03-17T10:30:00";

// Comparação local estrita
const now = new Date();
const eventTime = eventDate.getTime();
const isOverdue = eventTime < now.getTime();
```

### Variável de Ambiente
```bash
TZ=America/Campo_Grande
```

## 📊 Arquitetura

```
src/
├── app/
│   ├── api/events/          # CRUD de eventos
│   ├── api/modules/         # Gestão de áreas
│   └── home-client.tsx      # Interface principal
├── components/
│   ├── events-board.tsx     # Painel de eventos
│   ├── quick-capture-form.tsx # Captura rápida
│   └── use-realtime-monitoring.tsx # Notificações
├── lib/
│   ├── nlp-parser.ts        # Processamento NLP
│   ├── naive-date.ts        # Utilidades de data
│   └── events.ts            # Lógica de negócio
└── hooks/
    └── use-persistent-reminders.tsx # Lembretes
```

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Setup
```bash
# Clone o repositório
git clone <repository-url>
cd life-os-dashboard

# Instale dependências
npm install

# Configure o banco de dados
npx prisma generate
npx prisma db push

# Inicie o desenvolvimento
npm run dev
```

### Variáveis de Ambiente
```env
# Timezone fixo para Corumbá/MS
TZ=America/Campo_Grande

# Banco de dados (opcional)
DATABASE_URL="file:./dev.db"
```

## 📱 Uso

### Captura Rápida
1. Digite "reunião com cliente amanhã às 15:00"
2. O sistema extrai: título, data, prioridade
3. Evento criado automaticamente

### Gestão de Áreas
1. Acesse Admin → Módulos
2. Crie áreas: Trabalho, Faculdade, Pessoal
3. Atribua cores e ordem

### Pendências Urgentes
1. Painel aparece automaticamente
2. Apenas itens atrasados são exibidos
3. Use botões rápidos para gerenciar

## 🔧 Configuração

### Timezone Personalizado
```typescript
// package.json
{
  "scripts": {
    "dev": "TZ=America/Campo_Grande next dev",
    "build": "TZ=America/Campo_Grande next build"
  }
}
```

### Notificações
```typescript
// Ativar notificações nativas
Notification.requestPermission();
```

## 📈 Performance

- **Build Otimizado**: Next.js 16 com Turbopack
- **Cache Inteligente**: React Query com invalidação automática
- **Lazy Loading**: Componentes carregados sob demanda
- **Minimalista**: Sem dependências desnecessárias

## 🤝 Contribuição

1. Fork o projeto
2. Crie branch `feature/nova-funcionalidade`
3. Commit com mensagens claras
4. Abra Pull Request

## 📄 Licença

MIT License - veja arquivo LICENSE para detalhes

## 🎯 Roadmap

- [ ] App mobile (React Native)
- [ ] Integração com Google Calendar
- [ ] Relatórios e analytics
- [ ] Modo colaborativo (equipes)

---

**Life OS** - Transforme sua gestão de tempo com inteligência artificial e design minimalista.

*Desenvolvido com ❤️ em Corumbá/MS*
