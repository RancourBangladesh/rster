import { NextResponse, NextRequest } from 'next/server';
import { getSessionUser, getSessionTenantId } from '@/lib/auth';
import { syncGoogleSheetsForTenant } from '@/lib/googleSync';
import { loadAllForTenant } from '@/lib/dataStore.tenant';

export async function POST(req: NextRequest) {
  const username = getSessionUser();
  if (!username) return NextResponse.json({error:'Unauthorized'},{status:401});
  
  const tenantId = getSessionTenantId();
  if (!tenantId) {
    return NextResponse.json({error:'No tenant ID in session'},{status:400});
  }
  
  try {
    // Reload all data from disk to ensure we have the latest links
    loadAllForTenant(tenantId);
    
    const res = await syncGoogleSheetsForTenant(tenantId);
    return NextResponse.json({success:true, message:`Google Sheets synced: ${res.employees} employees from ${res.sheets} sheet(s).`});
  } catch (e:any) {
    return NextResponse.json({success:false, error:e.message});
  }
}