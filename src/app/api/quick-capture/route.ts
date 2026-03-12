import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventStatus, EventType, Priority } from "@prisma/client";
import { ensureDefaultModules } from "@/lib/modules";

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
      type: EventType.TASK,
      status: EventStatus.PENDING,
      startDate: now,
      dueDate: now,
      priority: Priority.MEDIUM,
      brief: text,
      moduleId: firstModule.id,
    },
  });

  return NextResponse.json({ ok: true });
}

