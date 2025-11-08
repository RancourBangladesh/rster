"use client";
import { useEffect, useState, useRef } from 'react';
import { ShiftChangeModal, SwapRequestModal } from './ShiftRequestsModals';
import StatCard from './Shared/StatCard';
import EmployeeSearch from './Shared/EmployeeSearch';
import MonthCompactCalendar from './Shared/MonthCompactCalendar';
import ShiftView from './ShiftView';
import NotificationPanel from './Shared/NotificationPanel';
import NotificationToast from './Shared/NotificationToast';
import ProfileManagement from './ProfileManagement';
import { LogOut, RefreshCw, Calendar as CalendarIcon, Edit3, ArrowLeftRight, Eye, Search as SearchIcon, CalendarDays, Umbrella, CheckCircle2, Settings } from 'lucide-react';
import { SHIFT_MAP } from '@/lib/constants';

/**
 * This is your backup ClientDashboard with ONLY the required additions:
 * 1. teamMembers state derived from the logged-in user's team (excluding self).
 * 2. Pass teamMembers into SwapRequestModal so the swap modal can list/select them.
 * 3. Provide headers & mySchedule to both modals (already present for ShiftChange; kept for Swap).
 * 4. No other layout / behavioral changes (stat cards remain for logged-in user only).
 */

interface ScheduleData {
  employee: { name:string; id:string; team:string };
  today: { date:string; weekday?:string; shift:string; shift_code?:string };
  tomorrow: { date:string; weekday?:string; shift:string; shift_code?:string };
  upcoming_work_days: any[];
  planned_time_off: any[];
  shift_changes: any[];
  summary: { next_work_days_count:number; planned_time_off_count:number; shift_changes_count:number };
  success: boolean;
}

interface RequestHistory {
  id:string;
  type:'shift_change'|'swap';
  status:string;
  date:string;
  created_at:string;
  reason:string;
  requested_shift?:string;
  current_shift?:string;
  requester_shift?:string;
  target_shift?:string;
  requester_name?:string;
  target_employee_name?:string;
}

interface TeamMember {
  id: string;
  name: string;
  schedule: string[];
}

interface Props {
  employeeId: string;
  fullName: string;
  onLogout: ()=>void;
}

type ViewMode = 'self' | 'other';

