"use client";
import { useState, useRef, useEffect } from 'react';
import { X, Upload, Eye, EyeOff } from 'lucide-react';

interface ProfileData {
  email?: string;
  phone?: string;
  address?: string;
  photo?: string; // base64
  gender?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  onProfileUpdated?: () => void;
}

export default function ProfileManagement({ open, onClose, employeeId, employeeName, onProfileUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    email: '',
    phone: '',
    address: '',
    photo: '',
    gender: ''
  });

  const [formData, setFormData] = useState<ProfileData & { newPassword: string; confirmPassword: string }>({
    email: '',
    phone: '',
    address: '',
    photo: '',
    gender: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  async function loadProfile() {
    setLoading(true);
    setError('');
    try {
      // Get employee ID from localStorage
      const savedUser = localStorage.getItem('rosterViewerUser');
      if (!savedUser) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      const user = JSON.parse(savedUser);
      
      const res = await fetch(`/api/my-profile/get?employeeId=${encodeURIComponent(user.employeeId)}&t=${Date.now()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setFormData(prev => ({
          ...prev,
          email: data.profile.email || '',
          phone: data.profile.phone || '',
          address: data.profile.address || '',
          photo: data.profile.photo || '',
          gender: data.profile.gender || ''
        }));
        if (data.profile.photo) {
          setPhotoPreview(data.profile.photo);
        }
      }
    } catch (e) {
      console.error('Error loading profile:', e);
      setError('Failed to load profile');
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
    // Allow save if at least some field is modified
    const hasChanges = formData.email || formData.phone || formData.address || formData.photo || formData.gender || formData.newPassword;
    if (!hasChanges) {
      setError('Please update at least one field');
      return;
    }

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    if (formData.email && !formData.email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Get employee ID from localStorage
      const savedUser = localStorage.getItem('rosterViewerUser');
      if (!savedUser) {
        setError('Not authenticated');
        setSaving(false);
        return;
      }
      const user = JSON.parse(savedUser);
      
      console.log('Sending profile update...', {
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        photo: formData.photo ? 'base64_photo' : '',
        gender: formData.gender,
        newPassword: formData.newPassword ? '***' : '',
        employeeId: user.employeeId
      });

      const res = await fetch('/api/my-profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          photo: formData.photo,
          gender: formData.gender,
          newPassword: formData.newPassword,
          employeeId: user.employeeId
        })
      });

      const data = await res.json();
      console.log('Profile update response:', data);
      console.log('Update successful:', data.success, 'Error:', data.error);
      
      if (data.success) {
        setSuccess('Profile updated successfully ✓');
        setProfile({
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          photo: formData.photo,
          gender: formData.gender
        });
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          newPassword: '',
          confirmPassword: ''
        }));
        // Close modal after 1.5 seconds
        setTimeout(() => {
          // Trigger callback to show notification and refresh dashboard
          if (onProfileUpdated) {
            onProfileUpdated();
          }
          onClose();
        }, 1500);
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

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" style={{ width: '700px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>👤 Profile Management</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#6b7280' }}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Loading profile...
            </div>
          ) : (
            <>
              {error && (
                <div style={{
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '0.875rem'
                }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{
                  background: '#dcfce7',
                  border: '1px solid #bbf7d0',
                  color: '#16a34a',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '0.875rem'
                }}>
                  {success}
                </div>
              )}

              {/* Photo Upload Section */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#111827',
                  display: 'block',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  📸 Profile Photo
                </label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {photoPreview && (
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '2px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f3f4f6'
                    }}>
                      <img src={photoPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        display: 'flex',
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
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '8px' }}>
                      Max 2MB. Will be resized to 40×40px.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  📧 Contact Information
                </h4>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+(880) 1 234 567890"
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Street, City, Country, Postal Code"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: '#fff',
                      color: '#111827',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Password Change */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  🔐 Change Password (Optional)
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '12px' }}>
                  Leave blank to keep current password
                </p>

                <div className="form-group">
                  <label>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <button
                      onClick={() => setShowPasswords(!showPasswords)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                    >
                      {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="actions-row" style={{ marginTop: '24px' }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
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
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button
                  onClick={onClose}
                  disabled={saving}
                  style={{
                    background: '#e5e7eb',
                    color: '#111827',
                    border: 'none',
                    padding: '11px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
