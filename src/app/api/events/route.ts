import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createEvent, listEvents, EVENT_TYPES, EVENT_STATUS, PRIORITY, EventFilters } from "@/lib/events";
import { fromNaiveISOString, debugTimezone } from "@/lib/naive-date";
import { prisma } from "@/lib/prisma";

function parseFilters(req: NextRequest): EventFilters {
  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get("moduleId") ?? undefined;
  const type = (searchParams.get("type") as keyof typeof EVENT_TYPES | "ALL" | null) ?? undefined;
  const status =
    (searchParams.get("status") as keyof typeof EVENT_STATUS | "ALL" | null) ?? undefined;
  const priority =
    (searchParams.get("priority") as keyof typeof PRIORITY | "ALL" | null) ?? undefined;

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const from = fromParam ? new Date(fromParam) : undefined;
  const to = toParam ? new Date(toParam) : undefined;

  return { moduleId, type, status, priority, from, to };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters: EventFilters = {};

    // Filtros existentes
    if (searchParams.get("moduleId")) {
      filters.moduleId = searchParams.get("moduleId")!;
    }

    const type = searchParams.get("type");
    if (type && type !== "ALL") {
      filters.type = type as keyof typeof EVENT_TYPES;
    }

    const status = searchParams.get("status");
    if (status && status !== "ALL") {
      filters.status = status as keyof typeof EVENT_STATUS;
    }

    const priority = searchParams.get("priority");
    if (priority && priority !== "ALL") {
      filters.priority = priority as keyof typeof PRIORITY;
    }

    // Novos filtros para monitoramento
    const dueDateBefore = searchParams.get("dueDate_before");
    if (dueDateBefore) {
      filters.to = new Date(dueDateBefore);
    }

    const dueDateAfter = searchParams.get("dueDate_after");
    if (dueDateAfter) {
      filters.from = new Date(dueDateAfter);
    }

    // Suporte a múltiplos status
    const statusArray = searchParams.getAll("status");
    if (statusArray.length > 0 && !statusArray.includes("ALL")) {
      // Para múltiplos status, precisamos buscar todos e filtrar
      const allEvents = await listEvents({ ...filters, status: undefined });
      const filteredEvents = allEvents.filter(event => 
        statusArray.includes(event.status)
      );
      return NextResponse.json(filteredEvents);
    }

    const events = await listEvents(filters);
    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao buscar eventos" },
      { status: 400 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Nova verificação de segurança baseada no cookie do aplicativo
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('life_os_session')?.value === 'authenticated';
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid Session Cookie' },
        { status: 401 }
      );
    }

    // Garantir que existe um usuário no banco para associar ao evento
    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          email: 'admin@lifeos.local',
          name: 'Admin',
          password: 'admin123', // Senha padrão (não será usada no login via .env)
        }
      });
    }
    const userId = defaultUser.id;

    const body = await req.json();

    // Converter strings ingênuas para Date local
    const startDateLocal = fromNaiveISOString(body.startDate);
    const dueDateLocal = fromNaiveISOString(body.dueDate);

    const event = await createEvent({
      title: body.title,
      type: body.type as keyof typeof EVENT_TYPES,
      status: (body.status as keyof typeof EVENT_STATUS) ?? EVENT_STATUS.PENDING,
      startDate: startDateLocal,
      dueDate: dueDateLocal,
      priority: (body.priority as keyof typeof PRIORITY) ?? PRIORITY.MEDIUM,
      brief: body.brief ?? null,
      outcome: body.outcome ?? null,
      moduleId: body.moduleId,
      userId: userId,
      attachmentUrls: (body.attachmentUrls as string[] | undefined) ?? [],
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao criar evento" },
      { status: 400 },
    );
  }
}
