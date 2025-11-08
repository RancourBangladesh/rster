"use client";
import { useState, useEffect } from 'react';
import EmployeeManagementTab from '@/components/AdminTabs/EmployeeManagementTab';

export default function TestAdminEmployees() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f5f5f5' }}>
      <EmployeeManagementTab id="employee-management" />
    </div>
  );
}
