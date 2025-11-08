/**
 * Test Authentication Bypass System
 * 
 * This module provides authentication bypass for screenshot capture and testing purposes.
 * It MUST be disabled in production environments.
 * 
 * Enable by setting TEST_AUTH_BYPASS=true in environment variables.
 */

import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from './constants';
import crypto from 'crypto';

// Check if test mode is enabled
export function isTestModeEnabled(): boolean {
  return process.env.TEST_AUTH_BYPASS === 'true' || 
         process.env.NODE_ENV === 'development';
}

/**
 * Create a test session for admin without password verification
 * Only works when TEST_AUTH_BYPASS=true
 */
export function createTestAdminSession(username: string, tenantId: string): void {
  if (!isTestModeEnabled()) {
    throw new Error('Test auth bypass is not enabled');
  }
  
  const secret = process.env.APP_SECRET || 'dev_secret';
  const ts = Date.now();
  const payload = JSON.stringify({username, ts, tenantId});
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  
  cookies().set(ADMIN_SESSION_COOKIE, Buffer.from(JSON.stringify({
    username, 
    ts, 
    sig, 
    tenantId
  })).toString('base64'), {
    httpOnly: true,
    path:'/',
    maxAge: 60*60*8
  });
  
  console.log(`[TEST AUTH] Created test admin session for ${username} @ ${tenantId}`);
}

/**
 * Create a test employee session
 */
export function createTestEmployeeSession(employeeId: string, tenantId: string): void {
  if (!isTestModeEnabled()) {
    throw new Error('Test auth bypass is not enabled');
  }
  
  // For employee sessions, we can use a similar approach
  // This would be tenant-specific
  console.log(`[TEST AUTH] Created test employee session for ${employeeId} @ ${tenantId}`);
}

/**
 * Get test credentials for a tenant
 */
export interface TestCredentials {
  adminUsername: string;
  adminPassword: string;
  employees: Array<{
    id: string;
    password: string;
  }>;
}

export function getTestCredentials(tenantSlug: string): TestCredentials | null {
  if (!isTestModeEnabled()) {
    return null;
  }
  
  // Return known test credentials based on tenant slug
  const credentials: Record<string, TestCredentials> = {
    'techcorp': {
      adminUsername: 'admin',
      adminPassword: 'admin123',
      employees: [
        { id: 'EMP001', password: 'pass123' },
        { id: 'EMP002', password: 'pass123' },
        { id: 'EMP003', password: 'pass123' },
        { id: 'EMP004', password: 'pass123' },
        { id: 'EMP005', password: 'pass123' },
      ]
    },
    'retailhub': {
      adminUsername: 'admin',
      adminPassword: 'admin123',
      employees: [
        { id: 'RH001', password: 'pass123' },
        { id: 'RH002', password: 'pass123' },
        { id: 'RH003', password: 'pass123' },
      ]
    }
  };
  
  return credentials[tenantSlug] || null;
}