export default function ClientDashboard({employeeId, fullName, onLogout}:Props) {
  console.log('[ClientDashboard] Component mounted with employeeId:', employeeId);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [baseData,setBaseData]=useState<ScheduleData|null>(null);
  const [roster,setRoster]=useState<any>(null);
  const [requests,setRequests]=useState<RequestHistory[]>([]);
  const [selectedDate,setSelectedDate]=useState<string>('');
  const [selectedShift,setSelectedShift]=useState<string>('');
  const [userSelectedDate,setUserSelectedDate]=useState<string>('');
  const [showChange,setShowChange]=useState(false);
  const [showSwap,setShowSwap]=useState(false);
  const [showShiftView,setShowShiftView]=useState(false);
  const [headers,setHeaders]=useState<string[]>([]);
  const [mySchedule,setMySchedule]=useState<string[]>([]);
  const [refreshing,setRefreshing]=useState(false);
  const [showSelectedDateSection,setShowSelectedDateSection]=useState(false);

  const [mode,setMode]=useState<ViewMode>('self');
  const [otherData,setOtherData]=useState<ScheduleData|null>(null);
  const [otherSchedule,setOtherSchedule]=useState<string[]>([]);
  const [approvedRequests,setApprovedRequests]=useState<RequestHistory[]>([]);
  const [showCalendar,setShowCalendar]=useState(false);
  const [rerenderKey,setRerenderKey]=useState(0);
  const [todayDateHeader,setTodayDateHeader]=useState<string>('');
  const lastActionRef = useRef<string>('');
  const selectedDateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const calendarInactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // NEW: team members (same team, excluding current user) for swap modal
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tenantInfo, setTenantInfo] = useState<{name: string; organization_name: string; logo_url?: string} | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState<{email: string; phone: string; address: string; photo: string} | null>(null);
  const [notification, setNotification] = useState<{id: string; message: string; type: 'success' | 'error' | 'info'} | null>(null);

  async function loadProfileData() {
    try {
      const savedUser = localStorage.getItem('rosterViewerUser');
      if (!savedUser) return;
      const user = JSON.parse(savedUser);
      
      const res = await fetch(`/api/my-profile/get?employeeId=${encodeURIComponent(user.employeeId)}&t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setProfileData(data.profile);
      }
    } catch(e) {
      console.error('[LoadProfile] error', e);
    }
  }

  function handleProfileUpdated() {
    loadProfileData();
    setNotification({
      id: Date.now().toString(),
      message: '✓ Profile Updated Successfully',
      type: 'success'
    });
  }

  async function loadTenantInfo() {
    try {
      const res = await fetch('/api/my-schedule/tenant-info');
      const data = await res.json();
      if (data.success && data.tenant) {
        setTenantInfo(data.tenant);
      }
    } catch(e) {
      console.error('[TenantInfo] load error', e);
    }
  }

  async function loadBaseSchedule() {
    console.debug('[Load] Base schedule for', employeeId);
    setLoading(true); setError('');
    try {
      // TEMP: Log that we're about to fetch
      console.log('[ClientDash] About to fetch /api/my-schedule/' + employeeId);
      const res = await fetch(`/api/my-schedule/${employeeId}`, { cache: 'no-store' });
      console.log('[ClientDash] Fetch response received, status:', res.status);
      const j = await res.json();
      console.log('[ClientDash] API Response Status:', res.ok, 'Success field:', j.success);
      console.log('[ClientDash] Response object:', j);
      if (!res.ok || !j.success) {
        const errorMsg = j.error||'Error loading schedule';
        console.error('[ClientDash] API Error:', errorMsg);
        setError(errorMsg); 
        setLoading(false); 
        return;
      }
      console.log('[ClientDash] Setting baseData with:', {
        employee: j.employee,
        today: j.today,
        tomorrow: j.tomorrow,
        upcoming_count: j.upcoming_work_days?.length,
        timeoff_count: j.planned_time_off?.length,
        changes_count: j.shift_changes?.length
      });
      setBaseData(j);
    } catch(e:any) {
      console.error('[ClientDash] Fetch error:', e);
      setError(e.message);
    }
    setLoading(false);
  }

  async function loadRoster() {
    console.log('[ClientDash] loadRoster() called');
    try {
      const res = await fetch('/api/my-schedule/roster-display', { cache: 'no-store' }).then(r=>r.json());
      setRoster(res);
      setHeaders(res.headers||[]);
      const teamEntry = Object.entries(res.teams||{}).find(([,list]:any)=> list.some((e:any)=> e.id===employeeId));
      if (teamEntry) {
        const employees = teamEntry[1] as any[];
        const mine = employees.find((e:any)=>e.id===employeeId);
        if (mine) {
          setMySchedule(mine.schedule);
        }
        // Populate team members for swap (exclude self)
        const tm: TeamMember[] = employees
          .filter((e:any)=> e.id !== employeeId)
          .map((e:any)=> ({
            id: e.id,
            name: e.name,
            schedule: Array.isArray(e.schedule) ? e.schedule : []
          }));
        setTeamMembers(tm);
      } else {
        setTeamMembers([]);
      }
    } catch(e) {
      console.error('[Roster] load error', e);
      setTeamMembers([]);
    }
  }

  async function loadRequests() {
    try {
      const res = await fetch('/api/schedule-requests/get-employee-requests',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({employeeId})
      }).then(r=>r.json());

      if (res.success) {
        const sorted = res.requests.sort((a:any,b:any)=> (b.created_at || '').localeCompare(a.created_at||''));
        setRequests(sorted);
        const approved = sorted.filter((r: RequestHistory) => r.status === 'approved');
        setApprovedRequests(approved);
      }
    } catch(e) {
      console.error('[Requests] load error', e);
    }
  }

  async function refreshAll() {
    console.debug('[RefreshAll] start');
    setRefreshing(true);
    await loadTenantInfo();
    await loadProfileData();
    await Promise.all([loadBaseSchedule(), loadRoster(), loadRequests()]);
    setRefreshing(false);
    console.debug('[RefreshAll] done');
  }

  useEffect(()=>{ 
    console.log('[ClientDashboard] useEffect triggered for employeeId:', employeeId);
    refreshAll(); 
  },[employeeId]);

  function onCalendarSelect(date:string, shift:string) {
    setUserSelectedDate(date);
    setSelectedDate(date);
    setSelectedShift(shift);
    setShowSelectedDateSection(true);
    
    // Clear any existing timer
    if (selectedDateTimerRef.current) {
      clearTimeout(selectedDateTimerRef.current);
    }
    
    // Set auto-hide timer (18 seconds)
    selectedDateTimerRef.current = setTimeout(() => {
      setShowSelectedDateSection(false);
      setUserSelectedDate('');
      setSelectedDate('');
      setSelectedShift('');
    }, 18000);
  }

  function closeSelectedDateSection() {
    if (selectedDateTimerRef.current) {
      clearTimeout(selectedDateTimerRef.current);
    }
    setShowSelectedDateSection(false);
    setSelectedDate('');
    setSelectedShift('');
  }

  function resetCalendarInactivityTimer() {
    // Clear existing timer
    if (calendarInactivityTimerRef.current) {
      clearTimeout(calendarInactivityTimerRef.current);
    }
    
    // Set new 5 second timer
    calendarInactivityTimerRef.current = setTimeout(() => {
      setShowCalendar(false);
    }, 5000);
  }

  function myShiftForDate(date:string) {
    const idx = headers.indexOf(date);
    if (idx === -1) return '';
    return mySchedule[idx] || '';
  }

  function getShiftForDate(date:string) {
    const idx = headers.indexOf(date);
    if (idx === -1) return '';
    // Use active schedule (otherSchedule if viewing other employee, mySchedule otherwise)
    return activeScheduleArray[idx] || '';
  }

  function getWeekdayFromDateHeader(dateHeader: string | undefined): string {
    if (!dateHeader) return '';
    const match = dateHeader.match(/^(\d+)([A-Za-z]+)$/);
    if (match) {
      const day = parseInt(match[1]);
      const month = match[2];
      const monthNum = new Date(`${month} ${day}, 2025`).getMonth();
      const date = new Date(2025, monthNum, day);
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    return '';
  }

  const handleEmployeeSearch = async (employee: any) => {
    if (!employee) return;
    if (employee.id === employeeId) {
      console.debug('[Search] Selected self -> resetting.');
      resetToMySchedule();
      return;
    }
    lastActionRef.current = `search:${employee.id}`;
    console.debug('[Search] Loading other employee:', employee.id);
    try {
      const res = await fetch(`/api/my-schedule/${employee.id}`);
      const j = await res.json();
      if (j.success) {
        setOtherData(j);
        setMode('other');
        if (roster?.teams) {
          for (const [, group] of Object.entries(roster.teams)) {
            const emp = (group as any[]).find(e=>e.id===employee.id);
            if (emp) {
              setOtherSchedule(emp.schedule);
              break;
            }
          }
        }
        setSelectedDate('');
        setSelectedShift('');
        setShowCalendar(false);
        console.debug('[Search] Now in OTHER mode');
      }
    } catch(e) {
      console.error('[Search] error loading other employee', e);
    }
  };

  const resetToMySchedule = () => {
    console.debug('[Reset] Back to MY schedule (mode self)');
    lastActionRef.current = 'reset';
    setMode('self');
    setOtherData(null);
    setOtherSchedule([]);
    setSelectedDate('');
    setSelectedShift('');
    setShowCalendar(false);
    setRerenderKey(k=>k+1);
    refreshAll();
  };

  useEffect(()=>{
    if (mode === 'other' && !otherData) {
      console.debug('[Guard] mode other but no otherData -> switching to self');
      setMode('self');
    }
  },[mode, otherData]);

  // Set today's date header for calendar highlighting
  useEffect(() => {
    if (headers && headers.length > 0) {
      const today = new Date();
      const day = today.getDate();
      const month = today.toLocaleString('en-US', { month: 'short' });
      const todayLabel = `${day}${month}`;
      const found = headers.find(h => h === todayLabel || h.includes(todayLabel));
      if (found) {
        setTodayDateHeader(found);
      }
    }
  }, [headers]);

  // Handle click outside calendar to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showCalendar) return;
      
      const target = event.target as HTMLElement;
      const calendarButton = document.querySelector('[data-calendar-button]');
      const calendarDropdown = document.querySelector('[data-calendar-dropdown]');
      
      // Check if click is outside both button and dropdown
      if (
        calendarButton && !calendarButton.contains(target) &&
        calendarDropdown && !calendarDropdown.contains(target)
      ) {
        setShowCalendar(false);
        // Clear timer when closing
        if (calendarInactivityTimerRef.current) {
          clearTimeout(calendarInactivityTimerRef.current);
        }
      }
    };
    
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showCalendar]);

  const isOther = mode === 'other' && !!otherData;
  const activeData = isOther && otherData ? otherData : baseData;
  const activeToday = isOther && otherData ? otherData.today : baseData?.today;
  const activeTomorrow = isOther && otherData ? otherData.tomorrow : baseData?.tomorrow;
  const activeScheduleArray = isOther ? otherSchedule : mySchedule;

  // Format date string to be more readable (e.g., "1November" -> "1 Nov")
  const formatDate = (dateStr: string) => {
    const match = dateStr.match(/^(\d+)([A-Za-z]+)$/);
    if (match) {
      const day = match[1];
      const month = match[2];
      const monthAbbr = month.substring(0, 3);
      return `${day} ${monthAbbr}`;
    }
    return dateStr;
  };

  const getShiftChangeForDate = (date: string) => {
    if (!approvedRequests.length) return null;
    return approvedRequests.find(r => r.date === date && r.status === 'approved') || null;
  };

  const getAllEmployees = () => {
    if (!roster?.teams) return [];
    const employees: any[] = [];
    Object.entries(roster.teams).forEach(([teamName, teamEmployees]: [string, any]) => {
      (teamEmployees as any[]).forEach((emp: any) => {
        employees.push({ id: emp.id, name: emp.name, team: teamName });
      });
    });
    return employees;
  };

  return (
    <div className="container" data-view-mode={mode} style={{background: '#f5f7fa', minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      {/* Static Header */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            {tenantInfo?.logo_url && (
              <img src={tenantInfo.logo_url} alt={tenantInfo.organization_name} style={{width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px'}} />
            )}
            <div>
              <h1 style={{margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827'}}>
                {tenantInfo?.organization_name || 'Employee Portal'}
              </h1>
              <p style={{margin: 0, fontSize: '13px', color: '#6b7280'}}>Schedule Management</p>
            </div>
            {isOther && otherData && (
              <div style={{marginLeft: '32px', paddingLeft: '32px', borderLeft: '2px solid #e5e7eb'}}>
                <p style={{margin: 0, fontSize: '13px', color: '#6b7280'}}>Viewing</p>
                <h2 style={{margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827'}}>{otherData.employee.name}</h2>
              </div>
            )}
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            {profileData?.photo && (
              <img 
                src={profileData.photo} 
                alt={fullName}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '6px',
                  objectFit: 'cover',
                  border: '1px solid #e5e7eb',
                  flexShrink: 0
                }}
              />
            )}
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px'}}>
              <div style={{fontSize: '14px', fontWeight: 600, color: '#111827'}}>{isOther ? fullName : fullName}</div>
              <div style={{fontSize: '12px', color: '#6b7280'}}>ID: {employeeId}</div>
              {baseData?.employee?.team && (
                <div style={{fontSize: '12px', color: '#4b5563', fontWeight: 500}}>Team: {baseData.employee.team}</div>
              )}
            </div>
            <NotificationPanel employeeId={employeeId} />
            <button onClick={() => setShowProfileModal(true)} style={{padding: '8px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#374151'}}>
              <Settings size={16} />
            </button>
            <button onClick={refreshAll} disabled={refreshing} style={{padding: '8px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: refreshing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#374151'}}>
              <RefreshCw size={16} style={{animation: refreshing ? 'spin 1s linear infinite' : 'none'}} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            {isOther && (
              <button onClick={resetToMySchedule} style={{padding: '8px 16px', background: '#6b7280', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#fff', fontWeight: 500}}>
                ← Back
              </button>
            )}
            <button onClick={onLogout} style={{padding: '8px 16px', background: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#fff', fontWeight: 500}}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </div>
      <div className="app-container" style={{width: '100%', padding: '0', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1}} key={rerenderKey}>
        <div className="app-header" style={{display: 'none'}}>
          <div>
            <h2>Shift Dashboard</h2>
            <div className="user-info" style={{display:'flex', flexDirection:'column', gap:6}}>
              <span>Welcome, <strong>{fullName}</strong> ({employeeId})</span>
              <div className="user-actions" style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                <button className="logout-btn" onClick={onLogout} style={{display: 'none'}}>Logout</button>
                <button className="btn small" onClick={refreshAll} disabled={refreshing} style={{display:'inline-flex', alignItems:'center', gap:6}}>
                  {refreshing ? 'Refreshing...' : (<><RefreshCw size={14} /> Refresh</>)}
                </button>
                {isOther && (
                  <button
                    className="btn small"
                    onClick={resetToMySchedule}
                    style={{background:'#0d3d74'}}
                  >
                    ← Back to My Schedule
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="sync-controls">
            <div className="sync-status">
              {loading? 'Loading schedule...' : 'Schedule Loaded'}
            </div>
            <div style={{fontSize:'.55rem', letterSpacing:'.8px', textTransform:'uppercase', color:'#6E8298'}}>
              Select a date below to request a change or swap
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {!loading && activeData &&
          <div style={{padding: '24px', flex: 1, display: 'flex', flexDirection: 'column'}}>
            {/* Today & Tomorrow Cards - Side by Side */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px'}}>
              {/* Today's Shift Card */}
              <div style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{fontSize: '13px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px'}}>
                  Today&apos;s Shift
                </div>
                <div style={{fontSize: '12px', color: '#9ca3af', marginBottom: '8px'}}>
                  {activeToday?.weekday && activeToday?.date ? `${activeToday.weekday}, ${activeToday.date}` : activeToday?.date || 'N/A'}
                </div>
                {(() => {
                  const todayChange = activeData?.shift_changes?.find(c => c.date === activeToday?.date);
                  return (
                    <div style={{fontSize: '32px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em'}}>
                      {todayChange ? (
                        <div>
                          <span style={{textDecoration: 'line-through', color: '#d1d5db', fontSize: '24px'}}>
                            {todayChange.original_shift}
                          </span>
                          <div style={{fontSize: '28px', color: '#10b981', fontWeight: 700, marginTop: '4px'}}>
                            → {todayChange.current_shift}
                          </div>
                        </div>
                      ) : (
                        activeToday?.shift || 'N/A'
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Tomorrow's Shift Card */}
              <div style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{fontSize: '13px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px'}}>
                  Tomorrow&apos;s Shift
                </div>
                <div style={{fontSize: '12px', color: '#9ca3af', marginBottom: '8px'}}>
                  {activeTomorrow?.weekday && activeTomorrow?.date ? `${activeTomorrow.weekday}, ${activeTomorrow.date}` : activeTomorrow?.date || 'N/A'}
                </div>
                {(() => {
                  const tomorrowChange = activeData?.shift_changes?.find(c => c.date === activeTomorrow?.date);
                  return (
                    <div style={{fontSize: '32px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em'}}>
                      {tomorrowChange ? (
                        <div>
                          <span style={{textDecoration: 'line-through', color: '#d1d5db', fontSize: '24px'}}>
                            {tomorrowChange.original_shift}
                          </span>
                          <div style={{fontSize: '28px', color: '#10b981', fontWeight: 700, marginTop: '4px'}}>
                            → {tomorrowChange.current_shift}
                          </div>
                        </div>
                      ) : (
                        activeTomorrow?.shift || 'N/A'
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Calendar and Actions Section */}
            <div style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              marginBottom: '24px'
            }}>
              {showSelectedDateSection && selectedDate && (
                <div style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px',
                  position: 'relative'
                }}>
                  <button
                    onClick={closeSelectedDateSection}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      fontSize: '20px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Close"
                  >
                    ✕
                  </button>
                  <div style={{fontSize: '13px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px'}}>Selected Date</div>
                  <div style={{fontSize: '14px', color: '#9ca3af', marginBottom: '8px'}}>
                    {getWeekdayFromDateHeader(selectedDate) && `${getWeekdayFromDateHeader(selectedDate)}, `}
                    {formatDate(selectedDate)}
                  </div>
                  {(() => {
                    const selectedChange = activeData?.shift_changes?.find(c => c.date === selectedDate);
                    const shiftCode = getShiftForDate(selectedDate);
                    const shiftTime = SHIFT_MAP[shiftCode] || shiftCode || 'N/A';
                    
                    return (
                      <div style={{fontSize: '28px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em'}}>
                        {selectedChange ? (
                          <div>
                            <span style={{textDecoration: 'line-through', color: '#d1d5db', fontSize: '22px'}}>
                              {selectedChange.original_shift}
                            </span>
                            <div style={{fontSize: '24px', color: '#10b981', fontWeight: 700, marginTop: '4px'}}>
                              → {selectedChange.current_shift}
                            </div>
                          </div>
                        ) : (
                          shiftTime
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {headers.length > 0 && (
                <div 
                  style={{
                    position: 'relative',
                    display: 'inline-block'
                  }}
                >
                  <button 
                    data-calendar-button
                    onClick={() => {
                      setShowCalendar(true);
                      resetCalendarInactivityTimer();
                    }}
                    style={{
                      padding: '10px 16px',
                      background: showCalendar ? '#3b82f6' : '#f3f4f6',
                      color: showCalendar ? '#fff' : '#374151',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <CalendarIcon size={14} /> Calendar
                  </button>
                  
                  {showCalendar && activeScheduleArray.length > 0 && (
                    <div 
                      data-calendar-dropdown
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '8px',
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        zIndex: 50,
                        animation: 'slideDown 0.2s ease-out',
                        width: '360px'
                      }}
                      onMouseEnter={resetCalendarInactivityTimer}
                      onMouseMove={resetCalendarInactivityTimer}
                    >
                      <MonthCompactCalendar 
                        headers={headers}
                        selectedDate={selectedDate || todayDateHeader}
                        onSelect={(d)=>{
                          resetCalendarInactivityTimer();
                          // Only show Selected Date section if it's different from today
                          if (d !== todayDateHeader) {
                            onCalendarSelect(d, getShiftForDate(d));
                          }
                        }}
                        showWeekdays
                        showNavigation
                      />
                    </div>
                  )}
                  {showCalendar && activeScheduleArray.length === 0 && (
                    <div 
                      data-calendar-dropdown
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '8px',
                        padding: '16px',
                        textAlign: 'center',
                        color: '#6b7280',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        zIndex: 50,
                        animation: 'slideDown 0.2s ease-out'
                      }}
                      onMouseEnter={resetCalendarInactivityTimer}
                      onMouseMove={resetCalendarInactivityTimer}
                    >
                      No schedule data available.
                    </div>
                  )}
                </div>
              )}

              {mode === 'self' && (
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginTop: '20px',
                  paddingTop: '20px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <button 
                    onClick={()=>setShowShiftView(true)}
                    style={{
                      padding: '12px 20px',
                      background: '#6b7280',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Eye size={16} /> View All Shifts
                  </button>
                  <button 
                    onClick={() => setShowChange(true)}
                    style={{
                      padding: '12px 20px',
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Edit3 size={16} /> Request Change
                  </button>
                  <button 
                    onClick={() => setShowSwap(true)}
                    style={{
                      padding: '12px 20px',
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <ArrowLeftRight size={16} /> Request Swap
                  </button>
                </div>
              )}
            </div>

            {/* Employee Search Section */}
            {roster && getAllEmployees().length > 0 && (
              <div style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <SearchIcon size={18} /> Search Other Employees
                </h3>
                <EmployeeSearch 
                  employees={getAllEmployees()}
                  onSelect={handleEmployeeSearch}
                  placeholder="Search employees by name, ID, or team..."
                />
              </div>
            )}

            {/* Stats Section */}
            {baseData && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <StatCard
                  icon={<CalendarDays size={18} />}
                  value={baseData.summary.next_work_days_count}
                  label="Upcoming Days"
                  subtitle="Next 7 view"
                  details={baseData.upcoming_work_days}
                  detailsType="workdays"
                />
                <StatCard
                  icon={<Umbrella size={18} />}
                  value={baseData.summary.planned_time_off_count}
                  label="Planned Time Off"
                  subtitle="30 days span"
                  details={baseData.planned_time_off}
                  detailsType="timeoff"
                />
                <StatCard
                  icon={<RefreshCw size={18} />}
                  value={baseData.summary.shift_changes_count}
                  label="Shift Changes"
                  subtitle="Vs original"
                  details={baseData.shift_changes}
                  detailsType="changes"
                />
                {approvedRequests.length > 0 && (
                  <StatCard
                    icon={<CheckCircle2 size={18} />}
                    value={approvedRequests.length}
                    label="Approved Shifts"
                    subtitle="Approved requests"
                    details={approvedRequests.map(r => ({
                      date: r.date,
                      type: r.type,
                      original_shift: r.current_shift || r.requester_shift || 'N/A',
                      current_shift: r.requested_shift || r.target_shift || 'N/A'
                    }))}
                    detailsType="changes"
                  />
                )}
              </div>
            )}
          </div>
        }
      </div>

      {baseData &&
        <ShiftChangeModal
          open={showChange}
          onClose={()=>setShowChange(false)}
          employeeId={employeeId}
          employeeName={baseData.employee.name}
          team={baseData.employee.team}
          date={selectedDate}
          currentShift={myShiftForDate(selectedDate)}
          headers={headers}
          mySchedule={mySchedule}
          onSubmitted={()=>{ loadRequests(); }}
        />
      }

      {baseData &&
        <SwapRequestModal
          open={showSwap}
          onClose={()=>setShowSwap(false)}
          requesterId={employeeId}
          requesterName={baseData.employee.name}
          team={baseData.employee.team}
          date={selectedDate}
          requesterShift={myShiftForDate(selectedDate)}
          headers={headers}
          mySchedule={mySchedule}
          teamMembers={teamMembers}   // NEW: populated list
          onSubmitted={()=>{ loadRequests(); }}
        />
      }

      {baseData && (
        <ProfileManagement
          open={showProfileModal}
          onClose={()=>setShowProfileModal(false)}
          employeeId={employeeId}
          employeeName={baseData.employee.name}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      {roster && (
        <ShiftView
          open={showShiftView}
          onClose={()=>setShowShiftView(false)}
          roster={roster}
          headers={headers}
        />
      )}

      <NotificationToast 
        notification={notification}
        onClose={() => setNotification(null)}
      />
      
      <div style={{position: 'fixed', bottom: '12px', left: '12px', fontSize: '0.75rem', color: '#9ca3af', zIndex: 1}}>
        Developed by Aether Bangladesh
      </div>
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}