"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { User, Lock } from 'lucide-react';
import { detectTenantFromWindow } from '@/lib/subdomain';
import '../../../styles/auth-clean.css';

export default function AdminLoginPage() {
  const [u,setU]=useState('');
  const [p,setP]=useState('');
  const [msg,setMsg]=useState('');
  const [loading,setLoading]=useState(false);
  const [tenantInfo, setTenantInfo] = useState<{name: string; organizationName: string} | null>(null);
  const formRef = useRef<HTMLFormElement|null>(null);

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
  },[]);

  async function submit(e:React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true); 
    setMsg('');
    const res = await fetch('/api/admin/login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:u.trim(),password:p})
    });
    const j = await res.json();
    setLoading(false);
    if (j.success) {
      window.location.href='/admin/dashboard';
    } else {
      setMsg(j.error || 'Invalid credentials');
      // trigger a shake animation
      if (formRef.current) {
        formRef.current.classList.remove('shake');
        // force reflow
        void formRef.current.offsetWidth;
        formRef.current.classList.add('shake');
      }
    }
  }

  // Allow Enter on both inputs
  useEffect(()=>{
    const handler = (e:KeyboardEvent)=>{
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        formRef.current?.dispatchEvent(new Event('submit', {cancelable:true,bubbles:true}));
      }
    };
    window.addEventListener('keydown', handler);
    return ()=> window.removeEventListener('keydown', handler);
  },[]);

  const brandName = tenantInfo?.organizationName || 'RosterBhai';

  return (
    <div className="admin-auth-shell">
      <div className="admin-auth-wrapper">
        <div className="admin-auth-header">
          <div className="brand-icon"><Logo size={50} /></div>
          <div className="brand-text">
            <h1>{brandName} <span>Admin</span></h1>
            <p className="tagline">Team Lead & Administrator Access</p>
          </div>
        </div>

        <form ref={formRef} onSubmit={submit} className="admin-auth-form">
          <div className="form-field">
            <label htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              autoComplete="username"
              placeholder="Enter your username"
              value={u}
              onChange={e=>setU(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={p}
              onChange={e=>setP(e.target.value)}
              required
            />
          </div>

          {msg && (
            <div className="auth-message error">
              {msg}
            </div>
          )}

          <button
            type="submit"
            className="admin-auth-btn"
            disabled={loading || !u || !p}
          >
            {loading ? 'Signing In...' : 'Sign In to Admin Panel'}
          </button>
        </form>

        <div className="admin-auth-footer">
          <Link href="/employee" className="admin-auth-link">
            ← Back to Employee Portal
          </Link>
        </div>
      </div>
    </div>
  );
}