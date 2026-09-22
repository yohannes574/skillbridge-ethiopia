import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { apiGetAllJobs, apiApplyForJob, apiUploadFile, apiGetStudentApplications, apiRespondToOffer, apiMarkInterviewJoined } from '../../api';
import { Briefcase, MapPin, DollarSign, Send, X, Loader2, FileText, Link as LinkIcon, CheckCircle, UploadCloud, UserCircle2, Calendar, Clock, XCircle, Code, Video, PlayCircle, Users, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const StudentJobBoard = () => {
  const [activeTab, setActiveTab] = useState('posted'); // 'posted' | 'mine'
  const navigate = useNavigate();

  // Data states
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Application Modal state
  const [selectedJob, setSelectedJob] = useState(null);
  const [submittingApply, setSubmittingApply] = useState(false);

  // Active Quiz State
  const [activeQuizApp, setActiveQuizApp] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeType, setResumeType] = useState('url'); // 'url' or 'upload'
  const [resumeUrl, setResumeUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState(new Set()); // Keep track to show "Applied" state locally on 'posted' jobs

  // Consent checkbox states (mapped by application ID)
  const [consentCheckedMap, setConsentCheckedMap] = useState({});
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    fetchData();
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
    if (stageTracking?.studentJoinedAt) return false;

    const startMs = start.getTime();
    const alertEndMs = startMs + 3 * 60 * 1000;
    return nowTs >= startMs && nowTs <= alertEndMs;
  };

  const handleJoinInterview = async (application) => {
    try {
      const res = await apiMarkInterviewJoined(application._id);
      const updatedStageTracking = res?.data?.data?.stageTracking;
      if (updatedStageTracking) {
        setMyApplications(prev => prev.map(app => (
          app._id === application._id ? { ...app, stageTracking: updatedStageTracking } : app
        )));
      }
    } catch (error) {
      toast.error('Could not record interview join status');
    } finally {
      navigate(`/interview/${application.stageTracking?.interviewRoomId}`);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, appsRes] = await Promise.all([apiGetAllJobs(), apiGetStudentApplications()]);
      setJobs(jobsRes.data.data || []);
      setMyApplications(appsRes.data.data || []);

      const appliedIds = appsRes.data.data.map(app => app.jobId?._id);
      setAppliedJobs(new Set(appliedIds));
    } catch (error) {
      toast.error('Failed to load job board data');
    } finally {
      setLoading(false);
    }
  };

  const openApplyModal = (job) => {
    setSelectedJob(job);
    setCoverLetter('');
    setResumeType('url');
    setResumeUrl('');
    setGithubUrl('');
    setPortfolioUrl('');
    setResumeFile(null);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmittingApply(true);
    try {
      let finalResumeUrl = resumeUrl;
      if (resumeType === 'upload' && resumeFile) {
        const uploadRes = await apiUploadFile(resumeFile);
        finalResumeUrl = uploadRes.data.data.url;
      }
      await apiApplyForJob(selectedJob._id, { coverLetter, resumeUrl: finalResumeUrl, githubUrl, portfolioUrl });
      toast.success(`Successfully applied to ${selectedJob.title}!`);
      setAppliedJobs((prev) => new Set(prev).add(selectedJob._id));
      setSelectedJob(null);
      fetchData(); // Reload so it shows up in "My Applications"
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmittingApply(false);
    }
  };

  const handleOfferResponse = async (appId, status) => {
    if (status === 'offer_accepted' && !consentCheckedMap[appId]) {
      toast.error('You must agree to the terms to accept the offer.');
      return;
    }

    try {
      await apiRespondToOffer(appId, { status });
      toast.success(status === 'offer_accepted' ? 'Offer Accepted! Waiting for Employer finalization.' : 'Offer Rejected.');
      setMyApplications(prev => prev.map(app => app._id === appId ? { ...app, status } : app));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit response');
    }
  };

  const toggleConsent = (appId) => {
    setConsentCheckedMap(prev => ({ ...prev, [appId]: !prev[appId] }));
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title="Job Board" subtitle="Explore open roles or track your successfully accepted applications" />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
        <button 
          onClick={() => setActiveTab('posted')}
          style={{ padding: '10px 20px', borderRadius: 12, fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'posted' ? '#1e293b' : 'transparent', color: activeTab === 'posted' ? '#fff' : '#64748b' }}
        >
          Posted Jobs
        </button>
        <button 
          onClick={() => setActiveTab('mine')}
          style={{ padding: '10px 20px', borderRadius: 12, fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === 'mine' ? '#1e293b' : 'transparent', color: activeTab === 'mine' ? '#fff' : '#64748b' }}
        >
          My Applications
        </button>
      </div>

      {activeTab === 'posted' && (
        <>
          {jobs.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 24, padding: '80px 20px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
              <div style={{ width: 80, height: 80, background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Briefcase size={40} color="#94a3b8" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>No Open Positions</h3>
              <p style={{ color: '#64748b', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>There are currently no active job postings from employers. Please check back later!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
              {jobs.filter(j => !appliedJobs.has(j._id)).length === 0 ? (
                <div style={{ gridColumn: '1 / -1', background: '#fff', borderRadius: 24, padding: '80px 20px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>You've Applied to Everything!</h3>
                  <p style={{ color: '#64748b', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>Track your active applications in the "My Applications" tab.</p>
                </div>
              ) : jobs.map(job => {
                if (appliedJobs.has(job._id)) return null;
                return (
                  <div key={job._id} style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: 24, display: 'flex', flexDirection: 'column', transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>
                        {job.employerId?.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: '0 0 2px' }}>{job.employerId?.name}</h4>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: 0 }}>Employer</p>
                      </div>
                    </div>

                    <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 16px', lineHeight: 1.3 }}>{job.title}</h3>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '6px 12px', borderRadius: 10 }}>
                        <MapPin size={14} /> <span style={{ textTransform: 'capitalize' }}>{job.type}</span>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '6px 12px', borderRadius: 10 }}>
                        <DollarSign size={14} /> {job.salary}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '6px 12px', borderRadius: 10 }}>
                        <Briefcase size={14} /> {job.experienceLevel}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#7e22ce', background: '#f3e8ff', padding: '6px 12px', borderRadius: 10 }}>
                        <Users size={14} /> {job.applicantCount || 0} applied
                      </span>
                    </div>

                    <div style={{ marginBottom: 24, flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', margin: '0 0 8px', textTransform: 'uppercase' }}>Required Skills</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {job.requiredSkills.map(s => (
                          <span key={s} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p style={{ fontSize: 14, color: '#475569', margin: '0 0 24px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {job.description}
                    </p>

                    <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                      <button 
                        onClick={() => openApplyModal(job)}
                        style={{ width: '100%', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', padding: '14px', borderRadius: 12, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}
                      >
                        <Send size={18} /> Apply Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'mine' && (
        <>
          {myApplications.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 24, padding: '80px 20px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
               <div style={{ width: 80, height: 80, background: '#ecfdf5', border: '2px solid #d1fae5', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle size={40} color="#10b981" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>No Applications Tracked</h3>
              <p style={{ color: '#64748b', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>You haven't applied to any jobs yet. Apply in the "Posted Jobs" tab to track your application progress here!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
              {myApplications.map(app => (
                <div key={app._id} style={{ background: '#fff', borderRadius: 20, border: app.status === 'hired' ? '2px solid #10b981' : app.status === 'offer_sent' ? '2px solid #3b82f6' : '1px solid #e2e8f0', padding: 32, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                  
                  {app.status === 'hired' && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: '#10b981', color: '#fff', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderBottomLeftRadius: 16 }}>
                      OFFICIALLY HIRED
                    </div>
                  )}

                  {app.status === 'offer_sent' && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: '#3b82f6', color: '#fff', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderBottomLeftRadius: 16 }}>
                      ACTION REQUIRED: OFFER
                    </div>
                  )}

                  {app.status === 'offer_accepted' && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: '#d97706', color: '#fff', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderBottomLeftRadius: 16 }}>
                      WAITING FOR EMPLOYER
                    </div>
                  )}

                  {app.status === 'pending' && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: '#fef3c7', color: '#d97706', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderBottomLeftRadius: 16 }}>
                      PENDING REVIEW
                    </div>
                  )}

                  {app.status === 'under_review' && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: '#e0e7ff', color: '#4338ca', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderBottomLeftRadius: 16 }}>
                      UNDER REVIEW
                    </div>
                  )}

                  {app.status === 'test_assigned' && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: '#cffafe', color: '#0369a1', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderBottomLeftRadius: 16 }}>
                      TECHNICAL TEST ASSIGNED
                    </div>
                  )}

                  {app.status === 'interview_scheduled' && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: '#fce7f3', color: '#be185d', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderBottomLeftRadius: 16 }}>
                      INTERVIEW SCHEDULED
                    </div>
                  )}

                  {app.status === 'interview_completed' && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: '#f3f4f6', color: '#4b5563', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderBottomLeftRadius: 16 }}>
                      INTERVIEW COMPLETED
                    </div>
                  )}

                  {app.status === 'rejected' && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: '#fee2e2', color: '#ef4444', fontSize: 12, fontWeight: 800, padding: '6px 16px', borderBottomLeftRadius: 16 }}>
                      APPLICATION DECLINED
                    </div>
                  )}

                  <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.3, marginTop: 10 }}>{app.jobId?.title}</h3>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '6px 12px', borderRadius: 10 }}>
                      <MapPin size={14} /> <span style={{ textTransform: 'capitalize' }}>{app.jobId?.type}</span>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '6px 12px', borderRadius: 10 }}>
                      <Briefcase size={14} /> {app.jobId?.experienceLevel}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <UserCircle2 size={22} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: '0 0 2px' }}>{app.employerId?.name}</h4>
                      <a href={`mailto:${app.employerId?.email}`} style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}>{app.employerId?.email}</a>
                    </div>
                  </div>

                  {app.status === 'test_assigned' && app.stageTracking && (
                    <div style={{ background: '#f0f9ff', borderRadius: 16, padding: 20, border: '1px solid #bae6fd', marginTop: 'auto' }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: '#0369a1', margin: '0 0 12px', textTransform: 'uppercase' }}>Technical Test</p>
                      
                      {app.stageTracking.testType === 'external' && (
                        <>
                          <p style={{ fontSize: 13, color: '#0c4a6e', lineHeight: 1.6, margin: '0 0 16px' }}>{app.stageTracking.testInstructions}</p>
                          {app.stageTracking.testLink && (
                            <a href={app.stageTracking.testLink} target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#0284c7', color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                              Take Assigned Test
                            </a>
                          )}
                        </>
                      )}

                      {app.stageTracking.testType === 'assignment' && (
                         <>
                          {app.stageTracking.assignmentStudentSubmissionUrl ? (
                            <div style={{ background: '#ecfdf5', padding: 12, borderRadius: 10, border: '1px solid #10b981', color: '#065f46', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <CheckCircle size={16} /> Assignment Submitted Successfully
                            </div>
                          ) : (
                            <>
                              <p style={{ fontSize: 13, color: '#0c4a6e', lineHeight: 1.6, margin: '0 0 16px', background: '#e0f2fe', padding: 12, borderRadius: 8 }}>{app.stageTracking.assignmentInstructions}</p>
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                const url = new FormData(e.target).get('assignmentUrl');
                                apiRespondToOffer(app._id, { testSubmission: { assignmentUrl: url } })
                                  .then(() => {
                                    toast.success('Assignment submitted!');
                                    fetchData();
                                  }).catch(() => toast.error('Failed to submit assignment.'));
                              }} style={{ display: 'flex', gap: 8 }}>
                                <input required name="assignmentUrl" type="url" placeholder="Paste GitHub Repo or Drive link..." style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #7dd3fc', outline: 'none', fontSize: 13 }} />
                                <button type="submit" style={{ background: '#0284c7', color: '#fff', padding: '0 16px', borderRadius: 10, fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer' }}>Submit</button>
                              </form>
                            </>
                          )}
                         </>
                      )}

                      {app.stageTracking.testType === 'internal_quiz' && (
                        <>
                          {(app.stageTracking.quizScoreSubmitted !== null && app.stageTracking.quizScoreSubmitted !== undefined) ? (
                            <div style={{ background: '#ecfdf5', padding: 12, borderRadius: 10, border: '1px solid #10b981', color: '#065f46', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <CheckCircle size={16} /> Internal Quiz Completed (Score: {app.stageTracking.quizScoreSubmitted}%)
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <p style={{ fontSize: 13, color: '#0c4a6e' }}>The employer has built an internal quiz for you to complete.</p>
                              <button onClick={() => {
                                setActiveQuizApp(app);
                                setQuizAnswers({});
                              }} style={{ width: 'fit-content', background: '#0284c7', color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <PlayCircle size={16} /> Take Internal Quiz Now
                              </button>
                            </div>
                          )}
                        </>
                      )}

                    </div>
                  )}

                  {app.status === 'interview_scheduled' && app.stageTracking && (
                    <div style={{ background: '#fdf2f8', borderRadius: 16, padding: 20, border: '1px solid #fbcfe8', marginTop: 'auto' }}>
                      {isInterviewRedAlertActive(app.stageTracking) && (
                        <div style={{ background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 10, padding: '10px 12px', color: '#991b1b', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <AlertTriangle size={16} /> LIVE NOW: Interview started. Join within 3 minutes.
                        </div>
                      )}
                      <p style={{ fontSize: 12, fontWeight: 800, color: '#be185d', margin: '0 0 12px', textTransform: 'uppercase' }}>Live Interview Set</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#831843', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={16} /> {new Date(app.stageTracking.interviewDate).toLocaleDateString()} at {app.stageTracking.interviewTime}
                      </p>
                      <p style={{ fontSize: 13, color: '#9d174d', margin: '0 0 16px' }}>Be prepared to join the secure video room precisely at the targeted time.</p>
                      
                      {app.stageTracking.interviewRoomId && (
                        <button onClick={() => handleJoinInterview(app)} style={{ width: '100%', background: '#db2777', color: '#fff', padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(219,39,119,0.3)' }}>
                          <Video size={18} /> Join Video Interview
                        </button>
                      )}
                    </div>
                  )}

                  {app.offerDetails && (app.status === 'offer_sent' || app.status === 'offer_accepted' || app.status === 'hired') && (
                    <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', marginTop: 'auto' }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', margin: '0 0 16px', textTransform: 'uppercase' }}>Formal Offer Terms</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}><DollarSign size={14} /> Salary</p>
                          <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>{app.offerDetails.salary}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> Start Date</p>
                          <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>{new Date(app.offerDetails.startDate).toLocaleDateString()}</p>
                        </div>
                        {app.offerDetails.duration && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} /> Duration</p>
                            <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>{app.offerDetails.duration}</p>
                          </div>
                        )}
                      </div>

                      <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={14} /> Terms & Conditions</p>
                      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: '0 0 16px' }}>{app.offerDetails.terms}</p>

                      {app.status === 'offer_sent' && (
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', background: '#fff', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                            <input type="checkbox" checked={!!consentCheckedMap[app._id]} onChange={() => toggleConsent(app._id)} style={{ width: 18, height: 18, marginTop: 2, accentColor: '#2563eb' }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', lineHeight: 1.4 }}>
                              I accept these terms and conditions, committing to the role as negotiated.
                            </span>
                          </label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleOfferResponse(app._id, 'offer_accepted')} disabled={!consentCheckedMap[app._id]} style={{ flex: 1, background: '#10b981', color: '#fff', padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 800, border: 'none', cursor: consentCheckedMap[app._id] ? 'pointer' : 'not-allowed', opacity: consentCheckedMap[app._id] ? 1 : 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <CheckCircle size={18} /> Accept Offer
                            </button>
                            <button onClick={() => handleOfferResponse(app._id, 'rejected')} style={{ background: '#fff', color: '#ef4444', padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 800, border: '1px solid #fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <XCircle size={18} /> Decline
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {['pending', 'under_review'].includes(app.status) && (
                    <div style={{ background: '#f8fafc', borderRadius: 16, padding: '16px 20px', border: '1px dashed #cbd5e1', marginTop: 'auto', textAlign: 'center' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Clock size={16} /> Awaiting Employer Progression
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Application Modal */}
      {selectedJob && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)' }} onClick={() => setSelectedJob(null)} />
          <div style={{ background: '#fff', width: '100%', maxWidth: 550, borderRadius: 24, position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Send size={20} color="#2563eb" /> Apply for Role
                </h2>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', margin: 0 }}>{selectedJob.title} at {selectedJob.employerId?.name}</p>
              </div>
              <button type="button" onClick={() => setSelectedJob(null)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', flexShrink: 0 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 32, overflowY: 'auto' }}>
              <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={16} /> Cover Letter <span style={{ color: '#94a3b8', fontWeight: 500 }}>(Optional)</span>
                  </label>
                  <textarea 
                    value={coverLetter} 
                    onChange={e => setCoverLetter(e.target.value)} 
                    placeholder="Introduce yourself and explain why you're a great fit for this role..." 
                    rows={4} 
                    style={{ width: '100%', padding: '16px', borderRadius: 16, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical', lineHeight: 1.5, background: '#f8fafc' }} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                     <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Code size={16} /> GitHub URL
                    </label>
                    <input 
                      type="url"
                      value={githubUrl} 
                      onChange={e => setGithubUrl(e.target.value)} 
                      placeholder="https://github.com/..." 
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#f8fafc' }} 
                    />
                  </div>
                  <div>
                     <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <LinkIcon size={16} /> Portfolio URL
                    </label>
                    <input 
                      type="url"
                      value={portfolioUrl} 
                      onChange={e => setPortfolioUrl(e.target.value)} 
                      placeholder="https://yourportfolio.com" 
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#f8fafc' }} 
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {resumeType === 'url' ? <LinkIcon size={16} /> : <UploadCloud size={16} />} 
                      Resume / CV <span style={{ color: '#94a3b8', fontWeight: 500 }}>(Optional)</span>
                    </label>
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: 8 }}>
                      <button type="button" onClick={() => setResumeType('url')} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, border: 'none', borderRadius: 6, cursor: 'pointer', background: resumeType === 'url' ? '#fff' : 'transparent', color: resumeType === 'url' ? '#2563eb' : '#64748b', boxShadow: resumeType === 'url' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>
                        🔗 Link
                      </button>
                      <button type="button" onClick={() => setResumeType('upload')} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, border: 'none', borderRadius: 6, cursor: 'pointer', background: resumeType === 'upload' ? '#fff' : 'transparent', color: resumeType === 'upload' ? '#2563eb' : '#64748b', boxShadow: resumeType === 'upload' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>
                        📄 Upload File
                      </button>
                    </div>
                  </div>

                  {resumeType === 'url' ? (
                    <input 
                      type="url"
                      value={resumeUrl} 
                      onChange={e => setResumeUrl(e.target.value)} 
                      placeholder="Resume url (Drive/Dropbox)..." 
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#f8fafc' }} 
                    />
                  ) : (
                    <input 
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={e => setResumeFile(e.target.files[0])} 
                      style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '2px dashed #cbd5e1', fontSize: 14, outline: 'none', background: '#f8fafc', cursor: 'pointer' }} 
                    />
                  )}
                </div>

                <div style={{ marginTop: 8 }}>
                  <button type="submit" disabled={submittingApply} style={{ width: '100%', background: '#2563eb', color: '#fff', padding: '16px', borderRadius: 14, fontWeight: 800, fontSize: 15, border: 'none', cursor: submittingApply ? 'not-allowed' : 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                    {submittingApply ? 'Submitting Application...' : 'Submit Application'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', margin: '12px 0 0' }}>Your profile details and badges will automatically be shared.</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- Internal Quiz Modal --- */}
      {activeQuizApp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)' }} onClick={() => setActiveQuizApp(null)} />
          <div style={{ background: '#fff', width: '100%', maxWidth: 650, borderRadius: 24, position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PlayCircle size={20} color="#2563eb" /> Technical Assessment
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Please complete all questions to submit your answers.</p>
              </div>
              <button type="button" onClick={() => setActiveQuizApp(null)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>

            <div style={{ padding: 32, overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {activeQuizApp.stageTracking.internalQuiz.map((q, idx) => (
                  <div key={idx} style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', margin: '0 0 16px' }}>{idx + 1}. {q.questionText}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {q.options.map((opt, optIdx) => (
                        <label key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: quizAnswers[idx] === optIdx ? '#eff6ff' : '#fff', border: `1px solid ${quizAnswers[idx] === optIdx ? '#3b82f6' : '#cbd5e1'}`, borderRadius: 10, transition: 'all 0.2s' }}>
                          <input type="radio" name={`question-${idx}`} checked={quizAnswers[idx] === optIdx} onChange={() => setQuizAnswers({...quizAnswers, [idx]: optIdx})} style={{ accentColor: '#2563eb', width: 16, height: 16 }} />
                          <span style={{ fontSize: 14, color: quizAnswers[idx] === optIdx ? '#1e40af' : '#334155', fontWeight: quizAnswers[idx] === optIdx ? 700 : 500 }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '24px 32px', borderTop: '1px solid #e2e8f0', background: '#fff', flexShrink: 0 }}>
               <button type="button" onClick={() => {
                 const questions = activeQuizApp.stageTracking.internalQuiz;
                 if (Object.keys(quizAnswers).length < questions.length) {
                   return toast.error('Please answer all questions before submitting.');
                 }
                 let correct = 0;
                 questions.forEach((q, idx) => {
                   if (quizAnswers[idx] === q.correctAnswerIndex) correct++;
                 });
                 const score = Math.round((correct / questions.length) * 100);
                 
                 apiRespondToOffer(activeQuizApp._id, { testSubmission: { score } })
                   .then(() => {
                     toast.success(`Assessment Completed! You scored ${score}%`);
                     setActiveQuizApp(null);
                     fetchData();
                   }).catch(() => toast.error('Failed to submit assessment'));
               }} style={{ width: '100%', background: '#2563eb', color: '#fff', padding: '16px', borderRadius: 14, fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                 Submit Final Answers <CheckCircle size={18} />
               </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default StudentJobBoard;
