import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultModules } from "@/lib/modules";

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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const text = (body.text as string | undefined)?.trim();

  if (!text) {
    return NextResponse.json(
      { error: "Texto da captura rápida é obrigatório." },
      { status: 400 },
    );
  }

  await ensureDefaultModules();

  const firstModule = await prisma.module.findFirst({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  if (!firstModule) {
    return NextResponse.json(
      { error: "Nenhum módulo disponível para salvar a captura." },
      { status: 400 },
    );
  }

  const now = new Date();

  await prisma.event.create({
    data: {
      title: text.length > 120 ? text.slice(0, 117) + "..." : text,
      type: EVENT_TYPES.TASK,
      status: EVENT_STATUS.PENDING,
      startDate: now,
      dueDate: now,
      priority: PRIORITY.MEDIUM,
      brief: text,
      moduleId: firstModule.id,
    },
  });

  return NextResponse.json({ ok: true });
}

