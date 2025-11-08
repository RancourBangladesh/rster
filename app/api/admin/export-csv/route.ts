import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getSessionTenantId } from '@/lib/auth';
import { getAdminForTenant, loadAllForTenant } from '@/lib/dataStore.tenant';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const username = getSessionUser();
  if (!username) return NextResponse.json({error:'Unauthorized'},{status:401});
  
  const tenantId = getSessionTenantId();
  if (!tenantId) {
    return NextResponse.json({error:'No tenant ID in session'},{status:400});
  }
  
  const body = await req.json();
  const { months } = body; // Array of month names like ['Sep', 'Oct'] or null for all
  
  // Load tenant data first
  loadAllForTenant(tenantId);
  
  console.log('[EXPORT-CSV] Tenant ID:', tenantId);
  console.log('[EXPORT-CSV] Months param:', months);
  
  const adminData = getAdminForTenant(tenantId);
  console.log('[EXPORT-CSV] Admin data retrieved:', {
    hasData: !!adminData,
    teamCount: Object.keys(adminData?.teams || {}).length,
    headerCount: adminData?.headers?.length || 0,
    headers: adminData?.headers?.slice(0, 5)
  });
  
  if (!adminData || !adminData.headers || adminData.headers.length === 0) {
    console.error('[EXPORT-CSV] Export failed: No admin data available');
    return NextResponse.json({error: 'No data available'}, {status: 400});
  }
  
  let filteredHeaders: string[] = [];
  let filteredIndices: number[] = [];
  
  if (!months || months.length === 0) {
    // Export all months
    filteredHeaders = adminData.headers;
    filteredIndices = adminData.headers.map((_, i) => i);
    console.log('[EXPORT-CSV] Exporting ALL months:', filteredHeaders.length, 'headers');
  } else {
    // Filter headers by selected months
    console.log('[EXPORT-CSV] Filtering for selected months:', months);
    adminData.headers.forEach((header, idx) => {
      // Extract month from header (e.g., "1Nov" -> "Nov")
      const monthMatch = header.match(/[A-Za-z]+/);
      if (monthMatch && months.includes(monthMatch[0])) {
        filteredHeaders.push(header);
        filteredIndices.push(idx);
      }
    });
    console.log('[EXPORT-CSV] Filtered result:', filteredHeaders.length, 'headers');
  }
  
  if (filteredHeaders.length === 0) {
    return NextResponse.json({error: 'No data found for selected months'}, {status: 400});
  }
  
  // Build CSV
  const headerRow = `Team,Name,ID,${filteredHeaders.join(',')}`;
  const dateRow = `,,Date,${filteredHeaders.map(() => '').join(',')}`;
  const rows: string[] = [headerRow, dateRow];
  
  // Add employee data
  Object.entries(adminData.teams).forEach(([teamName, employees]) => {
    employees.forEach((emp: any) => {
      const schedule = filteredIndices.map(idx => emp.schedule[idx] || '');
      const row = `${teamName},${emp.name},${emp.id},${schedule.join(',')}`;
      rows.push(row);
    });
  });
  
  const csv = rows.join('\n');
  const monthsSuffix = months && months.length > 0 ? `_${months.join('_')}` : '_all';
  
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=admin_schedule${monthsSuffix}.csv`
    }
  });
}
