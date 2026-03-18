import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Rotas públicas que não requerem autenticação
const publicRoutes = ['/auth/signin', '/api/auth/signin', '/api/auth/session'];
// Rotas de API que requerem autenticação
const protectedApiRoutes = ['/api/events', '/api/modules', '/api/reminders'];
// Rotas de página que requerem autenticação
const protectedRoutes = ['/', '/admin'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Verificar se é uma rota de API protegida
  const isProtectedApi = protectedApiRoutes.some(route => pathname.startsWith(route));
  
  // Verificar se é uma rota de página protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Se for rota pública, permitir acesso
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Tentar obter o token JWT
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  // Se não houver token e for rota protegida, redirecionar para login
  if (!token && (isProtectedRoute || isProtectedApi)) {
    // Para rotas de API, retornar 401
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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
