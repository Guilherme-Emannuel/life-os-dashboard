import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteEvent, getEvent, updateEvent } from "@/lib/events";
import { parseLocalToUtcDate } from "@/lib/naive-date";
import { prisma } from "@/lib/prisma";

// Constants para tipos (substituindo enums)
const EVENT_TYPES = {
  EVENT: "EVENT",
  REMINDER: "REMINDER", 
  TASK: "TASK"
} as const;

const EVENT_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  OVERDUE: "OVERDUE"
} as const;

const PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
} as const;

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }
  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const body = await req.json();

    // Se só está atualizando status, não precisa converter datas
    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.type !== undefined) updateData.type = body.type as keyof typeof EVENT_TYPES;
    if (body.status !== undefined) updateData.status = body.status as keyof typeof EVENT_STATUS;
    if (body.priority !== undefined) updateData.priority = body.priority as keyof typeof PRIORITY;
    if (body.brief !== undefined) updateData.brief = body.brief;
    if (body.outcome !== undefined) updateData.outcome = body.outcome;
    if (body.moduleId !== undefined) updateData.moduleId = body.moduleId;
    if (body.attachmentUrls !== undefined) updateData.attachmentUrls = body.attachmentUrls as string[];
    
    // Converter datas usando parseLocalToUtcDate
    if (body.startDate !== undefined) {
      updateData.startDate = parseLocalToUtcDate(body.startDate);
    }
    if (body.dueDate !== undefined) {
      updateData.dueDate = parseLocalToUtcDate(body.dueDate);
    }

    const event = await updateEvent(id, updateData);

    return NextResponse.json(event);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao atualizar evento" },
      { status: 400 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    await deleteEvent(id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao deletar evento" },
      { status: 400 },
    );
  }
}

