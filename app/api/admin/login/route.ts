import { NextRequest, NextResponse } from 'next/server';
import { validateAdminLogin, createSession } from '@/lib/auth';
import { findAdminTenant } from '@/lib/adminLookup';
import { getTenantSlugFromRequest } from '@/lib/utils';
import { getTenantBySlug } from '@/lib/tenants';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  
  // Get tenant from subdomain if present
  const subdomainTenantSlug = getTenantSlugFromRequest(request);
  let expectedTenantId: string | undefined = undefined;
  
  if (subdomainTenantSlug) {
    const subdomainTenant = getTenantBySlug(subdomainTenantSlug);
    if (!subdomainTenant || !subdomainTenant.is_active) {
      return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 });
    }
    expectedTenantId = subdomainTenant.id;
  }
  
  // Find which tenant this admin belongs to
  const adminTenantId = findAdminTenant(username);
  
  // If accessed via subdomain, verify admin belongs to that tenant
  if (expectedTenantId && adminTenantId !== expectedTenantId) {
    return NextResponse.json({ error: 'Invalid credentials for this tenant' }, { status: 401 });
  }
  
  // Validate credentials with tenant context
  if (validateAdminLogin(username, password, adminTenantId || undefined)) {
    // Create session with tenant context
    createSession(username, adminTenantId || undefined);
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}