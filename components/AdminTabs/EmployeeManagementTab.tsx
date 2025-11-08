"use client";
import { useState, useEffect } from 'react';
import { Edit, Save, Plus, Mail, UserX, Users } from 'lucide-react';
import SendPasswordLinkModal from '../Shared/SendPasswordLinkModal';
import Link from 'next/link';

interface Props { id: string; }
interface Employee { 
  name: string; 
  id: string; 
  schedule: string[]; 
  currentTeam?: string; 
  status?: 'active' | 'inactive';
  deleted_at?: string;
  photo?: string;
}
interface AdminData {
  teams: Record<string, Employee[]>;
  headers: string[];
}

function EditEmployeeModal({
  employee,
  onSave,
  onCancel
}: {
  employee: { id: string; name: string; currentTeam?: string };
  onSave: (name: string, id: string) => void;
  onCancel: () => void;
}) {
  const [empName, setEmpName] = useState(employee.name);
  const [empId, setEmpId] = useState(employee.id);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Employee</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-grid two">
            <div>
              <label>Name</label>
              <input
                value={empName}
                onChange={e => setEmpName(e.target.value)}
                placeholder="Full Name"
              />
            </div>
            <div>
              <label>ID (Cannot be changed)</label>
              <input
                value={empId}
                disabled
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                placeholder="EMP ID"
              />
            </div>
          </div>
          <div className="info-box" style={{ marginTop: '1rem' }}>
            <strong>Note:</strong> Employee ID cannot be changed once created to maintain data integrity.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn primary" onClick={() => onSave(empName, empId)}>
            <Save size={16} style={{display:'inline', marginRight:'6px'}} /> Save
          </button>
          <button className="btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeManagementTab({ id }: Props) {
  const [data, setData] = useState<AdminData>({ teams: {}, headers: [] });
  const [empName, setEmpName] = useState('');
  const [empId, setEmpId] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'unassigned'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmp, setEditingEmp] = useState<{ id: string; name: string; currentTeam?: string } | null>(null);
  const [sendingPasswordTo, setSendingPasswordTo] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [reactivateTeam, setReactivateTeam] = useState<Record<string, string>>({});
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Generate a default avatar - user silhouette icon
  function generateDefaultAvatar(name: string): string {
    const svg = `
      <svg width="160" height="160" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="160" height="160" fill="url(#grad)"/>
        <circle cx="80" cy="50" r="25" fill="white" opacity="0.9"/>
        <path d="M 50 110 Q 50 90 80 90 Q 110 90 110 110 L 110 145 Q 110 160 80 160 Q 50 160 50 145 Z" fill="white" opacity="0.9"/>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/get-admin-data');
      if (res.ok) {
        const j = await res.json();
        setData(j);
        
        // Extract tenantId from the URL if available
        const url = new URL(window.location.href);
        const tid = url.searchParams.get('tenantId');
        if (tid) {
          setTenantId(tid);
        }
        
        // Load photos asynchronously in background (don't wait for it)
        loadPhotosAsync(j.teams, tid);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadPhotosAsync(teams: Record<string, Employee[]>, tid: string | null) {
    try {
      // Collect all employee IDs
      const employeeIds: string[] = [];
      Object.values(teams).forEach(employees => {
        employees.forEach(emp => employeeIds.push(emp.id));
      });

      // Fetch all photos in one batch request with tenantId
      const photoRes = await fetch('/api/admin/get-all-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeIds, tenantId: tid }),
        cache: 'no-store'
      });

      if (photoRes.ok) {
        const photosData = await photoRes.json();
        
        // Update state with photos
        setData(prevData => {
          const updatedTeams = { ...prevData.teams };
          Object.keys(updatedTeams).forEach(teamName => {
            updatedTeams[teamName] = updatedTeams[teamName].map((emp: Employee) => ({
              ...emp,
              photo: photosData[emp.id] || undefined
            }));
          });
          return { ...prevData, teams: updatedTeams };
        });
      }
    } catch (err) {
      console.error('Failed to load photos:', err);
    }
  }
  
  useEffect(() => { load(); }, []);

  // Get all employees across all teams
  const allEmployees: Employee[] = [];
  Object.entries(data.teams).forEach(([teamName, employees]) => {
    employees.forEach(emp => {
      allEmployees.push({ ...emp, currentTeam: teamName });
    });
  });

  // Filter employees
  const filteredEmployees = allEmployees.filter(emp => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (!emp.name.toLowerCase().includes(search) && 
          !emp.id.toLowerCase().includes(search) &&
          !emp.currentTeam?.toLowerCase().includes(search)) {
        return false;
      }
    }

    // Status filter
    if (filter === 'active') {
      return emp.status !== 'inactive' && emp.currentTeam !== 'Inactive Employees';
    }
    if (filter === 'inactive') {
      return emp.status === 'inactive' || emp.currentTeam === 'Inactive Employees';
    }
    if (filter === 'unassigned') {
      return emp.currentTeam === 'Unassigned';
    }
    return true; // 'all'
  });

  // Get all team names (excluding Inactive Employees)
  const allTeams = Object.keys(data.teams).filter(t => t !== 'Inactive Employees');

  // Count statistics
  const activeCount = allEmployees.filter(e => e.status !== 'inactive' && e.currentTeam !== 'Inactive Employees').length;
  const inactiveCount = allEmployees.filter(e => e.status === 'inactive' || e.currentTeam === 'Inactive Employees').length;
  const unassignedCount = allEmployees.filter(e => e.currentTeam === 'Unassigned').length;

  async function addEmployee() {
    if (!empName || !empId) {
      alert('Please enter both name and ID');
      return;
    }
    
    const res = await fetch('/api/admin/save-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: empName, 
        id: empId, 
        team: 'Unassigned', // Create in Unassigned team by default
        action: 'add' 
      })
    }).then(r => r.json());
    
    if (res.success) {
      setEmpName(''); 
      setEmpId('');
      load();
    } else {
      alert(res.error || 'Failed to add employee');
    }
  }

  async function editEmployee(name: string, id: string) {
    if (!editingEmp || !name) return;
    
    const res = await fetch('/api/admin/save-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        id: editingEmp.id, // Keep original ID
        team: editingEmp.currentTeam || 'Unassigned',
        action: 'edit',
        oldId: editingEmp.id,
        oldTeam: editingEmp.currentTeam || 'Unassigned'
      })
    }).then(r => r.json());
    
    if (res.success) {
      setEditingEmp(null);
      load();
    } else {
      alert(res.error || 'Failed to edit employee');
    }
  }

  async function reassignEmployee(emp: Employee, newTeam: string) {
    if (emp.status === 'inactive') {
      alert('Cannot reassign inactive employees.');
      return;
    }
    
    if (newTeam === emp.currentTeam) {
      return; // No change
    }
    
    const res = await fetch('/api/admin/save-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: emp.name,
        id: emp.id,
        team: newTeam,
        action: 'edit',
        oldId: emp.id,
        oldTeam: emp.currentTeam
      })
    }).then(r => r.json());
    
    if (res.success) {
      load();
    } else {
      alert(res.error || 'Failed to reassign employee');
    }
  }

  async function deleteEmployee(emp: Employee) {
    if (emp.status === 'inactive') {
      alert('This employee is already inactive.');
      return;
    }
    
    if (!confirm(`Deactivate employee "${emp.name}" (ID: ${emp.id})?\n\nThis will:\n- Move them to "Inactive Employees"\n- Disable their login\n- Reserve their ID permanently\n\nTheir data will be preserved but they cannot log in.`)) {
      return;
    }
    
    const res = await fetch('/api/admin/delete-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: emp.id })
    }).then(r => r.json());
    
    if (res.success) {
      load();
    } else {
      alert(res.error || 'Failed to deactivate employee');
    }
  }

  async function reactivate(emp: Employee, targetTeam: string) {
    if (!targetTeam) {
      alert('Please select a team to reactivate the employee into.');
      return;
    }
    const res = await fetch('/api/admin/reactivate-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: emp.id, targetTeam })
    }).then(r => r.json());

    if (res.success) {
      load();
    } else {
      alert(res.error || 'Failed to reactivate employee');
    }
  }

  function getStatusBadge(emp: Employee) {
    if (emp.status === 'inactive' || emp.currentTeam === 'Inactive Employees') {
      return <span className="badge-inactive">Inactive</span>;
    }
    if (emp.currentTeam === 'Unassigned') {
      return <span className="badge-warning">Unassigned</span>;
    }
    return <span className="badge-active">Active</span>;
  }

  return (
    <div id={id} className="tab-pane employee-management-root">
      <h2>Employee Registry</h2>
      <p>Centralized employee management. Create employees here, then assign them to teams.</p>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dbeafe' }}>
            <Users size={24} style={{ color: '#1e40af' }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{allEmployees.length}</div>
            <div className="stat-label">Total Employees</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dcfce7' }}>
            <Users size={24} style={{ color: '#15803d' }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7' }}>
            <Users size={24} style={{ color: '#b45309' }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{unassignedCount}</div>
            <div className="stat-label">Unassigned</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fee2e2' }}>
            <UserX size={24} style={{ color: '#991b1b' }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{inactiveCount}</div>
            <div className="stat-label">Inactive</div>
          </div>
        </div>
      </div>

      {/* Add Employee Form */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>Create New Employee</h3>
        <div className="info-box" style={{ marginBottom: '1rem' }}>
          <strong>Important:</strong> Employee IDs must be unique and cannot be changed once created. 
          New employees will be created in the &quot;Unassigned&quot; team. Assign them to a team in Team Management.
        </div>
        <div className="form-grid two">
          <div>
            <label>Full Name <span style={{ color: 'red' }}>*</span></label>
            <input
              value={empName}
              onChange={e => setEmpName(e.target.value)}
              placeholder="e.g., John Doe"
            />
          </div>
          <div>
            <label>Employee ID <span style={{ color: 'red' }}>*</span></label>
            <input
              value={empId}
              onChange={e => setEmpId(e.target.value.toUpperCase())}
              placeholder="e.g., EMP001"
            />
          </div>
        </div>
        <div className="actions-row" style={{ marginTop: '1rem' }}>
          <button className="btn primary" onClick={addEmployee}>
            <Plus size={16} style={{display:'inline', marginRight:'6px'}} /> Create Employee
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="filter-row">
          <div className="filter-buttons">
            <button 
              className={`btn small ${filter === 'all' ? 'primary' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({allEmployees.length})
            </button>
            <button 
              className={`btn small ${filter === 'active' ? 'primary' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active ({activeCount})
            </button>
            <button 
              className={`btn small ${filter === 'unassigned' ? 'primary' : ''}`}
              onClick={() => setFilter('unassigned')}
            >
              Unassigned ({unassignedCount})
            </button>
            <button 
              className={`btn small ${filter === 'inactive' ? 'primary' : ''}`}
              onClick={() => setFilter('inactive')}
            >
              Inactive ({inactiveCount})
            </button>
          </div>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, ID, or team..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ minWidth: '250px' }}
            />
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Employee List ({filteredEmployees.length})</h3>
        {filteredEmployees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#999' }}>
            <p>No employees found</p>
          </div>
        ) : (
          <div className="employee-tiles-grid">
            {filteredEmployees.map(emp => (
              <div key={emp.id} className="employee-tile">
                {/* Profile Picture */}
                <div className="employee-avatar">
                  <img
                    src={emp.photo || generateDefaultAvatar(emp.name)}
                    alt={emp.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Employee Name */}
                <div className="employee-name">{emp.name}</div>

                {/* Employee ID */}
                <div className="employee-id">ID: {emp.id}</div>

                {/* Team & Status */}
                <div className="employee-team">
                  <strong>Team:</strong> {emp.currentTeam || 'Unassigned'}
                </div>

                {/* Status */}
                <div className="employee-status-text">
                  {emp.currentTeam === 'Inactive Employees' || emp.status === 'inactive' ? (
                    <span style={{ color: '#991b1b', fontWeight: 700 }}>Deactivated</span>
                  ) : (
                    <span style={{ color: '#15803d', fontWeight: 700 }}>Active</span>
                  )}
                </div>

                {/* Actions */}
                <div className="employee-actions">
                  {emp.status !== 'inactive' && emp.currentTeam !== 'Inactive Employees' && (
                    <>
                      <Link
                        href={`/admin/dashboard/employee-profile/${emp.id}`}
                        className="btn-tile edit-btn"
                        title="Edit employee profile"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        className="btn-tile danger-btn"
                        onClick={() => deleteEmployee(emp)}
                        title="Deactivate employee"
                      >
                        <UserX size={18} />
                      </button>
                    </>
                  )}
                  {(emp.status === 'inactive' || emp.currentTeam === 'Inactive Employees') && (
                    <>
                      <select
                        value={reactivateTeam[emp.id] || ''}
                        onChange={(e) => setReactivateTeam(prev => ({ ...prev, [emp.id]: e.target.value }))}
                        style={{
                          padding: '0.3rem 0.3rem',
                          backgroundColor: '#fef3c7',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          cursor: 'pointer',
                          gridColumn: '1 / -1'
                        }}
                      >
                        <option value="" disabled>Select team</option>
                        {allTeams.map(team => (
                          <option key={team} value={team}>{team}</option>
                        ))}
                      </select>
                      <button
                        className="btn-tile success-btn"
                        onClick={() => reactivate(emp, reactivateTeam[emp.id])}
                        title="Activate employee"
                        style={{ gridColumn: '1 / -1' }}
                      >
                        <Users size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <div className="inline-loading">Loading employee data...</div>}
      
      {sendingPasswordTo && (
        <SendPasswordLinkModal
          employee={sendingPasswordTo}
          onClose={() => setSendingPasswordTo(null)}
        />
      )}

      <style jsx>{`
        .employee-management-root {
          padding: 1rem;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-content {
          flex: 1;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }
        .stat-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }
        .card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .filter-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .filter-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .search-box input {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
        }
        .badge-active {
          padding: 0.25rem 0.75rem;
          background-color: #dcfce7;
          color: #15803d;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .badge-inactive {
          padding: 0.25rem 0.75rem;
          background-color: #fee2e2;
          color: #991b1b;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .badge-warning {
          padding: 0.25rem 0.75rem;
          background-color: #fef3c7;
          color: #b45309;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        /* Employee Tiles Styles */
        .employee-tiles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .employee-tile {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .employee-tile:hover {
          box-shadow: 0 8px 12px rgba(0,0,0,0.1);
          transform: translateY(-1px);
          border-color: #d1d5db;
        }
        
        .employee-avatar {
          width: 100%;
          aspect-ratio: 1;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }
        
        .employee-team {
          font-size: 0.75rem;
          color: #374151;
          padding: 0.4rem 0.75rem;
          text-align: center;
          border-top: 1px solid #f3f4f6;
          border-bottom: 1px solid #f3f4f6;
          word-break: break-word;
          line-height: 1.2;
        }
        
        .employee-status-text {
          font-size: 0.8rem;
          padding: 0.3rem 0.75rem;
          text-align: center;
          line-height: 1.2;
        }
        
        .employee-tile {
          position: relative;
        }
        
        .employee-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: #111827;
          padding: 0.5rem 0.75rem 0.15rem;
          text-align: center;
          word-break: break-word;
          line-height: 1.2;
        }
        
        .employee-id {
          font-size: 0.75rem;
          color: #6b7280;
          padding: 0 0.75rem;
          text-align: center;
          font-weight: 500;
        }
        
        .employee-team {
          font-size: 0.75rem;
          color: #374151;
          padding: 0.4rem 0.75rem;
          text-align: center;
          border-top: 1px solid #f3f4f6;
          border-bottom: 1px solid #f3f4f6;
          word-break: break-word;
          line-height: 1.2;
        }
        
        .employee-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.4rem;
          padding: 0.5rem 0.75rem 0.75rem;
          margin-top: auto;
        }
        
        .btn-tile {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          padding: 0.4rem;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        
        .btn-tile.edit-btn {
          background: #4f46e5;
          color: white;
        }
        
        .btn-tile.edit-btn:hover {
          background: #4338ca;
          transform: scale(1.03);
        }
        
        .btn-tile.danger-btn {
          background: #ef4444;
          color: white;
        }
        
        .btn-tile.danger-btn:hover {
          background: #dc2626;
          transform: scale(1.03);
        }
        
        .btn-tile.success-btn {
          background: #10b981;
          color: white;
        }
        
        .btn-tile.success-btn:hover {
          background: #059669;
          transform: scale(1.03);
        }
        
        .person-fallback {
          font-size: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
        }
        
        @media (max-width: 768px) {
          .filter-row {
            flex-direction: column;
            align-items: stretch;
          }
          .search-box input {
            width: 100%;
          }
          .employee-tiles-grid {
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 0.75rem;
          }
          .employee-name {
            font-size: 0.8rem;
          }
        }
        
        @media (max-width: 480px) {
          .employee-tiles-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
