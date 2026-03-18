import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dueBefore = searchParams.get("due_before");
    const status = searchParams.get("status");
    
    console.log("🔍 API GET /reminders - Buscando lembretes:", { dueBefore, status });
    
    const where: any = {};
    
    if (dueBefore) {
      where.remindAt = {
        lte: new Date(dueBefore),
      };
    }
    
    // Removendo filtro por status pois não existe no schema do Reminder
    // if (status) {
    //   where.status = status;
    // }
    
    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        event: {
          include: {
            module: true,
          },
        },
      },
      orderBy: {
        remindAt: 'asc',
      },
    });
    
    console.log("📋 API GET /reminders - Lembretes encontrados:", reminders.length, reminders);
    
    return NextResponse.json(reminders);
  } catch (error: any) {
    console.error("❌ API GET /reminders - Erro:", error);
    return NextResponse.json(
      { error: error?.message ?? "Erro ao buscar lembretes" },
      { status: 400 },
    );
  }
}
