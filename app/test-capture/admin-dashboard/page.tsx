"use client";
import { useEffect, useState } from 'react';

// Mock admin context
const mockAdminUser = {
  username: 'admin',
  tenant_id: '96b645ca-8dcc-47b7-ad81-f2b0902e9012',
  tenant_name: 'TechCorp Solutions'
};

export default function TestAdminDashboard() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Set mock session data in localStorage
    localStorage.setItem('adminUser', JSON.stringify(mockAdminUser));
    localStorage.setItem('adminAuth', 'true');
    setReady(true);
  }, []);

  if (!ready) {
    return <div>Loading test environment...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Admin Dashboard - Ready for Screenshot</h1>
      <p>Navigate to: <a href="/admin/dashboard/overview" style={{color: 'blue'}}>Admin Dashboard Overview</a></p>
      <p>Or directly access these pages:</p>
      <ul>
        <li><a href="/admin/dashboard/overview">Dashboard Overview</a></li>
        <li><a href="/admin/dashboard/roster-data">Roster Data View</a></li>
        <li><a href="/admin/dashboard/employee-management">Employee Management</a></li>
        <li><a href="/admin/dashboard/csv-import">CSV Import</a></li>
        <li><a href="/admin/dashboard/schedule-requests">Schedule Requests</a></li>
        <li><a href="/admin/dashboard/roster-sync">Google Sheets Sync</a></li>
        <li><a href="/admin/dashboard/template-creator">Template Creator</a></li>
        <li><a href="/admin/dashboard/user-management">RBAC User Management</a></li>
      </ul>
    </div>
  );
}
