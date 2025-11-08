"use client";
import { useState, useEffect } from 'react';
import Logo from './Logo';
import { Info } from 'lucide-react';
import '../styles/auth-clean.css';

export default function ClientAuthGate({onSuccess}:{onSuccess:(fullName:string,id:string)=>void}) {
  const [employeeId,setEmployeeId]=useState('');
  const [password,setPassword]=useState('');
  const [msg,setMsg]=useState('');
  const [loading,setLoading]=useState(false);
  const [tenantName, setTenantName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load tenant info (name and logo)
    fetch('/api/my-schedule/tenant-info')
      .then(res => res.json())
      .then(data => {
        if (data.tenant) {
          setTenantName(data.tenant.organization_name || data.tenant.name || 'Employee Portal');
          if (data.tenant.logo_url) {
            console.log('[ClientAuthGate] Logo URL loaded, length:', data.tenant.logo_url.length);
            setLogoUrl(data.tenant.logo_url);
          } else {
            console.log('[ClientAuthGate] No logo URL in tenant settings');
          }
        }
      })
      .catch(err => console.error('Failed to load tenant info:', err));
  }, []);

  useEffect(()=>{
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

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-header">
          <div className="brand-icon">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={tenantName}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  objectFit: 'contain',
                  background: '#f5f5f5',
                  padding: '4px'
                }}
                onError={(e) => {
                  console.error('[ClientAuthGate] Logo failed to load, using default');
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Logo size={50} />
            )}
          </div>
          <h1>{tenantName || 'Employee Portal'}</h1>
          <p className="subtitle">Employee Schedule Portal</p>
        </div>
        
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label>Employee ID</label>
            <input 
              value={employeeId} 
              onChange={e=>setEmployeeId(e.target.value)} 
              placeholder="Enter your employee ID"
              disabled={loading}
              autoFocus
            />
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
          <strong>Default password:</strong> Your employee ID
        </div>
      </div>
    </div>
  );
}