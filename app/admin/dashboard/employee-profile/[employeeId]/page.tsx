import AdminPageWrapper from '@/components/AdminPageWrapper';
import AdminEmployeeProfileEdit from '@/components/AdminEmployeeProfileEdit';
import { getSessionUser, getSessionUserData, getSessionTenantId } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default function EmployeeProfilePage({ params }: { params: { employeeId: string } }) {
  const user = getSessionUser();
  if (!user) redirect('/admin/login');
  
  const userData = getSessionUserData();
  const userRole = userData?.role || 'admin';
  const tenantId = getSessionTenantId() || '';

  return (
    <AdminPageWrapper adminUser={user} userRole={userRole}>
      <AdminEmployeeProfileEdit employeeId={params.employeeId} tenantId={tenantId} />
    </AdminPageWrapper>
  );
}
