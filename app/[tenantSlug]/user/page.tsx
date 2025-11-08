'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TenantUserRedirect() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;

  useEffect(() => {
    // Store tenant context in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('tenant_slug', tenantSlug);
    }
    
    // Redirect to main employee portal with tenant context (user = employee)
    router.push(`/employee?tenant=${tenantSlug}`);
  }, [tenantSlug, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirecting to {tenantSlug} User Portal...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}
