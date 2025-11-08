import { NextResponse, NextRequest } from 'next/server';
import { getSessionUser, getSessionTenantId } from '@/lib/auth';
import { deleteFile } from '@/lib/utils';
import { getTenantDataDir, getTenantGoogleDataFile, getTenantAdminDataFile, getTenantModifiedShiftsFile, getTenantScheduleRequestsFile, getTenantGoogleLinksFile, getTenantSettingsFile, getTenantEmployeeCredentialsFile } from '@/lib/constants';
import { clearTenantCacheForTenant } from '@/lib/dataStore.tenant';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const username = getSessionUser();
  if (!username) return NextResponse.json({error:'Unauthorized'},{status:401});
  
  const tenantId = getSessionTenantId();
  if (!tenantId) {
    return NextResponse.json({error:'No tenant ID in session'},{status:400});
  }
  
  try {
    console.log('[Hard Reset] Starting hard reset for tenant:', tenantId);
    
    // Delete all tenant-specific data files containing schedule information
    console.log('[Hard Reset] Deleting google_data.json...');
    deleteFile(getTenantGoogleDataFile(tenantId));      // Synced Google Sheets data with all employees & schedules
    console.log('[Hard Reset] Deleting admin_data.json...');
    deleteFile(getTenantAdminDataFile(tenantId));       // Admin-modified schedule data with all shifts
    console.log('[Hard Reset] Deleting modified_shifts.json...');
    deleteFile(getTenantModifiedShiftsFile(tenantId));  // Shift modifications and approved changes
    console.log('[Hard Reset] Deleting schedule_requests.json...');
    deleteFile(getTenantScheduleRequestsFile(tenantId)); // Shift change and swap requests
    console.log('[Hard Reset] Deleting google_links.json...');
    deleteFile(getTenantGoogleLinksFile(tenantId));     // Google Sheets links
    console.log('[Hard Reset] Deleting settings.json...');
    deleteFile(getTenantSettingsFile(tenantId));        // Settings
    console.log('[Hard Reset] Deleting employee_credentials.json...');
    deleteFile(getTenantEmployeeCredentialsFile(tenantId)); // Employee credentials
    
    // Delete display data file (cached merged data)
    const displayDataFile = `${getTenantDataDir(tenantId)}/display_data.json`;
    console.log('[Hard Reset] Deleting display_data.json...');
    try {
      if (fs.existsSync(displayDataFile)) {
        fs.unlinkSync(displayDataFile);
        console.log('[Hard Reset] display_data.json deleted');
      }
    } catch (e) {
      console.error('Failed to delete display_data file:', e);
    }
    
    // Delete read_notifications file
    const readNotificationsFile = `${getTenantDataDir(tenantId)}/read_notifications.json`;
    console.log('[Hard Reset] Deleting read_notifications.json...');
    try {
      if (fs.existsSync(readNotificationsFile)) {
        fs.unlinkSync(readNotificationsFile);
        console.log('[Hard Reset] read_notifications.json deleted');
      }
    } catch (e) {
      console.error('Failed to delete read_notifications file:', e);
    }
    
    // Delete roster templates directory if it exists
    const templatesDir = `${getTenantDataDir(tenantId)}/roster_templates`;
    console.log('[Hard Reset] Deleting roster_templates directory...');
    try {
      if (fs.existsSync(templatesDir)) {
        fs.rmSync(templatesDir, { recursive: true, force: true });
        console.log('[Hard Reset] roster_templates directory deleted');
      }
    } catch (e) {
      console.error('Failed to delete templates directory:', e);
    }
    
    // Delete employees directory and all profile files
    const employeesDir = `${getTenantDataDir(tenantId)}/employees`;
    console.log('[Hard Reset] Deleting employees directory...');
    try {
      if (fs.existsSync(employeesDir)) {
        fs.rmSync(employeesDir, { recursive: true, force: true });
        console.log('[Hard Reset] employees directory deleted');
      }
    } catch (e) {
      console.error('Failed to delete employees directory:', e);
    }
    
    // Delete tenants subdirectory if it exists (contains team-specific data)
    const tenantsSubDir = `${getTenantDataDir(tenantId)}/tenants`;
    console.log('[Hard Reset] Deleting tenants subdirectory...');
    try {
      if (fs.existsSync(tenantsSubDir)) {
        fs.rmSync(tenantsSubDir, { recursive: true, force: true });
        console.log('[Hard Reset] tenants subdirectory deleted');
      }
    } catch (e) {
      console.error('Failed to delete tenants subdirectory:', e);
    }
    
    // Clear the tenant cache completely so fresh data is created when next needed
    console.log('[Hard Reset] Clearing tenant cache...');
    clearTenantCacheForTenant(tenantId);
    console.log('[Hard Reset] Hard reset completed successfully!');
    
    // Verify files are actually deleted
    const adminFile = getTenantAdminDataFile(tenantId);
    const googleFile = getTenantGoogleDataFile(tenantId);
    console.log('[Hard Reset] Verification - admin_data.json exists?', fs.existsSync(adminFile));
    console.log('[Hard Reset] Verification - google_data.json exists?', fs.existsSync(googleFile));
    
    return NextResponse.json({
      success: true,
      message: '✓ HARD RESET COMPLETE! All data permanently deleted:\n\n' +
               '✓ All employee profiles and credentials\n' +
               '✓ All roster data (original & modified)\n' +
               '✓ All schedule assignments and shifts\n' +
               '✓ All shift modifications and approvals\n' +
               '✓ All shift requests and change history\n' +
               '✓ Google Sheets sync data and links\n' +
               '✓ Notifications and activity logs\n' +
               '✓ Roster templates and schedules\n' +
               '✓ All admin settings and configurations\n\n' +
               'Tenant system is now in clean, brand new state.\n' +
               'Ready for fresh data import from Google Sheets or CSV.'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (e: any) {
    console.error('Hard reset error:', e);
    return NextResponse.json({
      success: false,
      error: e.message || 'Failed to reset data'
    }, {status: 500});
  }
}
