import { NextRequest, NextResponse } from "next/server";
import { deleteEvent, getEvent, updateEvent } from "@/lib/events";
import { EventStatus, EventType, Priority } from "@prisma/client";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const event = await getEvent(params.id);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }
  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const body = await req.json();

    const event = await updateEvent(params.id, {
      title: body.title,
      type: body.type as EventType | undefined,
      status: body.status as EventStatus | undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      priority: body.priority as Priority | undefined,
      brief: body.brief,
      outcome: body.outcome,
      moduleId: body.moduleId,
      attachmentUrls: body.attachmentUrls as string[] | undefined,
    });

    return NextResponse.json(event);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao atualizar evento" },
      { status: 400 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  await deleteEvent(params.id);
  return NextResponse.json({ ok: true });
}

