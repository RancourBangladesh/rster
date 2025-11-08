import { NextRequest, NextResponse } from 'next/server';
import { getDisplayForTenant, loadAllForTenant } from '@/lib/dataStore.tenant';
import { getSubdomainFromHostname } from '@/lib/subdomain';
import { getTenantBySlug } from '@/lib/tenants';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get tenant from subdomain (employee portal is always tenant-scoped)
    const hostname = req.headers.get('host') || '';
    const subdomain = getSubdomainFromHostname(hostname);
    
    console.log('[ROSTER-DISPLAY] Subdomain:', subdomain);
    
    if (!subdomain) {
      console.error('[ROSTER-DISPLAY] No subdomain found');
      return NextResponse.json({ 
        error: 'Invalid tenant subdomain',
        teams: {},
        headers: []
      }, { status: 400 });
    }
    
    const tenant = getTenantBySlug(subdomain);
    console.log('[ROSTER-DISPLAY] Tenant lookup:', tenant ? `Found: ${tenant.name} (${tenant.id})` : 'NOT FOUND');
    
    if (!tenant) {
      console.error('[ROSTER-DISPLAY] Tenant not found for subdomain:', subdomain);
      return NextResponse.json({ 
        error: 'Tenant not found',
        teams: {},
        headers: []
      }, { status: 400 });
    }
    
    if (!tenant.is_active) {
      console.error('[ROSTER-DISPLAY] Tenant is inactive');
      return NextResponse.json({ 
        error: 'Tenant is not active',
        teams: {},
        headers: []
      }, { status: 403 });
    }
    
    // Load and return tenant display data
    console.log('[ROSTER-DISPLAY] Loading data for tenant:', tenant.id);
    loadAllForTenant(tenant.id);
    const displayData = getDisplayForTenant(tenant.id);
    
    console.log('[ROSTER-DISPLAY] Display data:', {
      teams: Object.keys(displayData.teams || {}).length,
      headers: displayData.headers?.length || 0,
      employees: displayData.allEmployees?.length || 0
    });
    
    return NextResponse.json(displayData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  } catch (err) {
    console.error('[ROSTER-DISPLAY] Error:', err);
    return NextResponse.json({ 
      error: 'Failed to fetch roster display',
      teams: {},
      headers: []
    }, { status: 500 });
  }
}
