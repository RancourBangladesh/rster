"use client";
import { useState, useEffect } from 'react';
import DashboardTab from '@/components/AdminTabs/DashboardTab';

export default function TestAdminOverview() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f5f5f5' }}>
      <DashboardTab id="dashboard" />
    </div>
  );
}
