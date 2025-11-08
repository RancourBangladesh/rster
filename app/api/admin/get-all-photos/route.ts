import { NextRequest, NextResponse } from 'next/server';
import { getSessionTenantId } from '@/lib/auth';
import { getTenantFromRequest } from '@/lib/subdomain';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { employeeIds, tenantId: bodyTenantId } = await request.json();
    
    if (!Array.isArray(employeeIds)) {
      return NextResponse.json({ error: 'employeeIds must be an array' }, { status: 400 });
    }

    // Get tenant ID from multiple sources (same as employee-profile/get)
    let tenantId = request.nextUrl.searchParams.get('tenantId') || bodyTenantId;
    
    if (!tenantId) {
      tenantId = getSessionTenantId();
    }
    
    if (!tenantId) {
      const tenant = getTenantFromRequest(new Request(request));
      if (tenant) {
        tenantId = tenant.id;
      }
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });
    }

    const photosData: Record<string, string> = {};

    // Read photos for all employees in one pass
    for (const employeeId of employeeIds) {
      try {
        const profilePath = path.join(
          process.cwd(),
          'data',
          'tenants',
          tenantId,
          'employees',
          `${employeeId}.profile.json`
        );

        if (fs.existsSync(profilePath)) {
          const content = fs.readFileSync(profilePath, 'utf-8');
          const profile = JSON.parse(content);
          
          if (profile.photo) {
            photosData[employeeId] = profile.photo;
          }
        }
      } catch (err) {
        // Skip this employee if there's an error reading their profile
        console.error(`Failed to load photo for ${employeeId}:`, err);
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    return NextResponse.json(photosData, { headers });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}
