import { NextResponse, NextRequest } from 'next/server';
import { getSessionUser, getSessionTenantId } from '@/lib/auth';
import { mergeGoogleIntoAdminForTenant } from '@/lib/rosterMerge';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const username = getSessionUser();
  if (!username) return NextResponse.json({error:'Unauthorized'},{status:401});
  
  const tenantId = getSessionTenantId();
  if (!tenantId) {
    return NextResponse.json({error:'No tenant ID in session'},{status:400});
  }
  
  try {
    // Merge Google (CSV) data into Admin
    const result = await mergeGoogleIntoAdminForTenant(tenantId);
    
    return NextResponse.json({
      success: true,
      message: `CSV data synced successfully. Merged ${result.employeesMerged || 0} employees.`
    });
  } catch (e: any) {
    console.error('CSV sync error:', e);
    return NextResponse.json({
      success: false,
      error: e.message || 'Failed to sync CSV data'
    }, {status: 500});
  }
}
