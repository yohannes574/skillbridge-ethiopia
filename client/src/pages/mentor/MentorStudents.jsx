import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { apiGetEnrollmentRequests, apiRespondToRequest, apiGetMentorStudents, apiGetStudentsProgress } from '../../api';
import toast from 'react-hot-toast';
import { Check, X, Users, BookOpen, TrendingUp, Clock, Star, AlertTriangle, MessageSquare } from 'lucide-react';

const MentorStudents = () => {
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentProgress, setStudentProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('requests');
  const [responding, setResponding] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // { reqId, studentName, courseName }
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [rRes, sRes] = await Promise.all([apiGetEnrollmentRequests(), apiGetMentorStudents()]);
      setRequests(rRes.data.data || []);
      setStudents(sRes.data.data || []);
      // Load progress for each student
      try {
        const pRes = await apiGetStudentsProgress();
        setStudentProgress(pRes.data.data || []);
      } catch {}
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleRespond = async (reqId, status, reason) => {
    setResponding(reqId + status);
    try {
      await apiRespondToRequest(reqId, { status, rejectionReason: reason || '' });
      toast.success(`Request ${status}!`);
      await loadAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setResponding(null); setRejectModal(null); setRejectReason(''); }
  };

  const getStudentProgress = (studentId, courseId) => {
    return studentProgress.find(p =>
      (p.studentId?._id || p.studentId) === studentId &&
      (p.courseId?._id || p.courseId) === courseId
    );
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  if (loading) return <DashboardLayout><div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title="Students" subtitle="Manage enrollment requests and track your students' progress" />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 14, background: '#f3f4f6', marginBottom: 28, width: 'fit-content' }}>
        <button onClick={() => setTab('requests')}
          style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: tab === 'requests' ? '#fff' : 'transparent',
            color: tab === 'requests' ? '#1a2e24' : '#6b7280',
            boxShadow: tab === 'requests' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
          }}>
          Requests
          {pendingRequests.length > 0 && (
            <span style={{ padding: '2px 8px', borderRadius: 20, background: '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 700 }}>{pendingRequests.length}</span>
          )}
        </button>
        <button onClick={() => setTab('enrolled')}
          style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: tab === 'enrolled' ? '#fff' : 'transparent',
            color: tab === 'enrolled' ? '#1a2e24' : '#6b7280',
            boxShadow: tab === 'enrolled' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s',
          }}>
          Enrolled ({students.length})
        </button>
      </div>

      {/* Requests Tab */}
      {tab === 'requests' && (
        <div>
          {requests.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 20, padding: 48, textAlign: 'center', border: '1px solid #f3f4f6' }}>
              <Users size={40} style={{ margin: '0 auto 12px', color: '#d1d5db' }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#6b7280' }}>No enrollment requests yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {requests.map((req) => (
                <div key={req._id} style={{
                  background: '#fff', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16,
                  border: `1px solid ${req.status === 'pending' ? '#fde68a' : '#f3f4f6'}`,
                  boxShadow: req.status === 'pending' ? '0 2px 12px rgba(245,158,11,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, color: '#fff', flexShrink: 0,
                  }}>
                    {req.studentId?.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#1a2e24', margin: '0 0 2px 0' }}>{req.studentId?.name}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 6px 0' }}>{req.studentId?.email}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BookOpen size={13} color="#9ca3af" />
                      <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{req.courseId?.title}</p>
                    </div>
                    {req.message && <p style={{ fontSize: 12, color: '#9ca3af', margin: '6px 0 0 0', fontStyle: 'italic' }}>"{req.message}"</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {req.status === 'pending' ? (
                      <>
                        <button onClick={() => handleRespond(req._id, 'accepted')} disabled={responding === req._id + 'accepted'}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: '#ecfdf5', color: '#15803d', fontWeight: 600, fontSize: 13, border: '1px solid #86efac', cursor: 'pointer' }}>
                          <Check size={14} /> Accept
                        </button>
                        <button onClick={() => setRejectModal({ reqId: req._id, studentName: req.studentId?.name, courseName: req.courseId?.title })} disabled={responding === req._id + 'rejected'}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: '#fef2f2', color: '#dc2626', fontWeight: 600, fontSize: 13, border: '1px solid #fecaca', cursor: 'pointer' }}>
                          <X size={14} /> Reject
                        </button>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{
                          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                          background: req.status === 'accepted' ? '#ecfdf5' : '#fef2f2',
                          color: req.status === 'accepted' ? '#15803d' : '#dc2626',
                        }}>
                          {req.status === 'accepted' ? '✅ Accepted' : '❌ Rejected'}
                        </span>
                        {req.status === 'rejected' && req.rejectionReason && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, maxWidth: 260, marginTop: 4, padding: '8px 12px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
                            <MessageSquare size={14} color="#dc2626" style={{ marginTop: 2, flexShrink: 0 }} />
                            <p style={{ fontSize: 12, color: '#991b1b', margin: 0, lineHeight: 1.4, fontStyle: 'italic' }}>"{req.rejectionReason}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enrolled Tab — Progress Cards */}
      {tab === 'enrolled' && (
        <div>
          {students.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 20, padding: 48, textAlign: 'center', border: '1px solid #f3f4f6' }}>
              <Users size={40} style={{ margin: '0 auto 12px', color: '#d1d5db' }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#6b7280' }}>No students enrolled yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {students.map((enrollment) => {
                const prog = getStudentProgress(enrollment.studentId?._id, enrollment.courseId?._id);
                const completedMods = prog?.completedModules?.length || 0;
                const completedLessons = prog?.completedLessons?.length || 0;
                const testScores = prog?.testScores || [];
                const avgScore = testScores.length > 0 ? Math.round(testScores.reduce((a, t) => a + (t.score || 0), 0) / testScores.length) : 0;

                return (
                  <div key={enrollment._id} style={{
                    background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #f3f4f6',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s',
                  }}>
                    {/* Student Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, color: '#fff',
                      }}>
                        {enrollment.studentId?.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#1a2e24', margin: 0 }}>{enrollment.studentId?.name}</p>
                        <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0 0' }}>{enrollment.studentId?.email}</p>
                      </div>
                    </div>

                    {/* Course Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f8faf9', borderRadius: 12, marginBottom: 16 }}>
                      <BookOpen size={15} color="#2d6a4f" />
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>{enrollment.courseId?.title}</p>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                      <div style={{ textAlign: 'center', padding: '10px 8px', background: '#ecfdf5', borderRadius: 10 }}>
                        <p style={{ fontSize: 20, fontWeight: 800, color: '#15803d', margin: 0 }}>{completedMods}</p>
                        <p style={{ fontSize: 10, color: '#6b7280', margin: 0 }}>Modules</p>
                      </div>
                      <div style={{ textAlign: 'center', padding: '10px 8px', background: '#eff6ff', borderRadius: 10 }}>
                        <p style={{ fontSize: 20, fontWeight: 800, color: '#1d4ed8', margin: 0 }}>{completedLessons}</p>
                        <p style={{ fontSize: 10, color: '#6b7280', margin: 0 }}>Lessons</p>
                      </div>
                      <div style={{ textAlign: 'center', padding: '10px 8px', background: '#fffbeb', borderRadius: 10 }}>
                        <p style={{ fontSize: 20, fontWeight: 800, color: '#92400e', margin: 0 }}>{avgScore}%</p>
                        <p style={{ fontSize: 10, color: '#6b7280', margin: 0 }}>Avg Score</p>
                      </div>
                    </div>

                    {/* Enrolled Since */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={13} color="#9ca3af" />
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>
                        Enrolled {new Date(enrollment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => { setRejectModal(null); setRejectReason(''); }}>
          <div style={{
            background: '#fff', borderRadius: 24, padding: '36px 32px 28px', width: '100%', maxWidth: 440,
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)', textAlign: 'center',
            animation: 'fadeInUp 0.2s ease-out',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #fee2e2, #fef2f2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', border: '1px solid #fecaca',
            }}>
              <AlertTriangle size={28} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Reject Enrollment?</h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 4px', lineHeight: 1.6 }}>
              You are about to reject <strong>{rejectModal.studentName}</strong>'s request for <strong>{rejectModal.courseName}</strong>.
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>Please provide a reason so the student understands why.</p>

            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g., Missing prerequisites, course is full, please try another section..."
              style={{
                width: '100%', padding: 14, borderRadius: 14, border: '2px solid #fecaca',
                fontSize: 14, resize: 'vertical', minHeight: 100, fontFamily: "'Inter', sans-serif",
                outline: 'none', background: '#fef2f2', color: '#1e293b',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#f87171'}
              onBlur={e => e.currentTarget.style.borderColor = '#fecaca'}
            />

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700,
                  background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!rejectReason.trim()) return toast.error('Please provide a rejection reason');
                  handleRespond(rejectModal.reqId, 'rejected', rejectReason);
                }}
                disabled={!!responding}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700,
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none',
                  cursor: 'pointer', boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {responding ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><X size={16} /> Confirm Rejection</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MentorStudents;
