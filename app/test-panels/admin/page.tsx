"use client";
import { useState, useEffect } from 'react';
import ClientDashboard from '@/components/ClientDashboard';

export default function TestAdminPanel() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Set tenant context in localStorage
    localStorage.setItem('test_tenant_id', '96b645ca-8dcc-47b7-ad81-f2b0902e9012');
    localStorage.setItem('test_admin_user', JSON.stringify({
      username: 'admin',
      role: 'super_admin',
      tenant_id: '96b645ca-8dcc-47b7-ad81-f2b0902e9012'
    }));
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading admin panel...</div>;
  }

  return (
    <div>
      <div style={{ 
        padding: '10px 20px', 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffc107',
        marginBottom: '0'
      }}>
        <strong>⚠️ TEST MODE:</strong> Bypassing authentication for screenshot capture
        <br />
        <small>Tenant: TechCorp Solutions | Admin: admin</small>
      </div>
      <ClientDashboard />
    </div>
  );
}
