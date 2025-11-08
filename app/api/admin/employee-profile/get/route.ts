import { getSessionTenantId } from '@/lib/auth';
import { getTenantFromRequest } from '@/lib/subdomain';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const employeeId = url.searchParams.get('employeeId');
    let tenantId = url.searchParams.get('tenantId');

    console.log('[GET /api/admin/employee-profile/get]');
    console.log('  employeeId:', employeeId);
    console.log('  tenantId from params:', tenantId);

    // If tenantId not provided in params, try multiple sources
    if (!tenantId) {
      tenantId = getSessionTenantId();
      console.log('  tenantId from session:', tenantId);
    }
    
    // If still no tenantId, try to get from subdomain
    if (!tenantId) {
      const tenant = getTenantFromRequest(req);
      if (tenant) {
        tenantId = tenant.id;
        console.log('  tenantId from request subdomain:', tenantId);
      }
    }

    if (!employeeId || !tenantId) {
      console.log('  ERROR: Missing required:', { employeeId, tenantId });
      return Response.json(
        { success: false, error: `Employee ID and Tenant ID required. Got employeeId=${employeeId}, tenantId=${tenantId}` },
        { status: 400 }
      );
    }

    console.log('  RESOLVED: Employee:', employeeId, 'Tenant:', tenantId);

    const tenantDir = path.join(process.cwd(), 'data', 'tenants', tenantId);

    if (!fs.existsSync(tenantDir)) {
      console.log('  ERROR: Tenant dir not found:', tenantDir);
      return Response.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Try to find employee in admin-data.json
    const adminDataPath = path.join(tenantDir, 'admin_data.json');
    let employeeInfo = null;
    let allTeams: string[] = [];

    console.log('  Checking admin_data.json at:', adminDataPath);
    if (fs.existsSync(adminDataPath)) {
      try {
        const adminData = JSON.parse(fs.readFileSync(adminDataPath, 'utf8'));
        console.log('  Found admin_data.json, searching for employee...');
        
        // Find employee in admin data
        for (const [teamName, employees] of Object.entries(adminData.teams || {})) {
          const found = (employees as any[]).find((e: any) => e.id === employeeId);
          if (found) {
            console.log('  FOUND in team:', teamName);
            employeeInfo = {
              id: found.id,
              name: found.name,
              currentTeam: teamName
            };
            break;
          }
        }

        // Get all teams (excluding Inactive Employees)
        allTeams = Object.keys(adminData.teams || {}).filter(t => t !== 'Inactive Employees');
      } catch (e) {
        console.error('Error reading admin_data.json:', e);
      }
    } else {
      console.log('  admin_data.json not found');
    }

    // If not found in admin-data, try google-data.json
    if (!employeeInfo) {
      const googleDataPath = path.join(tenantDir, 'google_data.json');
      console.log('  Checking google_data.json at:', googleDataPath);
      
      if (fs.existsSync(googleDataPath)) {
        try {
          const googleData = JSON.parse(fs.readFileSync(googleDataPath, 'utf8'));
          console.log('  Found google_data.json, searching for employee...');
          
          for (const [teamName, employees] of Object.entries(googleData.teams || {})) {
            const found = (employees as any[]).find((e: any) => e.id === employeeId);
            if (found) {
              console.log('  FOUND in team:', teamName);
              employeeInfo = {
                id: found.id,
                name: found.name,
                currentTeam: teamName
              };
              break;
            }
          }

          // Get all teams
          if (!allTeams.length) {
            allTeams = Object.keys(googleData.teams || {}).filter(t => t !== 'Inactive Employees');
          }
        } catch (e) {
          console.error('Error reading google_data.json:', e);
        }
      } else {
        console.log('  google_data.json not found');
      }
    }

    if (!employeeInfo) {
      console.log('  ERROR: Employee not found in any data source');
      // List all employees for debugging
      const adminDataPath = path.join(tenantDir, 'admin_data.json');
      if (fs.existsSync(adminDataPath)) {
        try {
          const adminData = JSON.parse(fs.readFileSync(adminDataPath, 'utf8'));
          const allEmps = Object.entries(adminData.teams || {})
            .flatMap(([, emps]: any) => (emps as any[]).map(e => e.id));
          console.log('  Available employees:', allEmps.slice(0, 10));
        } catch (e) {
          console.error('Debug error:', e);
        }
      }
      return Response.json(
        { success: false, error: 'Employee not found in any data source' },
        { status: 404 }
      );
    }

    // Read employee profile
    const profileDir = path.join(tenantDir, 'employees');
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
        profile = JSON.parse(fs.readFileSync(profileFile, 'utf8'));
      } catch (e) {
        console.error('Error reading profile:', e);
      }
    }

    // Ensure profile has gender field
    if (!profile.gender) {
      profile.gender = '';
    }

    console.log('  SUCCESS: Returning data');
    return Response.json({
      success: true,
      employee: employeeInfo,
      profile,
      teams: allTeams
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('[GET /api/admin/employee-profile/get]', error);
    return Response.json(
      { success: false, error: 'Failed to load employee profile: ' + String(error) },
      { status: 500 }
    );
  }
}
