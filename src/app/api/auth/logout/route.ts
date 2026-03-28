import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Remover o cookie de sessão
    cookieStore.delete('life_os_session');

    return NextResponse.json({ success: true, message: 'Logout realizado com sucesso' });

  } catch (error) {
    console.error('❌ Erro no logout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
