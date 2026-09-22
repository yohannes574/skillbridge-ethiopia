import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { apiGetUsers, apiApproveUser, apiRejectUser, apiToggleBlock, apiDeleteUser } from '../../api';
import toast from 'react-hot-toast';
import {
  Shield, Ban, Trash2, Check, Search, Eye, X, Download,
  User, Briefcase, MapPin, FileText, Award, AlertTriangle, ChevronDown
} from 'lucide-react';

// ─── Status Badge ─────────────────────────────────────────────────
const SubBadge = ({ status }) => {
  const map = {
    not_submitted: { bg: '#f1f5f9', color: '#64748b', label: 'Not Submitted' },
    submitted: { bg: '#fef3c7', color: '#92400e', label: 'Submitted ⏳' },
    approved: { bg: '#e8f5e9', color: '#2d6a4f', label: 'Approved ✓' },
    rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected ✗' },
  };
  const s = map[status] || map.not_submitted;
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>;
};

// ─── Info Row ─────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => value ? (
  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
    <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', minWidth: 140, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
    <span style={{ fontSize: 13, color: '#1a2e24', flex: 1, lineHeight: 1.5 }}>{value}</span>
  </div>
) : null;

// ─── Document Button ──────────────────────────────────────────────
const DocButton = ({ file, label }) => {
  if (!file?.data) return null;
  return (
    <a
      href={file.data}
      download={file.name || 'document'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
        background: '#1a2e24', color: '#fff', textDecoration: 'none',
        transition: 'all 0.2s',
      }}
    >
      <Download size={14} /> {label || file.name}
    </a>
  );
};

