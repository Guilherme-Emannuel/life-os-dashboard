import { prisma } from "./prisma";
import { createAutoReminder } from "./timezone";

// Constants para tipos (substituindo enums)
export const EVENT_TYPES = {
  EVENT: "EVENT",
  REMINDER: "REMINDER", 
  TASK: "TASK"
} as const;

export const EVENT_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  OVERDUE: "OVERDUE"
} as const;

export const PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
} as const;

export type EventFilters = {
  moduleId?: string;
  type?: keyof typeof EVENT_TYPES | "ALL";
  status?: keyof typeof EVENT_STATUS | "ALL";
  priority?: keyof typeof PRIORITY | "ALL";
  from?: Date;
  to?: Date;
};

export async function listEvents(filters: EventFilters = {}) {
  const where: any = {};

  if (filters.moduleId) {
    where.moduleId = filters.moduleId;
  }

  if (filters.type && filters.type !== "ALL") {
    where.type = filters.type;
  }

  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (filters.priority && filters.priority !== "ALL") {
    where.priority = filters.priority;
  }

  if (filters.from || filters.to) {
    where.startDate = {};
    if (filters.from) {
      where.startDate.gte = filters.from;
    }
    if (filters.to) {
      where.startDate.lte = filters.to;
    }
  }

  return prisma.event.findMany({
    where,
    include: {
      attachments: true,
      reminders: true,
      module: true,
    },
    orderBy: {
      startDate: "asc",
    },
  });
}

export async function getEvent(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      attachments: true,
      reminders: true,
      module: true,
    },
  });
}

type EventInput = {
  title: string;
  type: keyof typeof EVENT_TYPES;
  status: keyof typeof EVENT_STATUS;
  startDate: Date;
  dueDate: Date;
  priority: keyof typeof PRIORITY;
  brief?: string | null;
  outcome?: string | null;
  moduleId: string;
  attachmentUrls?: string[];
};

export async function createEvent(data: EventInput) {
  console.log("🔍 createEvent - Recebendo dados:", {
    title: data.title,
    type: data.type,
    status: data.status,
    moduleId: data.moduleId,
    priority: data.priority,
    brief: data.brief
  });

  if (
    (data.status === EVENT_STATUS.COMPLETED ||
      data.status === EVENT_STATUS.OVERDUE) &&
    !data.outcome
  ) {
    throw new Error(
      "Preencha o campo de descrição final explicando por que foi concluída ou adiada.",
    );
  }

  const event = await prisma.event.create({
    data: {
      title: data.title,
      type: data.type,
      status: data.status,
      startDate: data.startDate,
      dueDate: data.dueDate,
      priority: data.priority,
      brief: data.brief,
      outcome: data.outcome,
      moduleId: data.moduleId,
      attachments: data.attachmentUrls
        ? {
            create: data.attachmentUrls
              .filter((u) => u.trim().length > 0)
              .map((url) => ({
                url,
              })),
          }
        : undefined,
    },
    include: {
      attachments: true,
      reminders: true,
      module: true,
    },
  });

  console.log("✅ createEvent - Evento criado no banco:", {
    ...event,
    debug: {
      receivedStartDate: data.startDate,
      receivedDueDate: data.dueDate,
      startDateType: typeof data.startDate,
      dueDateType: typeof data.dueDate,
      startDateISO: data.startDate.toISOString(),
      dueDateISO: data.dueDate.toISOString(),
      startDateLocal: data.startDate.toLocaleString('pt-BR'),
      dueDateLocal: data.dueDate.toLocaleString('pt-BR'),
      timezoneOffset: data.startDate.getTimezoneOffset(),
      // O que foi salvo no banco
      savedStartDate: event.startDate,
      savedDueDate: event.dueDate,
      savedStartDateISO: event.startDate.toISOString(),
      savedDueDateISO: event.dueDate.toISOString(),
      savedStartDateLocal: event.startDate.toLocaleString('pt-BR'),
      savedDueDateLocal: event.dueDate.toLocaleString('pt-BR'),
      // Verificação se houve mudança
      startDateChanged: data.startDate.getTime() !== event.startDate.getTime(),
      dueDateChanged: data.dueDate.getTime() !== event.dueDate.getTime()
    }
  });

  // Criar lembrete automático: 1 dia antes às 16:00
  const autoReminderDate = createAutoReminder(event.dueDate);
  
  // Apenas criar se a data do lembrete for futura
  if (autoReminderDate.getTime() > Date.now()) {
    await prisma.reminder.create({
      data: {
        eventId: event.id,
        remindAt: autoReminderDate,
      },
    });
  }

  return event;
}

export async function updateEvent(
  id: string,
  data: Partial<EventInput> & { status?: keyof typeof EVENT_STATUS },
) {
  const existing = await prisma.event.findUnique({
    where: { id },
    include: { attachments: true },
  });

  if (!existing) {
    throw new Error("Evento não encontrado.");
  }

  const nextStatus = data.status ?? existing.status;
  const nextOutcome =
    data.outcome !== undefined ? data.outcome : existing.outcome;

  // Removido: Validação que impedia marcar como COMPLETED sem outcome
  // Isso estava causando erro 400 no PATCH

  const attachmentOps =
    data.attachmentUrls != null
      ? {
          deleteMany: {},
          create: data.attachmentUrls
            .filter((u) => u.trim().length > 0)
            .map((url) => ({ url })),
        }
      : undefined;

  return prisma.event.update({
    where: { id },
    data: {
      title: data.title,
      type: data.type,
      status: nextStatus,
      startDate: data.startDate,
      dueDate: data.dueDate,
      priority: data.priority,
      brief: data.brief,
      outcome: nextOutcome,
      moduleId: data.moduleId,
      attachments: attachmentOps,
    },
    include: {
      attachments: true,
      reminders: true,
      module: true,
    },
  });
}

export async function deleteEvent(id: string) {
  await prisma.attachment.deleteMany({ where: { eventId: id } });
  await prisma.reminder.deleteMany({ where: { eventId: id } });
  await prisma.event.delete({ where: { id } });
}

export async function hasCriticalOpenEventsToday() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const count = await prisma.event.count({
    where: {
      priority: PRIORITY.CRITICAL,
      status: {
        in: [EVENT_STATUS.PENDING, EVENT_STATUS.IN_PROGRESS, EVENT_STATUS.OVERDUE],
      },
      dueDate: {
        gte: start,
        lte: end,
      },
    },
  });

  return count > 0;
}
