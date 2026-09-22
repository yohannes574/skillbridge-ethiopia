import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { apiGetJobApplications, apiUpdateApplicationStatus, apiSendJobOffer, apiFinalizeHire, apiAdvanceApplicationStage, apiMarkInterviewJoined } from '../../api';
import { FileText, Loader2, CheckCircle, XCircle, Clock, ExternalLink, Send, X, DollarSign, Calendar, Briefcase, Video, Code, ChevronRight, PlayCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const EmployerRequests = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Modals Data
  const [selectedAppOffer, setSelectedAppOffer] = useState(null);
  const [selectedAppTest, setSelectedAppTest] = useState(null);
  const [selectedAppInterview, setSelectedAppInterview] = useState(null);
  
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerData, setOfferData] = useState({ salary: '', startDate: '', duration: '', terms: '' });

  const [testData, setTestData] = useState({ 
    testType: 'external', 
    testLink: '', 
    testInstructions: '',
    assignmentInstructions: '',
    internalQuiz: []
  });
  const [newQuestion, setNewQuestion] = useState({ questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0 });
  const [interviewData, setInterviewData] = useState({ interviewDate: '', interviewTime: '' });
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getInterviewStartDateTime = (stageTracking) => {
    if (!stageTracking?.interviewDate || !stageTracking?.interviewTime) return null;
    const date = new Date(stageTracking.interviewDate);
    if (Number.isNaN(date.getTime())) return null;

    const [hourString, minuteString] = String(stageTracking.interviewTime).split(':');
    const hour = Number(hourString || 0);
    const minute = Number(minuteString || 0);

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      Number.isNaN(hour) ? 0 : hour,
      Number.isNaN(minute) ? 0 : minute,
      0,
      0
    );
  };

  const isInterviewRedAlertActive = (stageTracking) => {
    const start = getInterviewStartDateTime(stageTracking);
    if (!start) return false;
    if (stageTracking?.employerJoinedAt) return false;

    const startMs = start.getTime();
    const alertEndMs = startMs + 3 * 60 * 1000;
    return nowTs >= startMs && nowTs <= alertEndMs;
  };

  const handleJoinInterview = async (app) => {
    try {
      const res = await apiMarkInterviewJoined(app._id);
      const updatedStageTracking = res?.data?.data?.stageTracking;

      if (updatedStageTracking) {
        setApplications(prev => prev.map(item => (
          item._id === app._id ? { ...item, stageTracking: updatedStageTracking } : item
        )));
      }
    } catch (error) {
      toast.error('Could not record interview join status');
    } finally {
      navigate(`/interview/${app.stageTracking?.interviewRoomId}`);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await apiGetJobApplications();
      setApplications(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await apiUpdateApplicationStatus(id, { status });
      toast.success(`Application marked as ${status}`);
      setApplications(prev => prev.map(app => (app._id === id ? { ...app, status } : app)));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const advanceStage = async (id, status, trackingPayload = null) => {
    try {
      const res = await apiAdvanceApplicationStage(id, { status, trackingPayload });
      toast.success(`Application advanced to ${status.replace('_', ' ')}!`);
      // Update local state
      setApplications(prev => prev.map(app => (app._id === id ? { ...app, status, stageTracking: { ...app.stageTracking, ...trackingPayload } } : app)));
      
      // Close Modals
      setSelectedAppTest(null);
      setSelectedAppInterview(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to advance stage');
    }
  };

  const handleSendOffer = async (e) => {
    e.preventDefault();
    setSubmittingOffer(true);
    try {
      const res = await apiSendJobOffer(selectedAppOffer._id, offerData);
      toast.success('Official Offer Sent Successfully!');
      setApplications(prev => prev.map(app => (app._id === selectedAppOffer._id ? { ...app, status: 'offer_sent', offerDetails: res.data.data.offerDetails } : app)));
      setSelectedAppOffer(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send offer');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handeFinalizeHire = async (id) => {
    try {
      await apiFinalizeHire(id);
      toast.success('Hiring finalized! The job posting is now closed.');
      setApplications(prev => prev.map(app => (app._id === id ? { ...app, status: 'hired' } : app)));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to finalize hire');
    }
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title="Job Applications ATS" subtitle="Review candidates, assign tests, conduct video interviews, and finalize hires" />

      {applications.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 24, padding: '80px 20px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
          <div style={{ width: 80, height: 80, background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <FileText size={40} color="#94a3b8" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>No Applications Yet</h3>
          <p style={{ color: '#64748b', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            When students apply, their progressive ATS pipelines will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 24 }}>
          {applications.map(app => (
            <div key={app._id} style={{ background: '#fff', borderRadius: 20, border: app.status === 'offer_accepted' ? '2px solid #10b981' : '1px solid #e2e8f0', padding: 24, display: 'flex', flexDirection: 'column', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {app.studentId?.avatar ? (
                    <img src={app.studentId.avatar} alt="Avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800 }}>
                      {app.studentId?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>{app.studentId?.name || 'Unknown Student'}</h3>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0, marginBottom: 4 }}>{app.studentId?.email}</p>
                    <p style={{ fontSize: 13, color: '#2563eb', margin: 0, fontWeight: 700 }}>{app.jobId?.title || 'Unknown Job'}</p>
                  </div>
                </div>
                
                <span style={{ 
                  padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', 
                  background: app.status === 'pending' || app.status === 'under_review' ? '#fef3c7' : ['offer_sent', 'test_assigned', 'interview_scheduled'].includes(app.status) ? '#e0e7ff' : app.status === 'offer_accepted' || app.status === 'hired' ? '#ecfdf5' : '#fee2e2', 
                  color: app.status === 'pending' || app.status === 'under_review' ? '#d97706' : ['offer_sent', 'test_assigned', 'interview_scheduled'].includes(app.status) ? '#4338ca' : app.status === 'offer_accepted' || app.status === 'hired' ? '#10b981' : '#ef4444' 
                }}>
                  {app.status.replace('_', ' ')}
                </span>
              </div>

              {app.githubUrl && (
                <a href={app.githubUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: 8, marginBottom: 8, textDecoration: 'none', width: 'fit-content' }}>
                  <Code size={14} /> GitHub Profile Link
                </a>
              )}
              {app.portfolioUrl && (
                <a href={app.portfolioUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#0369a1', background: '#e0f2fe', border: '1px solid #bae6fd', padding: '6px 12px', borderRadius: 8, marginBottom: 16, textDecoration: 'none', width: 'fit-content' }}>
                  <ExternalLink size={14} /> View External Portfolio
                </a>
              )}

              {app.studentId?.skills?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', margin: '0 0 8px', textTransform: 'uppercase' }}>Applicant Skills</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {app.studentId.skills.map(s => (
                      <span key={s} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 6 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Action Pipeline Logic Engine */}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                {app.resumeUrl && (
                  <a href={app.resumeUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#f1f5f9', color: '#334155', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', border: '1px solid #cbd5e1' }}>
                    <FileText size={16} /> View Attached Resume
                  </a>
                )}

                {app.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => advanceStage(app._id, 'under_review')} style={{ flex: 1, background: '#f59e0b', color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      Mark Under Review <ChevronRight size={16} />
                    </button>
                    <button onClick={() => handleStatusUpdate(app._id, 'rejected')} style={{ background: '#fff', color: '#ef4444', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: '1px solid #fca5a5', cursor: 'pointer' }}>
                      Decline
                    </button>
                  </div>
                )}

                {app.status === 'under_review' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setSelectedAppTest(app)} style={{ flex: 1, background: '#0284c7', color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      Assign Tech Test <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {app.status === 'test_assigned' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {app.stageTracking?.testType === 'internal_quiz' && (
                      <div style={{ background: app.stageTracking?.quizScoreSubmitted !== null && app.stageTracking?.quizScoreSubmitted !== undefined ? '#ecfdf5' : '#fff7ed', border: `1px solid ${app.stageTracking?.quizScoreSubmitted !== null && app.stageTracking?.quizScoreSubmitted !== undefined ? '#86efac' : '#fdba74'}`, borderRadius: 10, padding: '12px 14px' }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase' }}>Internal Quiz Result</p>
                        <p style={{ fontSize: 13, margin: 0, fontWeight: 700, color: app.stageTracking?.quizScoreSubmitted !== null && app.stageTracking?.quizScoreSubmitted !== undefined ? '#166534' : '#9a3412' }}>
                          {app.stageTracking?.quizScoreSubmitted !== null && app.stageTracking?.quizScoreSubmitted !== undefined
                            ? `Candidate score: ${app.stageTracking.quizScoreSubmitted}%`
                            : 'Candidate has not submitted quiz answers yet.'}
                        </p>
                      </div>
                    )}

                    {app.stageTracking?.testType === 'assignment' && (
                      <div style={{ background: app.stageTracking?.assignmentStudentSubmissionUrl ? '#ecfdf5' : '#fff7ed', border: `1px solid ${app.stageTracking?.assignmentStudentSubmissionUrl ? '#86efac' : '#fdba74'}`, borderRadius: 10, padding: '12px 14px' }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase' }}>Assignment Submission</p>
                        {app.stageTracking?.assignmentStudentSubmissionUrl ? (
                          <a href={app.stageTracking.assignmentStudentSubmissionUrl} target="_blank" rel="noreferrer" style={{ color: '#166534', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <ExternalLink size={14} /> Open Candidate Submission
                          </a>
                        ) : (
                          <p style={{ fontSize: 13, margin: 0, fontWeight: 700, color: '#9a3412' }}>
                            Candidate has not submitted assignment yet.
                          </p>
                        )}
                      </div>
                    )}

                    <button onClick={() => setSelectedAppInterview(app)} style={{ flex: 1, background: '#db2777', color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Calendar size={16} /> Schedule Video Interview <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {app.status === 'interview_scheduled' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {isInterviewRedAlertActive(app.stageTracking) && (
                      <div style={{ background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 10, padding: '10px 12px', color: '#991b1b', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={16} /> LIVE NOW: Interview started. Please join within 3 minutes.
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fdf2f8', padding: '12px 16px', borderRadius: 10, border: '1px solid #fbcfe8' }}>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 800, color: '#be185d', margin: '0 0 4px', textTransform: 'uppercase' }}>Upcoming Interview</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#831843', margin: 0 }}>{new Date(app.stageTracking?.interviewDate).toLocaleDateString()} at {app.stageTracking?.interviewTime}</p>
                      </div>
                      <button onClick={() => handleJoinInterview(app)} style={{ background: '#db2777', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                         <Video size={14} /> Join
                      </button>
                    </div>
                    <button onClick={() => advanceStage(app._id, 'interview_completed')} style={{ width: '100%', background: '#fff', color: '#db2777', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 800, border: '2px solid #fbcfe8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      Mark Interview Completed
                    </button>
                  </div>
                )}

                {app.status === 'interview_completed' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setSelectedAppOffer(app); setOfferData({ salary: app.jobId?.salary !== 'Negotiable' ? app.jobId?.salary : '', startDate: '', duration: '', terms: '' }); }} style={{ flex: 1, background: '#2563eb', color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Send size={16} /> Send Formal Offer
                    </button>
                    <button onClick={() => handleStatusUpdate(app._id, 'rejected')} style={{ background: '#fff', color: '#ef4444', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: '1px solid #fca5a5', cursor: 'pointer' }}>
                      Decline
                    </button>
                  </div>
                )}

                {app.status === 'offer_sent' && (
                  <div style={{ background: '#e0e7ff', color: '#3730a3', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid #c7d2fe' }}>
                    <Clock size={16} /> Waiting for Student Confirmation
                  </div>
                )}

                {app.status === 'offer_accepted' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ background: '#ecfdf5', color: '#065f46', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #a7f3d0' }}>
                      <CheckCircle size={16} /> Student Accepted Terms!
                    </div>
                    <button onClick={() => handeFinalizeHire(app._id)} style={{ background: '#10b981', color: '#fff', padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}>
                      Finalize Hire & Close Job
                    </button>
                  </div>
                )}
                
                {app.status === 'hired' && (
                  <div style={{ background: '#1e293b', color: '#fff', padding: '12px', borderRadius: 10, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    🎉 OFFICIALLY HIRED
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Send Testing Modal */}
      {selectedAppTest && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)' }} onClick={() => setSelectedAppTest(null)} />
          <div style={{ background: '#fff', width: '100%', maxWidth: 550, borderRadius: 24, position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0f9ff', flexShrink: 0 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0369a1', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Code size={20} /> Assign Tech Assessment</h2>
              <button onClick={() => setSelectedAppTest(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            
            <div style={{ padding: '24px 32px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#f1f5f9', padding: 6, borderRadius: 12 }}>
                <button type="button" onClick={() => setTestData({...testData, testType: 'internal_quiz'})} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', background: testData.testType === 'internal_quiz' ? '#fff' : 'transparent', color: testData.testType === 'internal_quiz' ? '#0369a1' : '#64748b', boxShadow: testData.testType === 'internal_quiz' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                  🟢 Internal Quiz
                </button>
                <button type="button" onClick={() => setTestData({...testData, testType: 'assignment'})} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', background: testData.testType === 'assignment' ? '#fff' : 'transparent', color: testData.testType === 'assignment' ? '#0369a1' : '#64748b', boxShadow: testData.testType === 'assignment' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                  🔵 Assignment
                </button>
                <button type="button" onClick={() => setTestData({...testData, testType: 'external'})} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', background: testData.testType === 'external' ? '#fff' : 'transparent', color: testData.testType === 'external' ? '#0369a1' : '#64748b', boxShadow: testData.testType === 'external' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                  🟡 External Link
                </button>
              </div>

              {testData.testType === 'external' && (
                <form id="testForm" onSubmit={(e) => { e.preventDefault(); advanceStage(selectedAppTest._id, 'test_assigned', { testType: 'external', testLink: testData.testLink, testInstructions: testData.testInstructions }); }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Test Assessment URL *</label>
                    <input required type="url" value={testData.testLink} onChange={e => setTestData({...testData, testLink: e.target.value})} placeholder="https://hackerrank.com/..." style={{ width: '100%', padding: '14px', borderRadius: 12, border: '2px solid #e2e8f0', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Instructions</label>
                    <textarea required value={testData.testInstructions} onChange={e => setTestData({...testData, testInstructions: e.target.value})} placeholder="Please complete this test..." rows={3} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '2px solid #e2e8f0', outline: 'none', resize: 'vertical' }} />
                  </div>
                </form>
              )}

              {testData.testType === 'assignment' && (
                <form id="testForm" onSubmit={(e) => { e.preventDefault(); advanceStage(selectedAppTest._id, 'test_assigned', { testType: 'assignment', assignmentInstructions: testData.assignmentInstructions }); }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Takehome Assignment Prompt *</label>
                    <textarea required value={testData.assignmentInstructions} onChange={e => setTestData({...testData, assignmentInstructions: e.target.value})} placeholder="Clone this repo and complete the API routes..." rows={6} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '2px solid #e2e8f0', outline: 'none', resize: 'vertical' }} />
                  </div>
                </form>
              )}

              {testData.testType === 'internal_quiz' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {testData.internalQuiz.map((q, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 12px' }}>Q{idx + 1}: {q.questionText}</p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {q.options.map((opt, oIdx) => (
                          <li key={oIdx} style={{ fontSize: 13, color: q.correctAnswerIndex === oIdx ? '#10b981' : '#64748b', fontWeight: q.correctAnswerIndex === oIdx ? 700 : 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {q.correctAnswerIndex === oIdx ? <CheckCircle size={14} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid #cbd5e1' }} />}
                            {opt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <div style={{ background: '#fff', border: '2px dashed #cbd5e1', borderRadius: 16, padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#334155', margin: '0 0 16px' }}>Add Question</h3>
                    <input type="text" value={newQuestion.questionText} onChange={e => setNewQuestion({...newQuestion, questionText: e.target.value})} placeholder="Question text..." style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 12, fontSize: 13 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                      {[0, 1, 2, 3].map(idx => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input type="radio" checked={newQuestion.correctAnswerIndex === idx} onChange={() => setNewQuestion({...newQuestion, correctAnswerIndex: idx})} name="correctOption" style={{ accentColor: '#10b981' }} />
                          <input type="text" value={newQuestion.options[idx]} onChange={e => { const opts = [...newQuestion.options]; opts[idx] = e.target.value; setNewQuestion({...newQuestion, options: opts}); }} placeholder={`Option ${idx + 1}`} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => {
                      if(!newQuestion.questionText) return;
                      setTestData(prev => ({...prev, internalQuiz: [...prev.internalQuiz, newQuestion]}));
                      setNewQuestion({ questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0 });
                    }} style={{ width: '100%', background: '#f1f5f9', color: '#0369a1', padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>+ Add Question</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '24px 32px', borderTop: '1px solid #e2e8f0', background: '#fff', flexShrink: 0 }}>
               {testData.testType === 'internal_quiz' ? (
                 <button type="button" onClick={() => {
                   if (testData.internalQuiz.length === 0) return toast.error('Add at least one question');
                   advanceStage(selectedAppTest._id, 'test_assigned', { testType: 'internal_quiz', internalQuiz: testData.internalQuiz });
                 }} style={{ width: '100%', background: '#0284c7', color: '#fff', padding: '16px', borderRadius: 14, fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer' }}>Send Internal Quiz</button>
               ) : (
                 <button type="submit" form="testForm" style={{ width: '100%', background: '#0284c7', color: '#fff', padding: '16px', borderRadius: 14, fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer' }}>Send Tech Assessment</button>
               )}
            </div>

          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {selectedAppInterview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)' }} onClick={() => setSelectedAppInterview(null)} />
          <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderRadius: 24, position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fdf2f8' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#be185d', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={20} /> Schedule Video Interview</h2>
              <button onClick={() => setSelectedAppInterview(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 32 }}>
              <form onSubmit={(e) => { 
                e.preventDefault(); 
                // Auto generate Jitsi Room Id
                const roomId = Math.random().toString(36).substring(2, 12);
                advanceStage(selectedAppInterview._id, 'interview_scheduled', { ...interviewData, interviewRoomId: roomId }); 
              }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Date *</label>
                    <input required type="date" value={interviewData.interviewDate} onChange={e => setInterviewData({...interviewData, interviewDate: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '2px solid #e2e8f0', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Time *</label>
                    <input required type="time" value={interviewData.interviewTime} onChange={e => setInterviewData({...interviewData, interviewTime: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '2px solid #e2e8f0', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}><Video size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}/> Auto-generate Video Room</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>An encrypted Jitsi connection will automatically unlock for both you and the candidate upon scheduling.</p>
                </div>
                <button type="submit" style={{ background: '#db2777', color: '#fff', padding: '16px', borderRadius: 14, fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer' }}>Schedule Session</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Send Offer Modal (Remains identical) */}
      {selectedAppOffer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)' }} onClick={() => setSelectedAppOffer(null)} />
          <div style={{ background: '#fff', width: '100%', maxWidth: 550, borderRadius: 24, position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Briefcase size={20} color="#2563eb" /> Send Formal Offer
                </h2>
              </div>
              <button type="button" onClick={() => setSelectedAppOffer(null)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>

            <div style={{ padding: 32, overflowY: 'auto' }}>
              <form onSubmit={handleSendOffer} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Salary / Compensation *</label>
                  <input required value={offerData.salary} onChange={e => setOfferData({...offerData, salary: e.target.value})} placeholder="e.g. $80,000/yr" style={{ width: '100%', padding: '14px', borderRadius: 12, border: '2px solid #e2e8f0', outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Start Date *</label>
                    <input required type="date" value={offerData.startDate} onChange={e => setOfferData({...offerData, startDate: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '2px solid #e2e8f0', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Duration (Optional)</label>
                    <input value={offerData.duration} onChange={e => setOfferData({...offerData, duration: e.target.value})} placeholder="6 Months" style={{ width: '100%', padding: '14px', borderRadius: 12, border: '2px solid #e2e8f0', outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Terms & Conditions *</label>
                  <textarea required value={offerData.terms} onChange={e => setOfferData({...offerData, terms: e.target.value})} rows={4} style={{ width: '100%', padding: '16px', borderRadius: 16, border: '2px solid #e2e8f0', outline: 'none', resize: 'vertical' }} />
                </div>
                <button type="submit" disabled={submittingOffer} style={{ width: '100%', background: '#2563eb', color: '#fff', padding: '16px', borderRadius: 14, fontWeight: 800, fontSize: 15, border: 'none', cursor: submittingOffer ? 'not-allowed' : 'pointer' }}>
                  {submittingOffer ? 'Transmitting...' : 'Send Official Offer'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default EmployerRequests;
