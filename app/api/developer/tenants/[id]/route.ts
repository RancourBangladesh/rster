import { NextRequest, NextResponse } from 'next/server';
import { requireDeveloper } from '@/lib/auth';
import { getTenantById, updateTenant } from '@/lib/tenants';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireDeveloper();
    
    const tenant = getTenantById(params.id);
    
    if (!tenant) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tenant not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      tenant 
    });
  } catch (err) {
    console.error('Get tenant error:', err);
    return NextResponse.json({ 
      success: false, 
      error: 'Unauthorized' 
    }, { status: 401 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireDeveloper();
    
    const updates = await req.json();
    const tenant = updateTenant(params.id, updates);
    
    return NextResponse.json({ 
      success: true, 
      tenant 
    });
  } catch (err: any) {
    console.error('Update tenant error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Failed to update tenant' 
    }, { status: 500 });
  }
}
