import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Rotas que não requerem autenticação
const publicRoutes = ['/auth/signin'];
// Rotas de API que requerem autenticação
const protectedApiRoutes = ['/api/events', '/api/modules', '/api/reminders'];
// Rotas de página que requerem autenticação
const protectedRoutes = ['/', '/admin'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Ignorar completamente arquivos estáticos e rotas do NextAuth
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/public/') ||
    pathname.includes('favicon.ico') ||
    pathname.includes('manifest.json') ||
    pathname.includes('.svg') ||
    pathname.includes('.png') ||
    pathname.includes('.jpg') ||
    pathname.includes('.js') ||
    pathname.includes('.css')
  ) {
    return NextResponse.next();
  }
  
  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Se for rota pública, permitir acesso
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Tentar obter o token JWT
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  // Se não houver token, redirecionar para login
  if (!token) {
    // Para rotas de API, retornar 401
    const isProtectedApi = protectedApiRoutes.some(route => pathname.startsWith(route));
    if (isProtectedApi) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }
    
    // Para rotas de página, redirecionar para login
    const loginUrl = new URL('/auth/signin', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Se houver token, permitir acesso
  return NextResponse.next();
}

// Configurar quais rotas o middleware deve interceptar
export const config = {
  matcher: [
    // Ignorar arquivos estáticos e rotas do NextAuth
    '/((?!api/auth|_next|favicon\\.ico|manifest\\.json).*)',
  ],
};
