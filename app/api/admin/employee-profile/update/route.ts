import { getSessionUser } from '@/lib/auth';
import { getTenantFromRequest } from '@/lib/subdomain';
import { setTenantEmployeePassword } from '@/lib/employeeAuth';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const adminUser = getSessionUser();
    if (!adminUser) {
      return Response.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    let {
      tenantId,
      employeeId,
      email,
      phone,
      address,
      photo,
      gender,
      team,
      newPassword
    } = body;

    // If tenantId not provided, try to get from subdomain
    if (!tenantId) {
      const tenant = getTenantFromRequest(req);
      if (tenant) {
        tenantId = tenant.id;
      }
    }

    if (!tenantId || !employeeId) {
      return Response.json({ success: false, error: 'Missing required fields: tenantId and employeeId' }, { status: 400 });
    }

    // Trim password
    if (newPassword) newPassword = newPassword.trim();

    console.log('[ADMIN PROFILE UPDATE] Employee ID:', employeeId, 'Tenant:', tenantId);
    console.log('[ADMIN PROFILE UPDATE] Updates:', {
      email,
      phone,
      address,
      gender,
      hasPhoto: !!photo,
      hasNewPassword: !!newPassword,
      team
    });

    // Validate email
    if (email && !email.includes('@')) {
      return Response.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password if provided
    if (newPassword && newPassword.length < 6) {
      return Response.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Update password if provided
    if (newPassword) {
      console.log('[ADMIN PROFILE UPDATE] Setting password for:', employeeId);
      setTenantEmployeePassword(tenantId, employeeId, newPassword);
    }

    // Update team if provided
    if (team) {
      const adminDataPath = path.join(process.cwd(), 'data', 'tenants', tenantId, 'admin_data.json');
      
      if (fs.existsSync(adminDataPath)) {
        console.log('[ADMIN PROFILE UPDATE] Updating team to:', team);
        const adminData = JSON.parse(fs.readFileSync(adminDataPath, 'utf8'));
        
        let employeeData = null;
        let oldTeam = null;

        // Find and remove from old team
        for (const [teamName, employees] of Object.entries(adminData.teams || {})) {
          const empIndex = (employees as any[]).findIndex((e: any) => e.id === employeeId);
          if (empIndex !== -1) {
            employeeData = (employees as any[])[empIndex];
            oldTeam = teamName;
            (employees as any[]).splice(empIndex, 1);
            break;
          }
        }

        // Add to new team
        if (employeeData) {
          if (!adminData.teams[team]) {
            adminData.teams[team] = [];
          }
          adminData.teams[team].push(employeeData);
          console.log('[ADMIN PROFILE UPDATE] Moved from', oldTeam, 'to', team);
        }

        fs.writeFileSync(adminDataPath, JSON.stringify(adminData, null, 2));
      }
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

    console.log('[ADMIN PROFILE UPDATE] Saving profile to:', profileFile);
    fs.writeFileSync(profileFile, JSON.stringify(profile, null, 2));

    return Response.json({
      success: true,
      message: 'Employee profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('[POST /api/admin/employee-profile/update]', error);
    return Response.json(
      { success: false, error: 'Failed to update employee profile: ' + String(error) },
      { status: 500 }
    );
  }
}
