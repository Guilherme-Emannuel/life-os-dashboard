import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que não requerem autenticação
const publicRoutes = ['/login', '/api/auth/login', '/api/auth/logout'];
// Arquivos estáticos que não requerem autenticação
const staticFiles = ['/_next/', '/favicon.ico', '/manifest.json', '/public/'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Ignorar completamente arquivos estáticos
  if (
    staticFiles.some(path => pathname.startsWith(path)) ||
    pathname.includes('.svg') ||
    pathname.includes('.png') ||
    pathname.includes('.jpg') ||
    pathname.includes('.js') ||
    pathname.includes('.css')
  ) {
    return NextResponse.next();
  }
  
  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => pathname === route);
  
  // Verificar cookie de sessão
  const sessionCookie = req.cookies.get('life_os_session');
  const isAuthenticated = !!sessionCookie?.value;
  
  // Se não está autenticado e não está em rota pública, redirecionar para login
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Se está autenticado e tentando acessar login, redirecionar para dashboard
  if (isAuthenticated && pathname === '/login') {
    const dashboardUrl = new URL('/', req.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image).*)',
  ],
};
