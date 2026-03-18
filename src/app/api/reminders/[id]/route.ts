import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            module: true,
          },
        },
      },
    });
    
    if (!reminder) {
      return NextResponse.json(
        { error: "Lembrete não encontrado" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(reminder);
  } catch (error: any) {
    console.error("❌ API GET /reminders/[id] - Erro:", error);
    return NextResponse.json(
      { error: error?.message ?? "Erro ao buscar lembrete" },
      { status: 400 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log("🔍 API PATCH /reminders - Atualizando lembrete:", { id, body });
    
    const updateData: any = {};
    
    if (body.remindAt) {
      updateData.remindAt = new Date(body.remindAt);
    }
    
    const reminder = await prisma.reminder.update({
      where: { id },
      data: updateData,
      include: {
        event: true,
      },
    });
    
    console.log("✅ API PATCH /reminders - Lembrete atualizado:", reminder);
    
    return NextResponse.json(reminder);
  } catch (error: any) {
    console.error("❌ API PATCH /reminders - Erro:", error);
    return NextResponse.json(
      { error: error?.message ?? "Erro ao atualizar lembrete" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.reminder.delete({
      where: { id },
    });
    
    console.log("✅ API DELETE /reminders - Lembrete excluído:", id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ API DELETE /reminders - Erro:", error);
    return NextResponse.json(
      { error: error?.message ?? "Erro ao excluir lembrete" },
      { status: 400 },
    );
  }
}
