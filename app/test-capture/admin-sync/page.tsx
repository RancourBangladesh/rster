"use client";
import { useState, useEffect } from 'react';
import RosterSyncTab from '@/components/AdminTabs/RosterSyncTab';

export default function TestAdminSync() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f5f5f5' }}>
      <RosterSyncTab id="roster-sync" />
    </div>
  );
}
