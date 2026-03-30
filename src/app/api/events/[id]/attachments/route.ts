import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Como usamos senha única, defina um userId padrão ou "admin"
    const userId = "admin";

    const { id } = await params;
    const body = await request.json();
    const { url, name, mimeType } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL do anexo é obrigatória' },
        { status: 400 }
      );
    }

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    // Criar anexo
    const attachment = await prisma.attachment.create({
      data: {
        url,
        name: name || null,
        mimeType: mimeType || null,
        event: {
          connect: { id }
        }
      }
    });

    return NextResponse.json(attachment, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao criar anexo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'ID do anexo é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o anexo existe
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        event: {
          select: { userId: true }
        }
      }
    });

    if (!attachment) {
      return NextResponse.json(
        { error: 'Anexo não encontrado' },
        { status: 404 }
      );
    }

    // Deletar anexo
    await prisma.attachment.delete({
      where: { id: attachmentId }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao deletar anexo' },
      { status: 500 }
    );
  }
}
