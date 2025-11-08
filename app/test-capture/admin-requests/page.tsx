"use client";
import { useState, useEffect } from 'react';
import ScheduleRequestsTab from '@/components/AdminTabs/ScheduleRequestsTab';

export default function TestAdminRequests() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f5f5f5' }}>
      <ScheduleRequestsTab id="schedule-requests" />
    </div>
  );
}
