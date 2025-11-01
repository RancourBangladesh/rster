import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getSessionTenantId } from '@/lib/auth';
import { setGoogleForTenant, setGoogle } from '@/lib/dataStore';
import { parseCsv } from '@/lib/utils';
import { RosterData } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseRosterCsv(csvText: string): RosterData {
  const rows = parseCsv(csvText);
  if (rows.length < 3) return { teams:{}, headers:[], allEmployees:[] };
  
  // Header row is at index 1 (row 2 in spreadsheet)
  const headerRow = rows[1];
  const dateHeaders = headerRow.slice(3);

  const teams: Record<string, any[]> = {};
  let currentTeam = '';
  
  // Data rows start at index 2 (row 3 in spreadsheet)
  for (let i = 2; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length < 4) continue;
    
    // If first column has data, it's a new team
    if (cols[0]) currentTeam = cols[0];
    if (!teams[currentTeam]) teams[currentTeam] = [];
    
    const employee = {
      name: cols[1],
      id: cols[2],
      team: currentTeam,
      currentTeam,
      schedule: cols.slice(3)
    };
    
    // Only add if employee has both name and ID (filters out summary rows)
    if (employee.name && employee.id) teams[currentTeam].push(employee);
  }
  
  const allEmployees: any[] = [];
  Object.values(teams).forEach(emps => emps.forEach(e => allEmployees.push(e)));
  
  return { teams, headers: dateHeaders, allEmployees };
}

export async function POST(req: NextRequest) {
  if (!getSessionUser()) return NextResponse.json({error:'Unauthorized'},{status:401});
  
  const formData = await req.formData();
  const file = formData.get('csv_file') as File | null;
  if (!file) return NextResponse.json({success:false,error:'No file uploaded'});
  
  const text = await file.text();
  
  const tenantId = getSessionTenantId();
  try {
    // Parse CSV using same logic as Google Sheets sync
    const rosterData = parseRosterCsv(text);
    
    if (rosterData.allEmployees.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid employees found in CSV. Make sure the CSV format matches the Google Sheets template.'
      });
    }
    
    if (tenantId) {
      setGoogleForTenant(tenantId, rosterData);
      return NextResponse.json({
        success: true,
        message: `CSV imported successfully! ${rosterData.allEmployees.length} employees from ${Object.keys(rosterData.teams).length} teams.`
      });
    } else {
      setGoogle(rosterData);
      return NextResponse.json({
        success: true,
        message: `CSV imported successfully! ${rosterData.allEmployees.length} employees from ${Object.keys(rosterData.teams).length} teams.`
      });
    }
  } catch (e:any) {
    return NextResponse.json({success:false, error:e.message});
  }
}
