import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { apiGetCertRequests, apiMentorRespondCert } from '../../api';
import toast from 'react-hot-toast';
import { Award, Check, X, User, BookOpen, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const statusBadge = {
  mentor_pending: { label: '⏳ Awaiting Your Review', bg: '#fffbeb', color: '#92400e' },
  admin_pending:  { label: '🔄 Forwarded to Admin',   bg: '#eff6ff', color: '#1e40af' },
  approved:       { label: '✅ Approved',              bg: '#f0fdf4', color: '#15803d' },
  rejected:       { label: '❌ Rejected',              bg: '#fef2f2', color: '#dc2626' },
};

const QuizBadge = ({ q }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
    borderRadius: 10, background: q.passed ? '#f0fdf4' : '#fef2f2',
    border: `1px solid ${q.passed ? '#86efac' : '#fca5a5'}`,
  }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: q.passed ? '#15803d' : '#dc2626' }}>
      {q.passed ? '✅' : '❌'} {q.testTitle}
    </span>
    {q.score !== null && (
      <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{q.score}%</span>
    )}
  </div>
);

const MentorCertificates = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // { id, studentName }
  const [rejectReason, setRejectReason] = useState('');
  const [responding, setResponding] = useState(null);

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
      await apiMentorRespondCert(id, { action: 'approve', note: '' });
      toast.success('Approved! Forwarded to admin for final sign-off.');
      await load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setResponding(null); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error('Please provide a reason');
    setResponding(rejectModal.id + 'reject');
    try {
      await apiMentorRespondCert(rejectModal.id, { action: 'reject', note: rejectReason });
      toast.success('Request rejected and student notified.');
      setRejectModal(null);
      setRejectReason('');
      await load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setResponding(null); }
  };

  const pending  = requests.filter(r => r.status === 'mentor_pending');
  const actioned = requests.filter(r => r.status !== 'mentor_pending');

  if (loading) return <DashboardLayout><div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title="Certificate Requests" subtitle="Review student achievements and forward to admin" />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Pending Review', value: pending.length, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Total Requests', value: requests.length, color: '#2d6a4f', bg: '#f0fdf4' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '14px 22px', borderRadius: 16, background: s.bg, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Award size={22} color={s.color} />
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: '#6b7280', margin: 0, fontWeight: 600 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {requests.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, padding: '60px 32px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
          <Award size={48} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2e24' }}>No requests yet</h3>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Students who complete your courses will appear here requesting certificates.</p>
        </div>
      ) : (
        <>
          {/* Pending section */}
          {pending.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#92400e', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                ⏳ Awaiting Your Review ({pending.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {pending.map(req => (
                  <CertCard key={req._id} req={req} expanded={expanded} setExpanded={setExpanded}
                    onApprove={() => handleApprove(req._id)}
                    onReject={() => setRejectModal({ id: req._id, studentName: req.studentId?.name })}
                    responding={responding}
                    stage="mentor"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actioned section */}
          {actioned.length > 0 && (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#6b7280', marginBottom: 14 }}>Previously Actioned</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {actioned.map(req => (
                  <CertCard key={req._id} req={req} expanded={expanded} setExpanded={setExpanded} responding={responding} stage="mentor" readOnly />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, maxWidth: 460, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <AlertCircle size={22} color="#dc2626" />
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1a2e24', margin: 0 }}>Decline Certificate</h3>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
              Please provide a reason for declining <strong>{rejectModal.studentName}</strong>'s request. This will be sent to the student.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Quiz score is below the required threshold, please retake..."
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
                Decline & Notify Student
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const CertCard = ({ req, expanded, setExpanded, onApprove, onReject, responding, readOnly }) => {
  const isOpen = expanded === req._id;
  const badge  = statusBadge[req.status] || statusBadge.mentor_pending;
  const detail = req.studentDetail;

  return (
    <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #eef1f4', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#2d6a4f,#40916c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#fff', flexShrink: 0 }}>
          {req.studentId?.name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a2e24', margin: 0 }}>{req.studentId?.name}</h3>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: badge.bg, color: badge.color }}>{badge.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={12} color="#9ca3af" />
            <span style={{ fontSize: 12, color: '#6b7280' }}>{req.courseId?.title}</span>
          </div>
        </div>
        <button onClick={() => setExpanded(isOpen ? null : req._id)}
          style={{ background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
          Details {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
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
              <div style={{ height: '100%', width: `${detail.progress}%`, background: 'linear-gradient(90deg, #2d6a4f, #52b788)', borderRadius: 8, transition: 'width 0.5s ease' }} />
            </div>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{detail.modulesCompleted}/{detail.totalModules} modules completed</p>
          </div>

          {/* Quiz Results */}
          {detail.quizzes?.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Quiz Results</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {detail.quizzes.map((q, i) => <QuizBadge key={i} q={q} />)}
              </div>
            </div>
          )}

          {/* Rejection reason if rejected */}
          {req.status === 'rejected' && req.rejectionReason && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fca5a5' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', margin: '0 0 4px 0' }}>Rejection Reason ({req.rejectedBy}):</p>
              <p style={{ fontSize: 12, color: '#7f1d1d', margin: 0 }}>{req.rejectionReason}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      {!readOnly && req.status === 'mentor_pending' && (
        <div style={{ padding: '14px 22px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 10 }}>
          <button onClick={onReject} disabled={!!responding}
            style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: '2px solid #fca5a5', background: '#fff', color: '#dc2626', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <X size={15} /> Decline
          </button>
          <button onClick={onApprove} disabled={!!responding}
            style={{ flex: 2, padding: '10px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2d6a4f, #1a4731)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(45,106,79,0.3)' }}>
            <Check size={15} /> Approve & Forward to Admin
          </button>
        </div>
      )}
    </div>
  );
};

export default MentorCertificates;
