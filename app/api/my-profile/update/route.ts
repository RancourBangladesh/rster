import { setTenantEmployeePassword } from '@/lib/employeeAuth';
import { getSubdomainFromHostname } from '@/lib/subdomain';
import { getTenantBySlug } from '@/lib/tenants';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { email, phone, address, photo, gender, newPassword, employeeId } = body;
    
    // Trim passwords to remove any whitespace
    if (newPassword) newPassword = newPassword.trim();
    
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
    
    console.log('[PROFILE UPDATE] Employee ID:', employeeId);
    console.log('[PROFILE UPDATE] Request body:', {
      email,
      phone,
      address,
      gender,
      hasPhoto: !!photo,
      hasNewPassword: !!newPassword
    });

    console.log('[PROFILE UPDATE] Tenant ID:', tenantId);
    
    if (!tenantId) {
      return Response.json({ success: false, error: 'Tenant not found' }, { status: 400 });
    }

    // Validate email if provided
    if (email && !email.includes('@')) {
      return Response.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    // Handle password change if requested (no current password verification needed)
    if (newPassword) {
      console.log('[PROFILE UPDATE] Password change requested');
      console.log('[PROFILE UPDATE] New password length:', newPassword.length);
      
      if (newPassword.length < 6) {
        return Response.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      // Update password directly without verification
      console.log('[PROFILE UPDATE] About to update password for:', employeeId, 'in tenant:', tenantId);
      console.log('[PROFILE UPDATE] New password to set:', newPassword);
      setTenantEmployeePassword(tenantId, employeeId, newPassword);
      console.log('[PROFILE UPDATE] Password update completed');
    }

    // Ensure profile directory exists
    const profileDir = path.join(process.cwd(), 'data', 'tenants', tenantId, 'employees');
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    // Save profile
    const profileFile = path.join(profileDir, `${employeeId}.profile.json`);
    const profile = {
      email: email || '',
      phone: phone || '',
      address: address || '',
      photo: photo || '',
      gender: gender || ''
    };

    console.log('[PROFILE UPDATE] Saving profile to:', profileFile);
    fs.writeFileSync(profileFile, JSON.stringify(profile, null, 2));

    return Response.json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('[POST /api/my-profile/update] Error:', error);
    return Response.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
