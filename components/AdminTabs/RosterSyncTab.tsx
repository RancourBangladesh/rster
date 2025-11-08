"use client";
import { useState, useEffect, useCallback } from 'react';
import { Calendar, Edit, RotateCcw, Save } from 'lucide-react';
import RosterTemplateModal from '../Shared/RosterTemplateModal';

interface Props { id: string; }

export default function RosterSyncTab({id}: Props) {
  // Data Sync states
  const [googleStatus, setGoogleStatus] = useState('Not loaded');
  const [adminStatus, setAdminStatus] = useState('Not loaded');
  const [stats, setStats] = useState({employees: 0, teams: 0, dates: 0, modified: 0});
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [syncMessage, setSyncMessage] = useState<{text: string, type: 'success' | 'error'}>({text: '', type: 'success'});

  // Google Links states
  const [monthYear, setMonthYear] = useState('');
  const [link, setLink] = useState('');
  const [links, setLinks] = useState<Record<string, string>>({});
  const [linksLoading, setLinksLoading] = useState(false);

  // Reset states
  const [resetting, setResetting] = useState(false);
  const [hardResetting, setHardResetting] = useState(false);

  // Roster Template states
  const [showRosterTemplate, setShowRosterTemplate] = useState(false);
  const [templateData, setTemplateData] = useState<any>(null);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  
  // Template Sync states
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [syncingTemplates, setSyncingTemplates] = useState(false);

  const load = useCallback(async function() {
    setLoading(true);
    try {
      const disp = await fetch('/api/admin/get-display-data').then(r => r.json());
      const gRes = await fetch('/api/admin/get-google-data');
      const aRes = await fetch('/api/admin/get-admin-data');
      const settingsRes = await fetch('/api/admin/get-settings');
      const g = gRes.ok ? await gRes.json() : null;
      const a = aRes.ok ? await aRes.json() : null;
      const settings = settingsRes.ok ? await settingsRes.json() : {autoSyncEnabled: false};
      setStats({
        employees: disp.allEmployees?.length || 0,
        teams: Object.keys(disp.teams || {}).length,
        dates: disp.headers?.length || 0,
        modified: await calcModified(g, a)
      });
      setGoogleStatus(g?.allEmployees?.length ? `${g.allEmployees.length} employees loaded` : 'Not loaded');
      setAdminStatus(a?.allEmployees?.length ? `${a.allEmployees.length} employees` : 'Not available');
      setAutoSyncEnabled(settings.autoSyncEnabled || false);
      setAllEmployees(disp.allEmployees || []);
    } catch (e: any) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  async function calcModified(g: any, a: any) {
    if (!g || !a) return 0;
    let count = 0;
    for (const team of Object.keys(a.teams || {})) {
      if (!g.teams[team]) continue;
      for (const adm of a.teams[team]) {
        const goog = g.teams[team].find((e: any) => e.id === adm.id);
        if (goog) {
          for (let i = 0; i < adm.schedule.length; i++) {
            if (adm.schedule[i] !== goog.schedule[i] && adm.schedule[i] !== '') count++;
          }
        }
      }
    }
    return count;
  }

  const syncSheets = useCallback(async function() {
    setSyncing(true);
    setSyncMessage({text: '', type: 'success'});
    const res = await fetch('/api/admin/sync-google-sheets', {method: 'POST'}).then(r => r.json());
    setSyncing(false);
    setLastSyncTime(new Date().toLocaleTimeString());
    setSyncMessage({
      text: res.success ? res.message : res.error,
      type: res.success ? 'success' : 'error'
    });
    load();
  }, [load]);

  async function toggleAutoSync() {
    const newValue = !autoSyncEnabled;
    try {
      await fetch('/api/admin/set-auto-sync', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({enabled: newValue})
      });
      setAutoSyncEnabled(newValue);
      setSyncMessage({
        text: newValue ? 'Auto-sync enabled successfully' : 'Auto-sync disabled',
        type: 'success'
      });
    } catch (e) {
      console.error('Failed to toggle auto-sync:', e);
      setSyncMessage({
        text: 'Failed to update auto-sync setting',
        type: 'error'
      });
    }
  }

  async function loadLinks() {
    setLinksLoading(true);
    const res = await fetch('/api/admin/get-google-links');
    if (res.ok) setLinks(await res.json());
    setLinksLoading(false);
  }

  async function saveLink() {
    if (!monthYear || !link) {
      alert('Month Year & link required');
      return;
    }
    const res = await fetch('/api/admin/save-google-link', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({monthYear, googleLink: link})
    }).then(r => r.json());
    if (!res.success) alert(res.error);
    else {
      setMonthYear('');
      setLink('');
      loadLinks();
    }
  }

  async function removeLink(m: string) {
    if (!confirm(`Delete link for ${m}?`)) return;
    const res = await fetch('/api/admin/delete-google-link', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({monthYear: m})
    }).then(r => r.json());
    if (!res.success) alert(res.error);
    else loadLinks();
  }

  async function resetToGoogleOrCSV() {
    if (!confirm('Reset admin data to Google spreadsheet or CSV data? This will remove all manual overrides.')) return;
    setResetting(true);
    const res = await fetch('/api/admin/reset-to-google', {method: 'POST'}).then(r => r.json());
    setResetting(false);
    if (!res.success) {
      alert(res.error || 'Reset failed');
    } else {
      alert('Admin data reset successfully!');
      load();
    }
  }

  async function hardReset() {
    // First confirmation
    const confirm1 = window.confirm(
      '🔥 DANGER ZONE - PERMANENT DATA DELETION\n\n' +
      '⚠️ This will PERMANENTLY DELETE:\n' +
      '✗ ALL employees and roster data\n' +
      '✗ ALL schedule data (original & modified)\n' +
      '✗ ALL shift modifications\n' +
      '✗ ALL shift change/swap requests\n' +
      '✗ ALL notifications and history\n' +
      '✗ Google Sheets sync links\n' +
      '✗ All settings and templates\n\n' +
      'This action CANNOT BE UNDONE.\n\n' +
      'Click OK to proceed to final confirmation.'
    );
    
    if (!confirm1) {
      return;
    }
    
    // Second confirmation with warning text
    const confirm2 = window.confirm(
      '⚠️ FINAL WARNING ⚠️\n\n' +
      'Are you ABSOLUTELY CERTAIN you want to permanently delete ALL data?\n\n' +
      'You will need to:\n' +
      '1. Re-import employees from Google Sheets or CSV\n' +
      '2. Recreate all shift assignments\n' +
      '3. Reconfigure all settings\n\n' +
      'Type: I understand the consequences\n\n' +
      'Click OK only if you are 100% sure.'
    );
    
    if (!confirm2) {
      return;
    }

    setHardResetting(true);
    setSyncMessage({text: 'Hard resetting all data... Please wait...', type: 'success'});
    
    try {
      console.log('[Hard Reset] Sending hard-reset request...');
      const res = await fetch('/api/admin/hard-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await res.json();
      console.log('[Hard Reset] Response:', result);
      
      if (result.success) {
        setSyncMessage({
          text: '✓ Hard reset successful! All data deleted. Reloading admin panel in 3 seconds...', 
          type: 'success'
        });
        
        // Wait 3 seconds then do a hard refresh of the entire page
        setTimeout(() => {
          console.log('[Hard Reset] Doing hard refresh of page...');
          // Hard reload to bypass cache
          window.location.reload();
        }, 3000);
      } else {
        setSyncMessage({
          text: `✗ Reset failed: ${result.error || 'Unknown error'}`, 
          type: 'error'
        });
        console.error('[Hard Reset] Error:', result.error);
        setHardResetting(false);
        alert(`Hard Reset Failed:\n\n${result.error || 'Unknown error occurred'}`);
      }
    } catch (error: any) {
      console.error('[Hard Reset] Exception:', error);
      setSyncMessage({
        text: `✗ Reset failed: ${error.message || 'Network error'}`, 
        type: 'error'
      });
      setHardResetting(false);
      alert(`Hard Reset Failed:\n\n${error.message || 'Network error occurred'}`);
    }
  }

  async function handleSaveRosterTemplate(schedule: Record<string, string[]>) {
    // The actual save is now handled in RosterTemplateModal itself
    // This is just a placeholder for parent notification
    return Promise.resolve();
  }

  async function loadTemplates() {
    try {
      const res = await fetch('/api/admin/list-roster-templates');
      if (res.ok) {
        const data = await res.json();
        setAvailableTemplates(data.templates || []);
      }
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
  }

  async function syncSelectedTemplates() {
    if (selectedTemplates.length === 0) {
      alert('Please select at least one template to sync');
      return;
    }

    if (!confirm(`Sync ${selectedTemplates.length} template(s)? This will update the roster data with template schedules.`)) {
      return;
    }

    setSyncingTemplates(true);
    try {
      const res = await fetch('/api/admin/sync-roster-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateFiles: selectedTemplates })
      });

      const result = await res.json();
      if (result.success) {
        alert(result.message);
        setSelectedTemplates([]);
        setShowTemplateSelector(false);
        load(); // Reload data
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (e) {
      console.error('Failed to sync templates:', e);
      alert('Failed to sync templates');
    }
    setSyncingTemplates(false);
  }

  function toggleTemplateSelection(fileName: string) {
    setSelectedTemplates(prev =>
      prev.includes(fileName) ? prev.filter(f => f !== fileName) : [...prev, fileName]
    );
  }

  async function handleEditTemplate(fileName: string) {
    try {
      const res = await fetch(`/api/admin/get-roster-template?fileName=${encodeURIComponent(fileName)}`);
      if (res.ok) {
        const data = await res.json();
        setEditingTemplate(data);
        setShowRosterTemplate(true);
      } else {
        alert('Failed to load template for editing');
      }
    } catch (e) {
      console.error('Failed to load template:', e);
      alert('Failed to load template for editing');
    }
  }

  async function handleDeleteTemplate(fileName: string, monthYear: string) {
    if (!confirm(`Delete template "${monthYear}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/delete-roster-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName })
      });

      const result = await res.json();
      if (result.success) {
        alert(result.message);
        loadTemplates(); // Reload template list
        // Remove from selected templates if it was selected
        setSelectedTemplates(prev => prev.filter(f => f !== fileName));
      } else {
        alert(`Delete failed: ${result.error}`);
      }
    } catch (e) {
      console.error('Failed to delete template:', e);
      alert('Failed to delete template');
    }
  }

  function handleCloseTemplateModal() {
    setShowRosterTemplate(false);
    setEditingTemplate(null);
    loadTemplates(); // Reload templates when closing modal
  }

  useEffect(() => {
    load();
    loadLinks();
    loadTemplates();
  }, [load]);

  // Auto-sync every 5 minutes if enabled
  useEffect(() => {
    if (!autoSyncEnabled) return;

    const interval = setInterval(() => {
      syncSheets();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoSyncEnabled, syncSheets]);

  // Auto-refresh links every 5 seconds (silently, without showing loading state)
  useEffect(() => {
    let lastLinks = JSON.stringify(links);
    const interval = setInterval(async () => {
      const res = await fetch('/api/admin/get-google-links');
      if (res.ok) {
        const newLinks = await res.json();
        const newLinksStr = JSON.stringify(newLinks);
        // Only update state if links actually changed (prevents UI flicker)
        if (newLinksStr !== lastLinks) {
          setLinks(newLinks);
          lastLinks = newLinksStr;
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [links]);

  return (
    <div id={id} className="tab-pane">
      <h2>Roster Sync Management</h2>
      <p>Sync data from Google Sheets, manage links, and reset roster data.</p>

      {/* Data Sync Section */}
      <div style={{marginBottom: '40px'}}>
        <h3 style={{fontSize: '1.3rem', marginBottom: '15px', color: 'var(--primary)'}}>Data Synchronization</h3>
        <div className="actions-row">
          <button onClick={syncSheets} disabled={syncing} className="btn primary">
            {syncing ? 'Syncing...' : 'Sync Google Sheets Now'}
          </button>
          <button
            onClick={toggleAutoSync}
            disabled={syncing}
            className={`btn ${autoSyncEnabled ? 'success' : 'secondary'}`}
          >
            {autoSyncEnabled ? 'Auto-Sync Enabled (5 min)' : 'Enable Auto-Sync (5 min)'}
          </button>
          <button
            onClick={() => { setEditingTemplate(null); setShowRosterTemplate(true); }}
            className="btn"
            style={{backgroundColor: '#9C27B0', color: 'white'}}
          >
            Roster Template
          </button>
          <button
            onClick={() => { loadTemplates(); setShowTemplateSelector(!showTemplateSelector); }}
            className="btn"
            style={{backgroundColor: '#673AB7', color: 'white'}}
          >
            Sync From Templates
          </button>
        </div>
        {syncMessage.text && (
          <div style={{
            marginTop: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            background: syncMessage.type === 'success' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)',
            border: `2px solid ${syncMessage.type === 'success' ? '#4CAF50' : '#F44336'}`,
            color: syncMessage.type === 'success' ? '#6FD99F' : '#FF8A80',
            fontWeight: 500
          }}>
            {syncMessage.type === 'success' ? '✓' : '✗'} {syncMessage.text}
          </div>
        )}
        
        {/* Template Selector */}
        {showTemplateSelector && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: 'var(--panel)',
            border: '2px solid #673AB7',
            borderRadius: '10px'
          }}>
            <h4 style={{marginTop: 0, marginBottom: '12px', color: '#9575CD'}}>📁 Select Templates to Sync</h4>
            {availableTemplates.length === 0 ? (
              <p style={{color: 'var(--text-dim)', fontStyle: 'italic'}}>
                No saved templates found. Create a template using the &quot;Roster Template&quot; button above.
              </p>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  {availableTemplates.map(template => (
                    <div
                      key={template.fileName}
                      onClick={() => toggleTemplateSelection(template.fileName)}
                      style={{
                        position: 'relative',
                        padding: '16px',
                        background: selectedTemplates.includes(template.fileName) 
                          ? 'linear-gradient(135deg, rgba(103, 58, 183, 0.3), rgba(149, 117, 205, 0.2))' 
                          : 'var(--bg)',
                        border: `2px solid ${selectedTemplates.includes(template.fileName) ? '#9575CD' : 'var(--border)'}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: selectedTemplates.includes(template.fileName) 
                          ? '0 4px 12px rgba(103, 58, 183, 0.3)' 
                          : '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {selectedTemplates.includes(template.fileName) && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#9575CD',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          ✓
                        </div>
                      )}
                      <div style={{
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        color: 'var(--text)',
                        marginBottom: '8px'
                      }}>
                        <Calendar size={16} style={{display:'inline', marginRight:6}} />
                        {template.monthYear}
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-dim)',
                        marginBottom: '12px'
                      }}>
                        Modified: {new Date(template.modifiedAt).toLocaleDateString()}
                        <br />
                        Size: {(template.size / 1024).toFixed(1)} KB
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '8px'
                      }}>
                        <button
                          className="btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTemplate(template.fileName);
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            fontSize: '0.85rem',
                            background: '#2196F3',
                            color: 'white'
                          }}
                        >
                          <Edit size={14} style={{display:'inline', marginRight:4}} />
                          Edit
                        </button>
                        <button
                          className="btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.fileName, template.monthYear);
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            fontSize: '0.85rem',
                            background: '#f44336',
                            color: 'white'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center'}}>
                  <div style={{flex: 1, color: 'var(--text-dim)', fontSize: '0.9rem'}}>
                    {selectedTemplates.length > 0 && `${selectedTemplates.length} template(s) selected`}
                  </div>
                  <button
                    className="btn"
                    onClick={() => setShowTemplateSelector(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn primary"
                    onClick={syncSelectedTemplates}
                    disabled={selectedTemplates.length === 0 || syncingTemplates}
                    style={{
                      backgroundColor: selectedTemplates.length === 0 ? '#555' : '#673AB7',
                      opacity: selectedTemplates.length === 0 ? 0.5 : 1
                    }}
                  >
                    {syncingTemplates ? 'Syncing...' : `Sync ${selectedTemplates.length} Template(s)`}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {lastSyncTime && (
          <div style={{marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-dim)'}}>
            Last sync: {lastSyncTime}
          </div>
        )}
        {autoSyncEnabled && (
          <div style={{marginTop: '5px', fontSize: '0.85rem', color: 'var(--success)'}}>
            Auto-sync is active - syncing every 5 minutes
          </div>
        )}
        <div className="status-grid">
          <div className="status-card">
            <h4>Google Data</h4>
            <p>{googleStatus}</p>
          </div>
          <div className="status-card">
            <h4>Admin Data</h4>
            <p>{adminStatus}</p>
          </div>
          <div className="status-card">
            <h4>Employees</h4>
            <p>{stats.employees}</p>
          </div>
          <div className="status-card">
            <h4>Teams</h4>
            <p>{stats.teams}</p>
          </div>
          <div className="status-card">
            <h4>Date Columns</h4>
            <p>{stats.dates}</p>
          </div>
          <div className="status-card">
            <h4>Modified Shifts</h4>
            <p>{stats.modified}</p>
          </div>
        </div>
        {loading && <div className="inline-loading">Loading stats...</div>}
      </div>

      {/* Google Sheets Links Section */}
      <div style={{marginBottom: '40px'}}>
        <h3 style={{fontSize: '1.3rem', marginBottom: '15px', color: 'var(--primary)'}}>🔗 Google Sheets Links</h3>
        <p style={{marginBottom: '15px'}}>Add or manage published CSV links for roster sources.</p>
        <div className="form-grid two">
          <div>
            <label>Month (YYYY-MM)</label>
            <input value={monthYear} onChange={e => setMonthYear(e.target.value)} placeholder="2025-10"/>
          </div>
          <div>
            <label>CSV Publish Link</label>
            <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://docs.google.com/.../pub?output=csv"/>
          </div>
        </div>
        <div className="actions-row">
          <button className="btn primary" onClick={saveLink}><Save size={16} style={{display:'inline', marginRight:'6px'}} /> Save Link</button>
          <button className="btn" onClick={loadLinks}>Refresh</button>
        </div>
        <table className="data-table small">
          <thead>
            <tr>
              <th>Month</th>
              <th>Link</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(links).length === 0 && <tr><td colSpan={3}>No links added yet</td></tr>}
            {Object.entries(links).map(([m, l]) => (
              <tr key={m}>
                <td>{m}</td>
                <td className="truncate"><a href={l} target="_blank" rel="noreferrer">Open</a></td>
                <td><button className="btn danger tiny" onClick={() => removeLink(m)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="note-box">
          Publish Google Sheets to CSV via File → Share → Publish to web → select sheet → CSV.
        </div>
      </div>

      {/* Hard Reset Danger Zone Section - At Bottom */}
      <div style={{
        marginTop: '40px',
        marginBottom: '40px',
        padding: '20px',
        backgroundColor: '#FEE2E2',
        border: '3px solid #DC2626',
        borderRadius: '10px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '16px',
          fontSize: '24px'
        }}>
          🔥
        </div>
        <h3 style={{
          marginTop: 0,
          marginLeft: '40px',
          color: '#991B1B',
          fontSize: '1.3rem',
          fontWeight: 'bold'
        }}>
          DANGER ZONE - Hard Reset All Data
        </h3>
        
        <div style={{
          backgroundColor: '#FEF2F2',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px',
          color: '#7F1D1D',
          lineHeight: '1.6'
        }}>
          <p style={{marginTop: 0, marginBottom: '12px', fontWeight: 600}}>
            ⚠️ WARNING: This action is IRREVERSIBLE and will permanently delete:
          </p>
          <ul style={{marginTop: '8px', marginBottom: '8px', paddingLeft: '20px'}}>
            <li>All employee records and roster data</li>
            <li>All schedule data (original and modified)</li>
            <li>All shift modifications and approvals</li>
            <li>All shift requests and change history</li>
            <li>All Google Sheets sync links</li>
            <li>All notifications and activity logs</li>
            <li>All roster templates</li>
            <li>All admin settings</li>
          </ul>
          <p style={{marginTop: '12px', marginBottom: 0, fontSize: '0.95rem'}}>
            After hard reset, you will need to re-import all data from scratch.
          </p>
        </div>
        
        <button
          onClick={hardReset}
          disabled={hardResetting}
          className="btn"
          style={{
            width: '100%',
            padding: '14px 20px',
            backgroundColor: '#DC2626',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1rem',
            border: '2px solid #991B1B',
            borderRadius: '8px',
            cursor: hardResetting ? 'not-allowed' : 'pointer',
            opacity: hardResetting ? 0.7 : 1,
            transition: 'all 0.2s ease',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => !hardResetting && (e.currentTarget.style.backgroundColor = '#991B1B')}
          onMouseLeave={(e) => !hardResetting && (e.currentTarget.style.backgroundColor = '#DC2626')}
          title="Permanently delete all data and reset system to brand new state"
        >
          {hardResetting ? '⏳ Hard Resetting All Data... Please Wait...' : '🗑️ HARD RESET ALL DATA - PERMANENT DELETE'}
        </button>
      </div>

      {/* Roster Template Modal */}
      <RosterTemplateModal
        open={showRosterTemplate}
        onClose={handleCloseTemplateModal}
        employees={allEmployees}
        onSave={handleSaveRosterTemplate}
        existingTemplate={editingTemplate}
      />
    </div>
  );
}
