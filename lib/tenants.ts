import { v4 as uuidv4 } from 'uuid';
import { Tenant, TenantsFile, AdminUsersFile, AdminUser } from './types';
import { readJSON, writeJSON } from './utils';
import { TENANTS_FILE, getTenantAdminUsersFile } from './constants';

/**
 * Get all tenants
 */
export function getTenants(): TenantsFile {
  return readJSON(TENANTS_FILE, { tenants: [] });
}

/**
 * Save tenants to file
 */
export function saveTenants(data: TenantsFile) {
  writeJSON(TENANTS_FILE, data);
}

/**
 * Get a specific tenant by ID
 */
export function getTenantById(tenantId: string): Tenant | null {
  const tenantsData = getTenants();
  return tenantsData.tenants.find(t => t.id === tenantId) || null;
}

/**
 * Get a specific tenant by slug
 */
export function getTenantBySlug(slug: string): Tenant | null {
  const tenantsData = getTenants();
  return tenantsData.tenants.find(t => t.slug === slug) || null;
}

/**
 * Create a new tenant
 */
export function createTenant(data: {
  name: string;
  slug: string;
  max_users?: number;
  max_employees?: number;
}): Tenant {
  const tenantsData = getTenants();
  
  // Check if slug already exists
  if (tenantsData.tenants.find(t => t.slug === data.slug)) {
    throw new Error('Tenant with this slug already exists');
  }
  
  const newTenant: Tenant = {
    id: uuidv4(),
    name: data.name,
    slug: data.slug,
    created_at: new Date().toISOString(),
    is_active: true,
    settings: {
      max_users: data.max_users,
      max_employees: data.max_employees
    }
  };
  
  tenantsData.tenants.push(newTenant);
  saveTenants(tenantsData);
  
  // Initialize tenant's admin users file
  const tenantAdminUsers: AdminUsersFile = { users: [] };
  writeJSON(getTenantAdminUsersFile(newTenant.id), tenantAdminUsers);
  
  return newTenant;
}

/**
 * Update a tenant
 */
export function updateTenant(tenantId: string, updates: Partial<{
  name: string;
  slug: string;
  is_active: boolean;
  settings: Tenant['settings'];
}>): Tenant {
  const tenantsData = getTenants();
  const tenantIndex = tenantsData.tenants.findIndex(t => t.id === tenantId);
  
  if (tenantIndex === -1) {
    throw new Error('Tenant not found');
  }
  
  // If updating slug, check for conflicts
  if (updates.slug && updates.slug !== tenantsData.tenants[tenantIndex].slug) {
    if (tenantsData.tenants.find(t => t.slug === updates.slug)) {
      throw new Error('Tenant with this slug already exists');
    }
  }
  
  tenantsData.tenants[tenantIndex] = {
    ...tenantsData.tenants[tenantIndex],
    ...updates
  };
  
  saveTenants(tenantsData);
  return tenantsData.tenants[tenantIndex];
}

/**
 * Delete a tenant (soft delete by setting is_active to false)
 */
export function deleteTenant(tenantId: string): void {
  updateTenant(tenantId, { is_active: false });
}

/**
 * Get all admin users for a specific tenant
 */
export function getTenantAdminUsers(tenantId: string): AdminUsersFile {
  return readJSON(getTenantAdminUsersFile(tenantId), { users: [] });
}

/**
 * Save admin users for a specific tenant
 */
export function saveTenantAdminUsers(tenantId: string, data: AdminUsersFile) {
  writeJSON(getTenantAdminUsersFile(tenantId), data);
}

/**
 * Add an admin user to a tenant
 */
export function addTenantAdminUser(tenantId: string, user: Omit<AdminUser, 'created_at' | 'tenant_id'>): AdminUser {
  const adminUsers = getTenantAdminUsers(tenantId);
  
  // Check if user already exists
  if (adminUsers.users.find(u => u.username === user.username)) {
    throw new Error('User with this username already exists in this tenant');
  }
  
  const newUser: AdminUser = {
    ...user,
    tenant_id: tenantId,
    created_at: new Date().toISOString()
  };
  
  adminUsers.users.push(newUser);
  saveTenantAdminUsers(tenantId, adminUsers);
  
  return newUser;
}

/**
 * Validate tenant context from subdomain or path
 */
export function getTenantFromRequest(hostname: string, pathname?: string): Tenant | null {
  // Try to extract tenant from subdomain (e.g., tenant1.domain.com)
  const parts = hostname.split('.');
  if (parts.length > 2) {
    const subdomain = parts[0];
    const tenant = getTenantBySlug(subdomain);
    if (tenant && tenant.is_active) {
      return tenant;
    }
  }
  
  // Try to extract from path (e.g., /tenant/tenant1/...)
  if (pathname) {
    const match = pathname.match(/^\/tenant\/([^\/]+)/);
    if (match) {
      const slug = match[1];
      const tenant = getTenantBySlug(slug);
      if (tenant && tenant.is_active) {
        return tenant;
      }
    }
  }
  
  return null;
}
