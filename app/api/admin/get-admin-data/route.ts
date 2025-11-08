import { NextResponse } from 'next/server';
import { getAdmin, getAdminForTenant, loadAllForTenant } from '@/lib/dataStore';
import { getSessionUser, getSessionTenantId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!getSessionUser()) return NextResponse.json({error:'Unauthorized'},{status:401});
  
  const tenantId = getSessionTenantId();
  if (tenantId) {
    // Ensure tenant data is loaded
    loadAllForTenant(tenantId);
    return NextResponse.json(getAdminForTenant(tenantId), {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  }
  
  // Legacy fallback
  return NextResponse.json(getAdmin(), {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    }
  });
}