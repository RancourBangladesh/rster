import { getSessionUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request, { params }: { params: { employeeId: string } }) {
  try {
    const adminUser = getSessionUser();
    if (!adminUser) {
      return Response.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Get tenantId from query params
    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId');

    if (!tenantId) {
      return Response.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    }

    const employeeId = params.employeeId;

    // Get employee from roster
    const rosterFile = path.join(process.cwd(), 'data', 'tenants', tenantId, 'roster.json');
    let employee = null;

    if (fs.existsSync(rosterFile)) {
      const roster = JSON.parse(fs.readFileSync(rosterFile, 'utf8'));
      employee = roster.find((e: any) => e.id === employeeId);
    }

    if (!employee) {
      return Response.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    // Get employee profile
    const profileDir = path.join(process.cwd(), 'data', 'tenants', tenantId, 'employees');
    const profileFile = path.join(profileDir, `${employeeId}.profile.json`);

    let profile = {
      email: '',
      phone: '',
      address: '',
      photo: ''
    };

    if (fs.existsSync(profileFile)) {
      try {
        profile = JSON.parse(fs.readFileSync(profileFile, 'utf8'));
      } catch (e) {
        console.error('Error reading profile:', e);
      }
    }

    return Response.json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.name,
        team: employee.team,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        photo: profile.photo
      }
    });
  } catch (error) {
    console.error('[GET /api/admin/employee-profile]', error);
    return Response.json(
      { success: false, error: 'Failed to get employee profile' },
      { status: 500 }
    );
  }
}
