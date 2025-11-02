"use client";
import { useState, useEffect } from 'react';
import Logo from './Logo';
import { Info } from 'lucide-react';
import { detectTenantFromWindow } from '@/lib/subdomain';
import '../styles/auth-clean.css';

export default function ClientAuthGate({onSuccess}:{onSuccess:(fullName:string,id:string)=>void}) {
  const [employeeId,setEmployeeId]=useState('');
  const [password,setPassword]=useState('');
  const [msg,setMsg]=useState('');
  const [loading,setLoading]=useState(false);
  const [tenantInfo, setTenantInfo] = useState<{name: string; organizationName: string} | null>(null);

  useEffect(()=>{
    // Check if accessed via subdomain to get tenant info
    const subdomain = detectTenantFromWindow();
    
    if (subdomain) {
      // Fetch tenant info for branding
      fetch('/api/tenant/info-by-slug', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({slug: subdomain})
      })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.tenant) {
          setTenantInfo({
            name: data.tenant.name,
            organizationName: data.tenant.organization_name || data.tenant.name
          });
        }
      })
      .catch(err => {
        console.error('Failed to fetch tenant info:', err);
      });
    }

    const savedUser = localStorage.getItem('rosterViewerUser');
    const savedAuth = localStorage.getItem('rosterViewerAuth');
    if (savedUser && savedAuth) {
      const u = JSON.parse(savedUser);
      // Verify session is still valid
      fetch('/api/my-schedule/verify', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({employeeId: u.employeeId})
      }).then(res => res.json()).then(data => {
        if (data.success && data.employee) {
          onSuccess(data.employee.name, u.employeeId);
        } else {
          localStorage.removeItem('rosterViewerUser');
          localStorage.removeItem('rosterViewerAuth');
        }
      }).catch(() => {
        localStorage.removeItem('rosterViewerUser');
        localStorage.removeItem('rosterViewerAuth');
      });
    }
  },[onSuccess]);

  async function submit(e:React.FormEvent) {
    e.preventDefault();
    if (!employeeId || !password) {
      setMsg('Please enter both Employee ID and Password'); 
      return;
    }
    
    setLoading(true);
    setMsg('');

    try {
      const res = await fetch('/api/my-schedule/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          password: password
        })
      });

      const data = await res.json();
      
      if (data.success && data.employee) {
        const user = {
          fullName: data.employee.name, 
          employeeId: data.employee.id, 
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('rosterViewerUser', JSON.stringify(user));
        localStorage.setItem('rosterViewerAuth','true');
        setMsg('Access granted! Loading...');
        setTimeout(()=> onSuccess(user.fullName, user.employeeId), 600);
      } else {
        setMsg(data.error || 'Invalid credentials');
        setLoading(false);
      }
    } catch (err) {
      setMsg('Login failed. Please try again.');
      setLoading(false);
    }
  }

  const brandName = tenantInfo?.organizationName || 'RosterBhai';
  const portalName = tenantInfo ? `${brandName} Employee Portal` : 'Employee Schedule Portal';

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-header">
          <div className="brand-icon">
            <Logo size={50} />
          </div>
          <h1>{brandName}</h1>
          <p className="subtitle">{portalName}</p>
        </div>
        
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label>Employee ID</label>
            <input 
              value={employeeId} 
              onChange={e=>setEmployeeId(e.target.value)} 
              placeholder={tenantInfo ? "Enter your employee ID" : "tenant@employeeID or just employeeID"}
              disabled={loading}
              autoFocus
            />
            {!tenantInfo && (
              <small style={{color: '#666', fontSize: '13px', marginTop: '4px', display: 'block'}}>
                Format: <code style={{background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px'}}>tenant@121</code> or just <code style={{background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px'}}>121</code>
              </small>
            )}
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>
          
          {msg && <div className={`auth-message ${msg.includes('Access')?'success':'error'}`}>{msg}</div>}
          
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Access Schedule'}
          </button>
        </form>
        
        <div className="auth-info-box">
          <Info size={16} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem'}} />
          <strong>Default password:</strong> Your employee ID{!tenantInfo && '. For multi-tenant systems, use format: tenant@employeeID'}
        </div>
      </div>
    </div>
  );
}