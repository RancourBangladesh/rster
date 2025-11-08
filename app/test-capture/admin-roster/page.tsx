"use client";
import { useState, useEffect } from 'react';
import RosterDataTab from '@/components/AdminTabs/RosterDataTab';

export default function TestAdminRoster() {
  const [mounted, setMounted] = useState(false);

  useEffect() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f5f5f5' }}>
      <RosterDataTab id="roster-data" />
    </div>
  );
}
