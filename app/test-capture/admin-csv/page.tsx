"use client";
import { useState, useEffect } from 'react';
import CsvImportTab from '@/components/AdminTabs/CsvImportTab';

export default function TestAdminCsv() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f5f5f5' }}>
      <CsvImportTab id="csv-import" />
    </div>
  );
}
