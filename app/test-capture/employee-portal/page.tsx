"use client";
import { useEffect, useState } from 'react';
import ClientDashboard from '@/components/ClientDashboard';

// Mock employee data
const mockEmployee = {
  id: 'EMP001',
  name: 'Alice Johnson',
  team: 'Customer Support'
};

export default function TestEmployeePortal() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Set mock session data in localStorage
    localStorage.setItem('rosterViewerUser', JSON.stringify({
      employeeId: mockEmployee.id,
      fullName: mockEmployee.name
    }));
    localStorage.setItem('rosterViewerAuth', 'true');
    setReady(true);
  }, []);

  if (!ready) {
    return <div>Loading test environment...</div>;
  }

  return (
    <ClientDashboard
      employeeId={mockEmployee.id}
      fullName={mockEmployee.name}
      onLogout={() => {
        console.log('Logout from test');
      }}
    />
  );
}
