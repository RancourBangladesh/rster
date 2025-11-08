import { NextResponse } from 'next/server';
import { getSessionUser, getSessionTenantId } from '@/lib/auth';
import { loadAllForTenant, getModifiedShiftsForTenant } from '@/lib/dataStore';

export async function GET() {
  const username = getSessionUser();
  if (!username) return NextResponse.json({error:'Unauthorized'},{status:401});
  
  const tenantId = getSessionTenantId();
  if (!tenantId) return NextResponse.json({error:'No tenant'},{status:400});
  
  // Load tenant data to ensure cache is fresh
  await loadAllForTenant(tenantId);
  
  // Get tenant-specific modified shifts
  const ms = getModifiedShiftsForTenant(tenantId);
  const currentMonth = new Date().toISOString().slice(0,7);
  
  const monthly = ms.monthly_stats[currentMonth] || {
    total_modifications: 0,
    employees_modified: [],
    modifications_by_user: {}
  };
  
  const recent = ms.modifications
    .filter(m => m.month_year === currentMonth)
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
    .slice(0, 50);
  
  return NextResponse.json({
    monthly_stats: monthly,
    recent_modifications: recent,
    current_month: currentMonth
  });
}