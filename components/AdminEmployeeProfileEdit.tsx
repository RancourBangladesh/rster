"use client";
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, Eye, EyeOff, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProfileData {
  email?: string;
  phone?: string;
  address?: string;
  photo?: string;
  team?: string;
  gender?: string;
}

interface EmployeeInfo {
  id: string;
  name: string;
  currentTeam?: string;
}

interface Props {
  employeeId: string;
  tenantId: string;
}

export default function AdminEmployeeProfileEdit({ employeeId, tenantId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [teams, setTeams] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProfileData & { newPassword: string }>({
    email: '',
    phone: '',
    address: '',
    photo: '',
    team: '',
    gender: '',
    newPassword: ''
  });

  useEffect(() => {
    loadEmployeeData();
  }, [employeeId, tenantId]);

  // Generate a default avatar based on employee name
  function generateDefaultAvatar(name: string): string {
    const initials = name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    const colors = ['#4F46E5', '#7C3AED', '#DB2777', '#EA580C', '#16A34A', '#0891B2', '#2563EB'];
    const hash = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
    const bgColor = colors[hash % colors.length];
    
    const svg = `
      <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="120" fill="${bgColor}"/>
        <text x="50%" y="50%" font-size="48" font-weight="bold" fill="white" 
              text-anchor="middle" dominant-baseline="central">${initials}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  async function loadEmployeeData() {
    setLoading(true);
    setError('');
    try {
      // Fetch employee info and profile
      console.log('[AdminEmployeeProfileEdit] Loading data for:', { employeeId, tenantId });
      const url = `/api/admin/employee-profile/get?employeeId=${encodeURIComponent(employeeId)}&tenantId=${encodeURIComponent(tenantId)}&t=${Date.now()}`;
      console.log('[AdminEmployeeProfileEdit] API URL:', url);
      
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });
      const data = await res.json();

      console.log('[AdminEmployeeProfileEdit] Response:', { success: data.success, error: data.error });

      if (!data.success) {
        setError(data.error || 'Failed to load employee data');
        setLoading(false);
        return;
      }

      setEmployeeInfo(data.employee);
      setTeams(data.teams || []);

      // Populate form with existing data
      setFormData(prev => ({
        ...prev,
        email: data.profile?.email || '',
        phone: data.profile?.phone || '',
        address: data.profile?.address || '',
        photo: data.profile?.photo || '',
        gender: data.profile?.gender || '',
        team: data.employee?.currentTeam || '',
        newPassword: ''
      }));

      if (data.profile?.photo) {
        setPhotoPreview(data.profile.photo);
      }
    } catch (e) {
      console.error('Error loading employee data:', e);
      setError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, photo: base64 }));
      setPhotoPreview(base64);
      setError('');
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    // Validate at least one field is being updated
    const hasChanges = formData.email !== (employeeInfo?.name || '') ||
                      formData.phone ||
                      formData.address ||
                      formData.photo ||
                      formData.team !== employeeInfo?.currentTeam ||
                      formData.newPassword;

    if (!hasChanges) {
      setError('Please update at least one field');
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.email && !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/employee-profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          tenantId,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          photo: formData.photo,
          gender: formData.gender,
          team: formData.team,
          newPassword: formData.newPassword
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Profile updated successfully! ✓');
        // Clear password field
        setFormData(prev => ({
          ...prev,
          newPassword: ''
        }));
        // Redirect after 2 seconds
        setTimeout(() => {
          router.back();
        }, 2000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (e) {
      console.error('Error updating profile:', e);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: '#6b7280', fontSize: '1rem' }}>Loading employee data...</div>
      </div>
    );
  }

  if (!employeeInfo) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ color: '#dc2626', fontSize: '1rem' }}>Employee not found</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: '#374151',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#111827' }}>
            Edit Employee Profile
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
            {employeeInfo.name} (ID: {employeeInfo.id})
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.875rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '1.25rem'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div style={{
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            color: '#16a34a',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.875rem'
          }}>
            {success}
          </div>
        )}

        {/* Photo Upload Section */}
        <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            📸 Profile Photo
          </h3>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '2px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f3f4f6',
              flexShrink: 0
            }}>
              <img 
                src={photoPreview || generateDefaultAvatar(employeeInfo?.name || 'User')} 
                alt={employeeInfo?.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#4f46e5',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                <Upload size={16} /> Choose Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '8px', margin: '8px 0 0 0' }}>
                Max 2MB. Recommended: Square image. {photoPreview ? 'Custom photo' : 'Currently using default avatar'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            📧 Contact Information
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="employee@example.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+(880) 1 234 567890"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Street, City, Country, Postal Code"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                backgroundColor: '#fff',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        {/* Team Assignment Section */}
        <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            👥 Team Assignment
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
              Current Team
            </label>
            <select
              value={formData.team}
              onChange={(e) => setFormData(prev => ({ ...prev, team: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                backgroundColor: '#fff',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select a team...</option>
              {teams.map(team => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
            {employeeInfo.currentTeam && (
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '6px' }}>
                Current team: <strong>{employeeInfo.currentTeam}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Password Change Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            🔐 Change Password
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem' }}>
            Leave blank to keep current password. Admin can set new password without verification.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password (min 6 characters)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  paddingRight: '40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => router.back()}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#e5e7eb',
              color: '#111827',
              border: 'none',
              padding: '11px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              opacity: saving ? 0.7 : 1
            }}
          >
            <X size={16} /> Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              padding: '11px 20px',
              borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              opacity: saving ? 0.7 : 1
            }}
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
