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
    
    return NextResponse.json(reminder);
  } catch (error: any) {
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
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao excluir lembrete" },
      { status: 400 },
    );
  }
}
