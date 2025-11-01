import { NextRequest, NextResponse } from 'next/server';
import { findEmployeeTenant, getEmployeeCredential, saveEmployeeCredential } from '@/lib/employeeAuth';

export async function POST(req: NextRequest) {
  try {
    const { employeeId, currentPassword, newPassword } = await req.json();

    if (!employeeId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find which tenant this employee belongs to
    const tenantId = findEmployeeTenant(employeeId);
    
    // Get current credentials
    const credential = getEmployeeCredential(employeeId, tenantId);
    
    if (!credential) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Verify current password
    if (credential.password !== currentPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Validate new password
    if (newPassword.length < 4) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 4 characters' },
        { status: 400 }
      );
    }

    // Update password
    const updatedCredential = {
      ...credential,
      password: newPassword,
      updated_at: new Date().toISOString()
    };

    saveEmployeeCredential(employeeId, updatedCredential, tenantId);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while changing password' },
      { status: 500 }
    );
  }
}
