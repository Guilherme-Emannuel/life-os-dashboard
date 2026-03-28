import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { EVENT_TYPES, EVENT_STATUS, PRIORITY } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { ensureDefaultModules } from "@/lib/modules";

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
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Texto é obrigatório" },
        { status: 400 }
      );
    }

    // Garantir que existem módulos padrão
    await ensureDefaultModules();

    // Buscar o primeiro módulo disponível
    const firstModule = await prisma.module.findFirst({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    if (!firstModule) {
      return NextResponse.json(
        { error: "Nenhum módulo encontrado" },
        { status: 400 }
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
        module: {
          connect: { id: firstModule.id }
        },
        user: {
          connect: { id: session.user.id }
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("❌ Quick Capture API Error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Erro ao criar evento" },
      { status: 500 }
    );
  }
}
