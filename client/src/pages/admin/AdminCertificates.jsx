import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { apiGetCertRequests, apiAdminRespondCert } from '../../api';
import toast from 'react-hot-toast';
import { Award, Check, X, BookOpen, ChevronDown, ChevronUp, AlertCircle, ShieldCheck } from 'lucide-react';

const statusBadge = {
  mentor_pending: { label: '⏳ Pending Mentor',    bg: '#f3f4f6', color: '#6b7280' },
  admin_pending:  { label: '🔔 Awaiting Admin',    bg: '#fffbeb', color: '#92400e' },
  approved:       { label: '✅ Approved & Issued', bg: '#f0fdf4', color: '#15803d' },
  rejected:       { label: '❌ Rejected',          bg: '#fef2f2', color: '#dc2626' },
};

const QuizBadge = ({ q }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 11px', borderRadius: 10, background: q.passed ? '#f0fdf4' : '#fef2f2', border: `1px solid ${q.passed ? '#86efac' : '#fca5a5'}` }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: q.passed ? '#15803d' : '#dc2626' }}>
      {q.passed ? '✅' : '❌'} {q.testTitle}
    </span>
    {q.score !== null && <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{q.score}%</span>}
  </div>
);

const AdminCertificates = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [responding, setResponding] = useState(null);
  const [filter, setFilter] = useState('admin_pending');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await apiGetCertRequests();
      setRequests(res.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    setResponding(id + 'approve');
    try {
      await apiAdminRespondCert(id, { action: 'approve', note: '' });
      toast.success('🏆 Certificate issued! Student and mentor notified.');
      await load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setResponding(null); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error('Please provide a rejection reason');
    setResponding(rejectModal.id + 'reject');
    try {
      await apiAdminRespondCert(rejectModal.id, { action: 'reject', note: rejectReason });
      toast.success('Rejected. Student and mentor notified.');
      setRejectModal(null);
      setRejectReason('');
      await load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setResponding(null); }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  if (loading) return <DashboardLayout><div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title="Certificate Management" subtitle="Final approval of certificates forwarded by mentors" />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Awaiting Action', value: requests.filter(r => r.status === 'admin_pending').length, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Approved & Issued', value: requests.filter(r => r.status === 'approved').length, color: '#2d6a4f', bg: '#f0fdf4' },
          { label: 'Total Requests', value: requests.length, color: '#6b7280', bg: '#f9fafb' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '16px 20px', borderRadius: 16, background: s.bg, border: `1px solid ${s.color}25` }}>
            <p style={{ fontSize: 26, fontWeight: 800, color: s.color, margin: '0 0 2px 0' }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: 0, fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: 5, borderRadius: 14, background: '#f3f4f6', marginBottom: 24, width: 'fit-content' }}>
        {[
          { key: 'admin_pending', label: '⏳ Pending Action' },
          { key: 'approved',      label: '✅ Approved' },
          { key: 'rejected',      label: '❌ Rejected' },
          { key: 'all',           label: 'All' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: filter === tab.key ? '#fff' : 'transparent', color: filter === tab.key ? '#1a2e24' : '#6b7280', boxShadow: filter === tab.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, padding: '60px 32px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
          <ShieldCheck size={48} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2e24' }}>No requests here</h3>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Mentor-approved certificate requests will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(req => {
            const isOpen = expanded === req._id;
            const badge  = statusBadge[req.status] || statusBadge.admin_pending;
            const detail = req.studentDetail;

            return (
              <div key={req._id} style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${req.status === 'admin_pending' ? '#fde68a' : '#f3f4f6'}`, overflow: 'hidden', boxShadow: req.status === 'admin_pending' ? '0 4px 18px rgba(245,158,11,0.1)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
                {/* Header */}
                <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Avatar */}
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#2d6a4f,#40916c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#fff', flexShrink: 0 }}>
                    {req.studentId?.name?.[0]?.toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a2e24', margin: 0 }}>{req.studentId?.name}</h3>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: badge.bg, color: badge.color, flexShrink: 0 }}>{badge.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', flexWrap: 'wrap', gap: '0 14px' }}>
                      <span>📚 {req.courseId?.title}</span>
                      <span style={{ color: '#2d6a4f', fontWeight: 600 }}>✓ Mentor: {req.mentorId?.name}</span>
                      {req.mentorNote && <span style={{ fontStyle: 'italic' }}>Note: "{req.mentorNote}"</span>}
                    </div>
                  </div>

                  <button onClick={() => setExpanded(isOpen ? null : req._id)}
                    style={{ background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                    Details {isOpen ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                  </button>
                </div>

                {/* Expanded Detail */}
                {isOpen && detail && (
                  <div style={{ borderTop: '1px solid #f3f4f6', padding: '18px 22px', background: '#fafbfc' }}>
                    {/* Progress */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Course Progress</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#2d6a4f' }}>{detail.progress}%</span>
                      </div>
                      <div style={{ height: 8, background: '#e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${detail.progress}%`, background: 'linear-gradient(90deg, #2d6a4f, #52b788)', borderRadius: 8 }} />
                      </div>
                      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{detail.modulesCompleted}/{detail.totalModules} modules completed</p>
                    </div>

                    {/* Quizzes */}
                    {detail.quizzes?.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Quiz Results</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {detail.quizzes.map((q, i) => <QuizBadge key={i} q={q} />)}
                        </div>
                      </div>
                    )}

                    {/* Mentor approval note */}
                    {req.mentorNote && (
                      <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #86efac' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#15803d', margin: '0 0 3px 0' }}>Mentor's Note:</p>
                        <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>{req.mentorNote}</p>
                      </div>
                    )}

                    {/* Rejection reason */}
                    {req.status === 'rejected' && req.rejectionReason && (
                      <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fca5a5' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', margin: '0 0 3px 0' }}>Rejection Reason (by {req.rejectedBy}):</p>
                        <p style={{ fontSize: 12, color: '#7f1d1d', margin: 0 }}>{req.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Action Footer */}
                {req.status === 'admin_pending' && (
                  <div style={{ padding: '14px 22px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10 }}>
                    <button onClick={() => setRejectModal({ id: req._id, studentName: req.studentId?.name })} disabled={!!responding}
                      style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: '2px solid #fca5a5', background: '#fff', color: '#dc2626', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <X size={15} /> Reject
                    </button>
                    <button onClick={() => handleApprove(req._id)} disabled={!!responding}
                      style={{ flex: 2, padding: '10px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2d6a4f, #1a4731)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(45,106,79,0.3)' }}>
                      <Check size={15} /> Approve & Issue Certificate
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 460, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <AlertCircle size={22} color="#dc2626" />
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1a2e24', margin: 0 }}>Reject Certificate</h3>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
              Provide a reason for rejecting <strong>{rejectModal.studentName}'s</strong> certificate. This will be sent to <strong>both the student and mentor</strong>.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. The student did not meet the minimum requirements..."
              rows={4}
              style={{ width: '100%', borderRadius: 12, border: '1.5px solid #e5e7eb', padding: '12px 14px', fontSize: 13, fontFamily: "'Inter', sans-serif", resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleReject} disabled={!!responding}
                style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: responding ? 0.6 : 1 }}>
                Reject & Notify All
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminCertificates;
