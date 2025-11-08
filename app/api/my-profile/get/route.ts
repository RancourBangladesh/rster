import { getSessionTenantId } from '@/lib/auth';
import { getSubdomainFromHostname } from '@/lib/subdomain';
import { getTenantBySlug } from '@/lib/tenants';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  try {
    // Get tenant from subdomain
    const hostname = req.headers.get('host') || '';
    const subdomain = getSubdomainFromHostname(hostname);
    
    if (!subdomain) {
      return Response.json({ success: false, error: 'Invalid tenant' }, { status: 400 });
    }
    
    const tenant = getTenantBySlug(subdomain);
    if (!tenant || !tenant.is_active) {
      return Response.json({ success: false, error: 'Tenant not found' }, { status: 400 });
    }

    const tenantId = tenant.id;
    
    // Get employee ID from query params (sent by frontend from localStorage)
    const url = new URL(req.url);
    const employeeId = url.searchParams.get('employeeId');
    
    console.log('[GET /api/my-profile/get] Employee:', employeeId, 'Tenant:', tenantId);
    
    if (!employeeId) {
      return Response.json({ success: false, error: 'Employee ID required' }, { status: 400 });
    }

    // Read employee profile file
    const profileDir = path.join(process.cwd(), 'data', 'tenants', tenantId, 'employees');
    const profileFile = path.join(profileDir, `${employeeId}.profile.json`);

    let profile = {
      email: '',
      phone: '',
      address: '',
      photo: '',
      gender: ''
    };

    if (fs.existsSync(profileFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(profileFile, 'utf8'));
        profile = data;
      } catch (e) {
        console.error('Error reading profile:', e);
      }
    }

    // Ensure gender field exists
    if (!profile.gender) {
      profile.gender = '';
    }

    return Response.json({
      success: true,
      profile
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('[GET /api/my-profile/get]', error);
    return Response.json(
      { success: false, error: 'Failed to load profile' },
      { status: 500 }
    );
  }
}
