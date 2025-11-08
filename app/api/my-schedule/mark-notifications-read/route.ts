import { NextRequest, NextResponse } from 'next/server';
import { findEmployeeTenant } from '@/lib/employeeAuth';
import { readJSON, writeJSON } from '@/lib/utils';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * POST /api/my-schedule/mark-notifications-read
 * Mark notifications as read for an employee
 */
export async function POST(req: NextRequest) {
  try {
    const { employeeId } = await req.json();
    
    if (!employeeId) {
      return NextResponse.json({ success: false, error: 'Missing employeeId' }, { status: 400 });
    }

    const tenantId = await findEmployeeTenant(employeeId);
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    // Get or create read notifications file
    const dataDir = path.join(process.cwd(), 'data', 'tenants', tenantId);
    const readNotificationsFile = path.join(dataDir, 'read_notifications.json');
    
    let readNotifications: any = readJSON(readNotificationsFile, {});
    
    // Mark all current notifications as read by storing current timestamp
    readNotifications[employeeId] = new Date().toISOString();
    
    // Write back to file
    writeJSON(readNotificationsFile, readNotifications);

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read'
    });

  } catch (error: any) {
    console.error('[Mark Notifications Read] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
