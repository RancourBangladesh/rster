import { NextRequest, NextResponse } from 'next/server';
import { getDisplay, getDisplayForTenant, loadAllForTenant } from '@/lib/dataStore';
import { findEmployeeTenant } from '@/lib/employeeAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { employeeId } = await req.json();
    
    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });
    }

    // Find which tenant this employee belongs to
    const tenantId = findEmployeeTenant(employeeId);
    
    if (tenantId) {
      // Load tenant data and return tenant-specific display
      loadAllForTenant(tenantId);
      return NextResponse.json(getDisplayForTenant(tenantId));
    }
    
    // Legacy fallback for non-tenant employees
    return NextResponse.json(getDisplay());
  } catch (error: any) {
    console.error('Get roster data error:', error);
    return NextResponse.json(
      { error: 'Failed to load roster data' },
      { status: 500 }
    );
  }
}
