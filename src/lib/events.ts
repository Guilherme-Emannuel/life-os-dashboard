import { prisma } from "./prisma";
import { EventStatus, EventType, Priority } from "@prisma/client";

export type EventFilters = {
  moduleId?: string;
  type?: EventType | "ALL";
  status?: EventStatus | "ALL";
  priority?: Priority | "ALL";
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
  type: EventType;
  status: EventStatus;
  startDate: Date;
  dueDate: Date;
  priority: Priority;
  brief?: string | null;
  outcome?: string | null;
  moduleId: string;
  attachmentUrls?: string[];
};

export async function createEvent(data: EventInput) {
  if (
    (data.status === EventStatus.COMPLETED ||
      data.status === EventStatus.OVERDUE) &&
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

  // Lembretes progressivos para tarefas críticas
  if (event.priority === Priority.CRITICAL) {
    const due = event.dueDate;
    const baseTimes = [
      new Date(due.getTime() - 24 * 60 * 60 * 1000),
      new Date(due.getTime() - 60 * 60 * 1000),
      new Date(due.getTime() - 10 * 60 * 1000),
    ];

    const futureTimes = baseTimes.filter((t) => t.getTime() > Date.now());

    if (futureTimes.length > 0) {
      await prisma.reminder.createMany({
        data: futureTimes.map((t) => ({
          eventId: event.id,
          remindAt: t,
        })),
      });
    }
  }

  return event;
}

export async function updateEvent(
  id: string,
  data: Partial<EventInput> & { status?: EventStatus },
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

  if (
    (nextStatus === EventStatus.COMPLETED ||
      nextStatus === EventStatus.OVERDUE) &&
    !nextOutcome
  ) {
    throw new Error(
      "Preencha o campo de descrição final explicando por que foi concluída ou adiada.",
    );
  }

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
      priority: Priority.CRITICAL,
      status: {
        in: [EventStatus.PENDING, EventStatus.IN_PROGRESS, EventStatus.OVERDUE],
      },
      dueDate: {
        gte: start,
        lte: end,
      },
    },
  });

  return count > 0;
}

