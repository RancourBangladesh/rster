/**
 * Utility functions for subdomain detection and tenant context
 */

/**
 * Extract subdomain from hostname
 * Returns null if no subdomain or running on localhost
 */
export function getSubdomainFromHostname(hostname: string): string | null {
  // Skip localhost and common development environments
  if (
    hostname === 'localhost' ||
    hostname.startsWith('127.0.0.1') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.') ||
    hostname.match(/^\d+\.\d+\.\d+\.\d+$/) // Any IP address
  ) {
    return null;
  }
  
  const parts = hostname.split('.');
  
  // If we have a subdomain (e.g., tenant.domain.com or tenant.domain.co.uk)
  // We want at least 3 parts for a subdomain
  if (parts.length >= 3) {
    // The first part is the tenant slug
    const subdomain = parts[0];
    
    // Ignore common subdomains that aren't tenants
    if (subdomain === 'www' || subdomain === 'api' || subdomain === 'admin' || subdomain === 'developer') {
      return null;
    }
    
    return subdomain;
  }
  
  return null;
}

/**
 * Detect tenant from current browser location
 * Used in client components to get tenant context
 */
export function detectTenantFromWindow(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return getSubdomainFromHostname(window.location.hostname);
}
