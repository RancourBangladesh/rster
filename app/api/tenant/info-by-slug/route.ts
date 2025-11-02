import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenants';

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    
    if (!slug) {
      return NextResponse.json({ 
        success: false,
        error: 'Slug required'
      }, { status: 400 });
    }

    const tenant = getTenantBySlug(slug);
    
    if (!tenant || !tenant.is_active) {
      return NextResponse.json({ 
        success: false,
        tenant: null
      });
    }

    return NextResponse.json({ 
      success: true,
      tenant: {
        name: tenant.name,
        slug: tenant.slug,
        organization_name: tenant.settings?.organization_name || tenant.name,
        logo_url: tenant.settings?.logo_url
      }
    });
  } catch (err) {
    console.error('[TENANT-INFO-BY-SLUG] Error:', err);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch tenant info'
    }, { status: 500 });
  }
}
