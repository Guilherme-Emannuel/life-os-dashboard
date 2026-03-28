import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createEvent, listEvents, EVENT_TYPES, EVENT_STATUS, PRIORITY, EventFilters } from "@/lib/events";
import { fromNaiveISOString, debugTimezone } from "@/lib/naive-date";

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
      console.log("🔍 API GET - Múltiplos status:", statusArray);
      const allEvents = await listEvents({ ...filters, status: undefined });
      const filteredEvents = allEvents.filter(event => 
        statusArray.includes(event.status)
      );
      console.log("📋 API GET - Eventos filtrados:", filteredEvents.length, filteredEvents);
      return NextResponse.json(filteredEvents);
    }

    console.log("🔍 API GET - Buscando eventos com filtros:", filters);
    const events = await listEvents(filters);
    console.log("📋 API GET - Eventos encontrados:", events.length, events);
    return NextResponse.json(events);
  } catch (error: any) {
    console.error("❌ API GET - Erro ao buscar eventos:", error);
    return NextResponse.json(
      { error: error?.message ?? "Erro ao buscar eventos" },
      { status: 400 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    );
  }

  try {
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
      userId: session.user.id,
      attachmentUrls: (body.attachmentUrls as string[] | undefined) ?? [],
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error("❌ API POST - Erro ao criar evento:", error);
    return NextResponse.json(
      { error: error?.message ?? "Erro ao criar evento" },
      { status: 400 },
    );
  }
}
