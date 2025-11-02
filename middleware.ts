import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSubdomainFromHostname } from './lib/subdomain';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;
  const hostname = req.headers.get('host') || '';
  
  // Extract tenant slug from subdomain
  const tenantSlug = getSubdomainFromHostname(hostname);
  
  // Handle developer routes (no tenant context)
  if (path.startsWith('/developer')) {
    // Allow login page always
    if (path.startsWith('/developer/login')) return NextResponse.next();
    
    // Check developer session
    const devSession = req.cookies.get('developer_session_v1');
    if (!devSession) {
      url.pathname = '/developer/login';
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  }
  
  // Handle tenant-based routing
  if (tenantSlug) {
    // Set tenant slug in header for API routes to use
    const response = NextResponse.next();
    response.headers.set('x-tenant-slug', tenantSlug);
    
    // Root path redirect to /employee for tenant subdomains
    if (path === '/') {
      const employeeUrl = url.clone();
      employeeUrl.pathname = '/employee';
      return NextResponse.redirect(employeeUrl);
    }
    
    // Handle admin routes with tenant context
    if (path.startsWith('/admin')) {
      // Allow login page always
      if (path.startsWith('/admin/login')) return response;

      // Check admin session
      const session = req.cookies.get('admin_session_v1');
      if (!session) {
        url.pathname = '/admin/login';
        return NextResponse.redirect(url);
      }

      return response;
    }
    
    // Employee routes are open (authenticated at component level)
    if (path.startsWith('/employee')) {
      return response;
    }
    
    return response;
  }
  
  // Non-tenant routing (localhost or main domain)
  // Handle admin routes
  if (path.startsWith('/admin')) {
    // Allow login page always
    if (path.startsWith('/admin/login')) return NextResponse.next();

    // Read cookie
    const session = req.cookies.get('admin_session_v1');
    if (!session) {
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/developer/:path*',
    '/employee/:path*'
  ]
};