// ─── Application Modal ────────────────────────────────────────────
const ApplicationModal = ({ user: u, onClose, onApprove, onReject }) => {
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(null);
  const sub = u?.profileSubmission || {};

  const handleApprove = async () => {
    setLoading('approve');
    await onApprove(u._id);
    setLoading(null);
    onClose();
  };

  const handleReject = async () => {
    if (!reason.trim()) return toast.error('Please provide a rejection reason');
    setLoading('reject');
    await onReject(u._id, reason);
    setLoading(null);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(4px)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 640,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
      }} onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          background: u.role === 'mentor' ? 'linear-gradient(135deg, #1565c0, #1976d2)' : 'linear-gradient(135deg, #6a1b9a, #7b1fa2)',
          borderRadius: '20px 20px 0 0', padding: '24px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 16 }}>
                {u.name?.[0]}
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{u.name}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{u.email}</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: '#fff', textTransform: 'capitalize' }}>
              {u.role}
            </span>
            <SubBadge status={u.submissionStatus} />
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px' }}>
          {!sub || Object.keys(sub).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: 14 }}>No profile submission yet.</p>
            </div>
          ) : u.role === 'mentor' ? (
            /* ── MENTOR DETAILS ── */
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Professional Information</h3>
              <InfoRow label="Full Name" value={sub.fullName} />
              <InfoRow label="Current Role" value={sub.currentRole} />
              <InfoRow label="Experience" value={sub.yearsOfExperience} />
              <InfoRow label="Background" value={sub.professionalBackground} />

              {sub.skills?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Skills to Teach</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {sub.skills.map(s => (
                      <span key={s} style={{ padding: '4px 12px', borderRadius: 50, background: '#e3f2fd', color: '#1565c0', fontSize: 12, fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>CV / Resume</p>
                {sub.cvFile ? <DocButton file={sub.cvFile} label="Download CV" /> : <p style={{ fontSize: 13, color: '#9ca3af' }}>Not uploaded</p>}
              </div>

              <InfoRow label="Agreement" value={sub.agreedToTerms ? '✓ Signed' : '✗ Not signed'} />
              {sub.submittedAt && <InfoRow label="Submitted" value={new Date(sub.submittedAt).toLocaleString()} />}
            </>
          ) : (
            /* ── EMPLOYER DETAILS ── */
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Company Information</h3>
              <InfoRow label="Company Name" value={sub.companyName} />
              <InfoRow label="Industry" value={sub.industry} />
              <InfoRow label="Company Size" value={sub.companySize} />
              <InfoRow label="Website" value={sub.website} />
              <InfoRow label="Description" value={sub.companyDescription} />

              <div style={{ borderTop: '1px solid #eef1f4', marginTop: 16, paddingTop: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Location</h3>
                <InfoRow label="Address" value={sub.location?.address} />
                <InfoRow label="City" value={sub.location?.city} />
                <InfoRow label="Country" value={sub.location?.country} />
              </div>

              <div style={{ borderTop: '1px solid #eef1f4', marginTop: 16, paddingTop: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Verification Documents</h3>
                {sub.businessRegFile ? <DocButton file={sub.businessRegFile} label="Download Business Registration" /> : null}
                <InfoRow label="Tax ID / TIN" value={sub.taxId} />
                {!sub.businessRegFile && !sub.taxId && <p style={{ fontSize: 13, color: '#9ca3af' }}>No verification documents uploaded</p>}
              </div>

              <InfoRow label="Agreement" value={sub.agreedToTerms ? '✓ Signed' : '✗ Not signed'} />
              {sub.submittedAt && <InfoRow label="Submitted" value={new Date(sub.submittedAt).toLocaleString()} />}
            </>
          )}

          {/* Rejection reason input */}
          {rejectMode && (
            <div style={{ marginTop: 20, padding: 16, background: '#fff5f5', borderRadius: 12, border: '1px solid #fecaca' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>Rejection Reason *</label>
              <textarea
                style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #fecaca', fontSize: 13, resize: 'vertical', minHeight: 80, fontFamily: "'Inter', sans-serif", outline: 'none' }}
                placeholder="Provide feedback that will help the applicant improve their submission..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Modal Footer - Actions */}
        {(u.submissionStatus === 'submitted' || u.submissionStatus === 'not_submitted') && (
          <div style={{ padding: '0 28px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #eef1f4', paddingTop: 20 }}>
            {!rejectMode ? (
              <>
                <button
                  onClick={() => setRejectMode(true)}
                  style={{ padding: '10px 20px', borderRadius: 50, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                >
                  <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={loading === 'approve'}
                  style={{ padding: '10px 24px', borderRadius: 50, background: 'linear-gradient(135deg, #2d6a4f, #1a4731)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {loading === 'approve' ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><Check size={15} /> Approve</>}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setRejectMode(false)} style={{ padding: '10px 20px', borderRadius: 50, border: '1px solid #eef1f4', background: '#fafbfc', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading === 'reject'}
                  style={{ padding: '10px 24px', borderRadius: 50, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {loading === 'reject' ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><X size={15} /> Confirm Rejection</>}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main AdminUsers Page ─────────────────────────────────────────
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actioning, setActioning] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'block'|'delete', user: obj }

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await apiGetUsers();
      setUsers(res.data.data || []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    setActioning(id);
    try { await apiApproveUser(id); toast.success('User approved! ✓'); await load(); }
    catch { toast.error('Failed to approve'); }
    finally { setActioning(null); }
  };

  const handleReject = async (id, reason) => {
    setActioning(id);
    try { await apiRejectUser(id, reason); toast.success('Application rejected'); await load(); }
    catch { toast.error('Failed to reject'); }
    finally { setActioning(null); }
  };

  const handleToggleBlock = async (id) => {
    setActioning(id);
    try { await apiToggleBlock(id); toast.success('User updated'); await load(); }
    catch { toast.error('Failed'); }
    finally { setActioning(null); setConfirmAction(null); }
  };

  const handleDelete = async (id) => {
    try { await apiDeleteUser(id); toast.success('User deleted'); await load(); }
    catch { toast.error('Failed'); }
    finally { setConfirmAction(null); }
  };

  const filtered = users.filter(u => {
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all' || u.submissionStatus === filterStatus;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchStatus && matchSearch;
  });

  const pendingCount = users.filter(u => u.submissionStatus === 'submitted').length;

  if (loading) return <DashboardLayout><div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title="User Management"
        subtitle={`${users.length} total users${pendingCount > 0 ? ` · ${pendingCount} pending review` : ''}`}
      />

      {/* Pending Review Alert */}
      {pendingCount > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', borderRadius: 14, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>⏳</span>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
            {pendingCount} application{pendingCount !== 1 ? 's' : ''} waiting for review
          </p>
          <button onClick={() => setFilterStatus('submitted')} style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: 50, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            View Pending
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 50, border: '1px solid #eef1f4', fontSize: 13, background: '#fafbfc', fontFamily: "'Inter', sans-serif", outline: 'none' }}
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          style={{ padding: '10px 16px', borderRadius: 50, border: '1px solid #eef1f4', fontSize: 13, background: '#fafbfc', fontFamily: "'Inter', sans-serif", outline: 'none', cursor: 'pointer' }}
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="mentor">Mentors</option>
          <option value="employer">Employers</option>
        </select>
        <select
          style={{ padding: '10px 16px', borderRadius: 50, border: '1px solid #eef1f4', fontSize: 13, background: '#fafbfc', fontFamily: "'Inter', sans-serif", outline: 'none', cursor: 'pointer' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="not_submitted">Not Submitted</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef1f4', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8faf9' }}>
              {['User', 'Role', 'Account Status', 'Application', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.7px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u._id} style={{ borderTop: '1px solid #eef1f4', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8faf9'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2d6a4f, #40916c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0 }}>
                      {u.name?.[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1a2e24' }}>{u.name}</p>
                      <p style={{ fontSize: 12, color: '#9ca3af' }}>{u.email}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize',
                    background: u.role === 'admin' ? '#fee2e2' : u.role === 'mentor' ? '#e3f2fd' : u.role === 'employer' ? '#f3e5f5' : '#e8f5e9',
                    color: u.role === 'admin' ? '#991b1b' : u.role === 'mentor' ? '#1565c0' : u.role === 'employer' ? '#6a1b9a' : '#2d6a4f',
                  }}>{u.role}</span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {u.isBlocked && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#fee2e2', color: '#991b1b' }}>Blocked</span>}
                    {!u.isApproved
                      ? <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#fef3c7', color: '#92400e' }}>Pending</span>
                      : <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#e8f5e9', color: '#2d6a4f' }}>Active</span>
                    }
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {['mentor', 'employer'].includes(u.role)
                    ? <SubBadge status={u.submissionStatus || 'not_submitted'} />
                    : <span style={{ fontSize: 12, color: '#d1d5db' }}>—</span>
                  }
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: '#9ca3af' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* View application */}
                    {['mentor', 'employer'].includes(u.role) && (
                      <button
                        onClick={() => setSelectedUser(u)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid #eef1f4', background: '#f8faf9', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        <Eye size={13} /> View
                      </button>
                    )}
                    {/* Quick approve (without viewing) */}
                    {!u.isApproved && u.role !== 'student' && (
                      <button
                        onClick={() => handleApprove(u._id)}
                        disabled={actioning === u._id}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: '#1a2e24', color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                      >
                        <Check size={12} /> Approve
                      </button>
                    )}
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => setConfirmAction({ type: u.isBlocked ? 'unblock' : 'block', user: u })}
                        disabled={actioning === u._id}
                        style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${u.isBlocked ? '#d5e8da' : '#fde68a'}`, background: 'transparent', color: u.isBlocked ? '#2d6a4f' : '#d97706', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        <Ban size={12} />
                      </button>
                    )}
                    {u.role !== 'admin' && (
                      <button onClick={() => setConfirmAction({ type: 'delete', user: u })} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #fecaca', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', fontSize: 14, color: '#9ca3af' }}>No users found matching your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Application Modal */}
      {selectedUser && (
        <ApplicationModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setConfirmAction(null)}>
          <div style={{
            background: '#fff', borderRadius: 24, padding: '36px 32px 28px', width: '100%', maxWidth: 400,
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)', textAlign: 'center',
            animation: 'fadeInUp 0.2s ease-out',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: confirmAction.type === 'delete' 
                ? 'linear-gradient(135deg, #fee2e2, #fef2f2)' 
                : 'linear-gradient(135deg, #fef3c7, #fffbeb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              border: confirmAction.type === 'delete' ? '1px solid #fecaca' : '1px solid #fde68a',
            }}>
              {confirmAction.type === 'delete' 
                ? <Trash2 size={28} color="#dc2626" />
                : <Ban size={28} color="#d97706" />}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>
              {confirmAction.type === 'delete' ? 'Delete User?' 
                : confirmAction.type === 'unblock' ? 'Unblock User?' 
                : 'Block User?'}
            </h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 6px', lineHeight: 1.6 }}>
              {confirmAction.type === 'delete' 
                ? <>Are you sure you want to <strong style={{color:'#dc2626'}}>permanently delete</strong> <strong>{confirmAction.user.name}</strong>? This action cannot be undone.</>
                : confirmAction.type === 'unblock'
                  ? <>Are you sure you want to <strong style={{color:'#2d6a4f'}}>unblock</strong> <strong>{confirmAction.user.name}</strong>? They will regain access to their account.</>
                  : <>Are you sure you want to <strong style={{color:'#d97706'}}>block</strong> <strong>{confirmAction.user.name}</strong>? They will lose access to the platform.</>}
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 24px' }}>{confirmAction.user.email}</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setConfirmAction(null)}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700,
                  background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'delete') handleDelete(confirmAction.user._id);
                  else handleToggleBlock(confirmAction.user._id);
                }}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700,
                  background: confirmAction.type === 'delete' 
                    ? 'linear-gradient(135deg, #dc2626, #b91c1c)' 
                    : confirmAction.type === 'unblock'
                      ? 'linear-gradient(135deg, #2d6a4f, #1a4731)'
                      : 'linear-gradient(135deg, #d97706, #b45309)',
                  color: '#fff', border: 'none',
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: confirmAction.type === 'delete' ? '0 4px 14px rgba(220,38,38,0.3)' : '0 4px 14px rgba(217,119,6,0.3)',
                }}
              >
                {confirmAction.type === 'delete' ? 'Yes, Delete' : confirmAction.type === 'unblock' ? 'Yes, Unblock' : 'Yes, Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminUsers;
