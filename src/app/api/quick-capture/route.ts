import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { EVENT_TYPES, EVENT_STATUS, PRIORITY } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { ensureDefaultModules } from "@/lib/modules";

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
          connect: { id: userId }
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao criar evento" },
      { status: 500 }
    );
  }
}
