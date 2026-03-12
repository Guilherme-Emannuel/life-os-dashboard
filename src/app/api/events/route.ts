import { NextRequest, NextResponse } from "next/server";
import {
  createEvent,
  listEvents,
  type EventFilters,
} from "@/lib/events";
import { EventStatus, EventType, Priority } from "@prisma/client";

function parseFilters(req: NextRequest): EventFilters {
  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get("moduleId") ?? undefined;
  const type = (searchParams.get("type") as EventType | "ALL" | null) ?? undefined;
  const status =
    (searchParams.get("status") as EventStatus | "ALL" | null) ?? undefined;
  const priority =
    (searchParams.get("priority") as Priority | "ALL" | null) ?? undefined;

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const from = fromParam ? new Date(fromParam) : undefined;
  const to = toParam ? new Date(toParam) : undefined;

  return { moduleId, type, status, priority, from, to };
}

export async function GET(req: NextRequest) {
  const filters = parseFilters(req);
  const events = await listEvents(filters);
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const event = await createEvent({
      title: body.title,
      type: body.type as EventType,
      status: (body.status as EventStatus) ?? EventStatus.PENDING,
      startDate: new Date(body.startDate),
      dueDate: new Date(body.dueDate),
      priority: (body.priority as Priority) ?? Priority.MEDIUM,
      brief: body.brief ?? null,
      outcome: body.outcome ?? null,
      moduleId: body.moduleId,
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

