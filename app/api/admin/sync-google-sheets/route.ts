import { NextResponse } from 'next/server';
import { getSessionUser, getSessionTenantId } from '@/lib/auth';
import { syncGoogleSheets, syncGoogleSheetsForTenant } from '@/lib/googleSync';

export async function POST() {
  if (!getSessionUser()) return NextResponse.json({error:'Unauthorized'},{status:401});
  try {
    const tenantId = getSessionTenantId();
    const res = tenantId 
      ? await syncGoogleSheetsForTenant(tenantId)
      : await syncGoogleSheets();
    return NextResponse.json({success:true, message:`Google Sheets synced: ${res.employees} employees from ${res.sheets} sheet(s).`});
  } catch (e:any) {
    return NextResponse.json({success:false, error:e.message});
  }
}