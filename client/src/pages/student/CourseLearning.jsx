import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import Modal from '../../components/Modal';
import { apiGetCourse, apiGetModules, apiGetProgress, apiMarkLesson, apiMarkModule, apiGetTests, apiSubmitTest, apiGetResults, apiRequestCertificate, apiGetCertRequests, apiCreateReport, apiCreateReview, apiCheckReview } from '../../api';
import toast from 'react-hot-toast';
import { CheckCircle, Circle, Play, FileText, BookOpen, ChevronDown, ChevronRight, Lock, Award, Flag, ExternalLink, RotateCcw, Star, Link as LinkIcon, Video, FlagTriangleRight } from 'lucide-react';

const typeIcon = { video: Play, note: FileText, pdf: FileText, link: LinkIcon };
const typeColor = { video: '#3b82f6', note: '#10b981', pdf: '#f59e0b', link: '#8b5cf6' };
const typeBg = { video: '#eff6ff', note: '#ecfdf5', pdf: '#fffbeb', link: '#f5f3ff' };

const RETRY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const CourseLearning = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [expandedModule, setExpandedModule] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [certRequest, setCertRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMsg, setReportMsg] = useState('');
  const [reportCategory, setReportCategory] = useState('harassment');
  const [activeTest, setActiveTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submittingTest, setSubmittingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  // Rating
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [videoProgressOk, setVideoProgressOk] = useState(false);
  const canReportMentor = !!course?.mentorId && !!progress;

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, mRes, pRes, tRes, rRes, crRes] = await Promise.all([
          apiGetCourse(courseId),
          apiGetModules(courseId),
          apiGetProgress(courseId),
          apiGetTests(courseId),
          apiGetResults(courseId),
          apiGetCertRequests(),
        ]);
        setCourse(cRes.data.data);
        setModules(mRes.data.data || []);
        setProgress(pRes.data.data);
        setTests(tRes.data.data || []);
        setResults(rRes.data.data || []);
        const myCertReq = crRes.data.data?.find((r) => r.courseId?._id === courseId);
        setCertRequest(myCertReq);
        if (mRes.data.data?.length > 0) setExpandedModule(mRes.data.data[0]._id);

        // Check if already reviewed
        if (cRes.data.data?.mentorId?._id) {
          try {
            const reviewCheck = await apiCheckReview({ mentorId: cRes.data.data.mentorId._id, courseId });
            setHasReviewed(reviewCheck.data.hasReviewed);
          } catch {
            console.error("not reviewd!")
          }
        }
      } catch {
        console.error("Failed to load course content");
        toast.error('Failed to load course content');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const isLessonDone = (lessonId) => progress?.completedLessons?.some((l) => l === lessonId || l._id === lessonId);
  const isModuleDone = (moduleId) => progress?.completedModules?.some((m) => m === moduleId || m._id === moduleId);

  const latestResultByTest = results.reduce((acc, result) => {
    const testKey = result?.testId?._id || result?.testId;
    if (!testKey) return acc;
    if (!acc[testKey]) {
      acc[testKey] = result;
      return acc;
    }

    const currentTs = new Date(acc[testKey].createdAt || 0).getTime();
    const candidateTs = new Date(result.createdAt || 0).getTime();
    if (candidateTs > currentTs) {
      acc[testKey] = result;
    }
    return acc;
  }, {});

  const getRetryInfo = (testId) => {
    if (!testId) return { locked: false, retryAt: null };
    const latest = latestResultByTest[testId];
    if (!latest || latest.passed) return { locked: false, retryAt: null };

    const retryAt = new Date(new Date(latest.createdAt).getTime() + RETRY_COOLDOWN_MS);
    const locked = Date.now() < retryAt.getTime();
    return { locked, retryAt };
  };

  // Strict gating: Module N+1 unlocked only if Module N test is passed (or Module N has no test and all lessons done)
  const isModuleUnlocked = (moduleIndex) => {
    if (moduleIndex === 0) return true;
    const prevMod = modules[moduleIndex - 1];
    if (!prevMod) return true;

    // Check if previous module is fully complete
    if (!isModuleDone(prevMod._id)) {
      // Check if prev module test is passed
      const prevTest = tests.find(t => t.moduleId === prevMod._id);
      if (prevTest) {
        const prevResult = results.find(r => (r.testId?._id || r.testId) === prevTest._id && r.passed);
        return !!prevResult;
      }
      // No test — just check if module is marked complete
      return false;
    }
    return true;
  };

  const isLessonUnlocked = (modIndex, lessonIndex) => {
    if (!isModuleUnlocked(modIndex)) return false;
    if (lessonIndex === 0) return true;
    
    const currentMod = modules[modIndex];
    if (!currentMod) return false;
    
    // Previous lesson must be completed to unlock the current one
    const prevLesson = currentMod.lessons[lessonIndex - 1];
    return prevLesson ? isLessonDone(prevLesson._id) : false;
  };

  const completedModulesCount = modules.filter((m) => isModuleDone(m._id)).length;
  const totalModules = modules.length;
  
  // Calculate granular progress based on individual lessons
  const totalLessons = modules.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0);
  const completedLessonsCount = modules.reduce((acc, mod) => {
    return acc + (mod.lessons?.filter(l => isLessonDone(l._id)).length || 0);
  }, 0);
  const progressPct = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
  
  const finalTest = tests.find((t) => t.type === 'final');
  const finalTestPassed = results.some((r) => (r.testId?._id || r.testId) === finalTest?._id && r.passed);
  const canRequestCert = progressPct === 100 && (!finalTest || finalTestPassed);

  const handleMarkLesson = async (lessonId) => {
    try {
      const res = await apiMarkLesson(courseId, lessonId);
      setProgress(res.data.data);
      toast.success('Lesson marked complete ✅');
    } catch { toast.error('Failed to mark lesson'); }
  };

  const handleMarkModule = async (moduleId) => {
    try {
      const res = await apiMarkModule(courseId, moduleId);
      setProgress(res.data.data);
      toast.success('Module completed! 🎉');
    } catch { toast.error('Failed to mark module'); }
  };

  const handleSubmitTest = async (e) => {
    e.preventDefault();
    if (Object.keys(answers).length < activeTest.questions.length) return toast.error('Answer all questions');
    setSubmittingTest(true);
    try {
      const res = await apiSubmitTest(activeTest._id, {
        answers: activeTest.questions.map((_, i) => parseInt(answers[i])),
        courseId,
      });
      setTestResult(res.data.data);
      const rRes = await apiGetResults(courseId);
      setResults(rRes.data.data || []);

      // Auto-complete module if test passed
      if (res.data.data.passed && activeTest.type === 'module' && activeTest.moduleId) {
        try {
          const pRes = await apiMarkModule(courseId, activeTest.moduleId);
          setProgress(pRes.data.data);
        } catch {
          console.error("this is the ultimate problem")

        }
      }
    } catch (err) {
      const apiMessage = err.response?.data?.message || 'Failed to submit';
      toast.error(apiMessage);

      if (err.response?.data?.code === 'QUIZ_RETRY_LOCKED') {
        setTestResult({
          passed: false,
          score: 0,
          total: activeTest?.questions?.length || 0,
          correct: 0,
          retryAvailableAt: err.response?.data?.data?.retryAt,
          lockedMessage: apiMessage,
          correctAnswers: null,
        });
      }
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleRetryTest = () => {
    setTestResult(null);
    setAnswers({});
  };

  const handleCertRequest = async () => {
    try {
      await apiRequestCertificate({ courseId, mentorId: course.mentorId._id });
      toast.success('Certificate request sent to your mentor!');
      setShowCertModal(false);
      const crRes = await apiGetCertRequests();
      setCertRequest(crRes.data.data?.find((r) => r.courseId?._id === courseId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    try {
      await apiCreateReport({
        courseId,
        contentId: activeLesson?._id || course._id,
        contentType: activeLesson ? 'lesson' : 'course',
        category: reportCategory,
        message: reportMsg,
      });
      toast.success('Report submitted. Admin will review it.');
      setShowReportModal(false);
      setReportMsg('');
      setReportCategory('harassment');
    } catch { toast.error('Failed to submit report'); }
  };

  const handleSubmitRating = async () => {
    if (ratingValue === 0) return toast.error('Please select a rating');
    try {
      await apiCreateReview({
        mentorId: course.mentorId._id,
        courseId,
        rating: ratingValue,
        comment: ratingComment,
      });
      toast.success('Thank you for your review! ⭐');
      setShowRatingModal(false);
      setHasReviewed(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) return <DashboardLayout><div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><div className="spinner" /></div></DashboardLayout>;
  if (!course) return <DashboardLayout><p style={{ color: '#6b7280', textAlign: 'center', padding: 60 }}>Course not found.</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, minHeight: 'calc(100vh - 128px)' }}>
        {/* ─── LEFT: Main Content ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Course Header */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #f3f4f6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#ecfdf5', color: '#15803d' }}>{course.category}</span>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#eff6ff', color: '#1d4ed8' }}>{course.level}</span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a2e24', margin: '0 0 8px 0' }}>{course.title}</h1>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{course.description}</p>
                {course.mentorId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #2d6a4f, #40916c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' }}>
                      {course.mentorId?.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{course.mentorId?.name}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <button
                  onClick={() => setShowReportModal(true)}
                  disabled={!canReportMentor}
                  title={canReportMentor ? 'Report mentor/content' : 'Available after enrollment is active'}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    border: '1px solid #fecaca', background: canReportMentor ? '#fff1f2' : '#f9fafb',
                    color: canReportMentor ? '#b91c1c' : '#9ca3af', cursor: canReportMentor ? 'pointer' : 'not-allowed',
                    padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                    boxShadow: canReportMentor ? '0 6px 16px rgba(244,63,94,0.10)' : 'none',
                  }}
                >
                  <FlagTriangleRight size={16} /> Report Mentor
                </button>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
                  {canReportMentor ? 'Only for active student-mentor work' : 'Available after enrollment'}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginTop: 20, padding: '16px 20px', background: '#f8faf9', borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Overall Progress</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#2d6a4f' }}>{progressPct}%</span>
              </div>
              <div style={{ height: 8, background: '#e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #2d6a4f, #52b788)', borderRadius: 8, transition: 'width 0.5s ease' }} />
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{completedLessonsCount}/{totalLessons} lessons completed • {completedModulesCount}/{totalModules} modules finished</p>
            </div>
          </div>

          {/* ─── Lesson Viewer / Theater ─── */}
          {activeLesson && (
            <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid #f3f4f6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              {activeLesson.type === 'video' ? (
                <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
                  {activeLesson.contentUrl.includes('youtube.com') || activeLesson.contentUrl.includes('youtu.be') ? (
                    <iframe
                      src={activeLesson.contentUrl.replace('watch?v=', 'embed/')}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allowFullScreen
                      title={activeLesson.title}
                    />
                  ) : (
                    <video
                      src={activeLesson.contentUrl}
                      controls
                      controlsList="nodownload"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      title={activeLesson.title}
                      onTimeUpdate={(e) => {
                        if (!videoProgressOk && e.target.duration > 0) {
                          if (e.target.currentTime / e.target.duration >= 0.75) {
                            setVideoProgressOk(true);
                          }
                        }
                      }}
                      onEnded={() => {
                        setVideoProgressOk(true);
                        if (!isLessonDone(activeLesson._id)) {
                          handleMarkLesson(activeLesson._id);
                        }
                      }}
                    />
                  )}
                </div>
              ) : null}
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: typeBg[activeLesson.type], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(() => { const Icon = typeIcon[activeLesson.type] || FileText; return <Icon size={18} color={typeColor[activeLesson.type]} />; })()}
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2e24', margin: 0 }}>{activeLesson.title}</h2>
                </div>

                {/* ─── PDF / Note embedded viewer ─── */}
                {activeLesson.type === 'pdf' && (
                  <div style={{ marginBottom: 16 }}>
                    {/* Action bar */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <a
                        href={activeLesson.contentUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #2d6a4f, #1a4731)', color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download PDF
                      </a>
                      <a
                        href={activeLesson.contentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, background: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: 13, textDecoration: 'none', border: '1px solid #e5e7eb' }}
                      >
                        <ExternalLink size={14} /> Open in New Tab
                      </a>
                    </div>
                    {/* Embedded PDF iframe */}
                    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1.5px solid #e5e7eb', background: '#f9fafb' }}>
                      <iframe
                        src={activeLesson.contentUrl + '#toolbar=1&navpanes=0'}
                        title={activeLesson.title}
                        style={{ width: '100%', height: 620, border: 'none', display: 'block' }}
                      />
                    </div>
                  </div>
                )}

                {/* ─── Note / text viewer ─── */}
                {activeLesson.type === 'note' && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <a
                        href={activeLesson.contentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #2d6a4f, #1a4731)', color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
                      >
                        <ExternalLink size={14} /> Open Full Note
                      </a>
                    </div>
                    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1.5px solid #e5e7eb', background: '#f9fafb' }}>
                      <iframe
                        src={activeLesson.contentUrl}
                        title={activeLesson.title}
                        style={{ width: '100%', height: 560, border: 'none', display: 'block' }}
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  </div>
                )}

                {/* ─── External link ─── */}
                {activeLesson.type === 'link' && (
                  <div style={{ marginBottom: 16 }}>
                    <a
                      href={activeLesson.contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #2d6a4f, #1a4731)', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
                    >
                      <ExternalLink size={16} /> Open Link
                    </a>
                  </div>
                )}

                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  {!isLessonDone(activeLesson._id) ? (() => {
                    const isVideo = activeLesson.type === 'video' && !activeLesson.contentUrl.includes('youtube');
                    const disabled = isVideo && !videoProgressOk;
                    return (
                      <button onClick={() => handleMarkLesson(activeLesson._id)}
                        disabled={disabled}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, 
                          background: disabled ? '#f3f4f6' : '#ecfdf5', 
                          color: disabled ? '#9ca3af' : '#15803d', 
                          fontWeight: 600, fontSize: 13, 
                          border: `1px solid ${disabled ? '#e5e7eb' : '#86efac'}`, 
                          cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                        <CheckCircle size={16} /> Mark as Complete
                      </button>
                    );
                  })() : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: '#ecfdf5', color: '#15803d', fontWeight: 600, fontSize: 13, border: '1px solid #86efac' }}>
                      ✅ Completed
                    </span>
                  )}
                  {activeLesson.type === 'video' && !isLessonDone(activeLesson._id) && !activeLesson.contentUrl.includes('youtube') && (
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
                      * Watch at least 75% of the video to unlock.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Test Section ─── */}
          {activeTest && (
            <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #f3f4f6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a2e24', marginBottom: 4 }}>📝 {activeTest.title}</h2>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                Pass mark: <strong style={{ color: '#2d6a4f' }}>{activeTest.passingScore || 70}%</strong> • {activeTest.questions?.length || 0} questions
              </p>

              {testResult ? (
                <div>
                  {/* Score Card */}
                  <div style={{
                    padding: 28, borderRadius: 16, textAlign: 'center', marginBottom: 24,
                    background: testResult.passed ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' : 'linear-gradient(135deg, #fef2f2, #fecaca)',
                    border: `2px solid ${testResult.passed ? '#86efac' : '#fca5a5'}`,
                  }}>
                    <p style={{ fontSize: 48, fontWeight: 800, margin: '0 0 4px 0', color: testResult.passed ? '#15803d' : '#dc2626' }}>
                      {testResult.score}%
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: testResult.passed ? '#15803d' : '#dc2626', margin: '0 0 8px 0' }}>
                      {testResult.passed ? '🎉 Passed!' : '😔 Not Passed'}
                    </p>
                    <p style={{ fontSize: 14, color: '#6b7280' }}>
                      {testResult.correct}/{testResult.total} correct answers
                    </p>

                    {!testResult.passed && testResult.retryAvailableAt && (
                      <p style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: '#92400e' }}>
                        Read again and try again after {formatDateTime(testResult.retryAvailableAt)}.
                      </p>
                    )}
                    {!testResult.passed && testResult.lockedMessage && (
                      <p style={{ marginTop: 8, fontSize: 12, color: '#b45309' }}>{testResult.lockedMessage}</p>
                    )}
                  </div>

                  {/* Correct Answers Review */}
                  {testResult.correctAnswers && (
                    <div style={{ marginBottom: 20 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e24', marginBottom: 12 }}>Answer Review</h3>
                      {activeTest.questions.map((q, i) => {
                        const ca = testResult.correctAnswers[i];
                        return (
                          <div key={i} style={{ padding: 16, borderRadius: 12, border: `1px solid ${ca?.isCorrect ? '#86efac' : '#fca5a5'}`, background: ca?.isCorrect ? '#f0fdf4' : '#fef2f2', marginBottom: 10 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#1a2e24', margin: '0 0 8px 0' }}>{i + 1}. {q.questionText}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {q.options.map((opt, j) => (
                                <div key={j} style={{
                                  padding: '6px 12px', borderRadius: 8, fontSize: 13,
                                  background: j === ca?.correctAnswer ? '#dcfce7' : j === ca?.studentAnswer && !ca?.isCorrect ? '#fee2e2' : 'transparent',
                                  color: '#374151', fontWeight: j === ca?.correctAnswer ? 600 : 400,
                                }}>
                                  {j === ca?.correctAnswer ? '✅ ' : j === ca?.studentAnswer && !ca?.isCorrect ? '❌ ' : '   '}
                                  {opt}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    {!testResult.passed && (!testResult.retryAvailableAt || Date.now() >= new Date(testResult.retryAvailableAt).getTime()) && (
                      <button onClick={handleRetryTest}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                        <RotateCcw size={16} /> Retry Test
                      </button>
                    )}
                    <button onClick={() => { setActiveTest(null); setTestResult(null); setAnswers({}); }}
                      style={{ padding: '12px 24px', borderRadius: 12, background: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitTest}>
                  {activeTest.questions.map((q, i) => (
                    <div key={i} style={{ padding: 20, borderRadius: 14, background: '#f8faf9', border: '1px solid #e5e7eb', marginBottom: 14 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1a2e24', marginBottom: 12 }}>{i + 1}. {q.questionText}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {q.options.map((opt, j) => (
                          <label key={j} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                            borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                            background: answers[i] == j ? '#ecfdf5' : '#fff',
                            border: `1.5px solid ${answers[i] == j ? '#2d6a4f' : '#e5e7eb'}`,
                          }}>
                            <input type="radio" name={`q${i}`} value={j}
                              onChange={() => setAnswers({ ...answers, [i]: j })}
                              style={{ accentColor: '#2d6a4f' }} />
                            <span style={{ fontSize: 13, color: '#374151' }}>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button type="submit" disabled={submittingTest}
                    style={{ padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg, #2d6a4f, #1a4731)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: submittingTest ? 'not-allowed' : 'pointer', opacity: submittingTest ? 0.7 : 1, transition: 'all 0.2s' }}>
                    {submittingTest ? 'Submitting...' : 'Submit Answers'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* ─── RIGHT: Sidebar ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Certificate / Rating Actions */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #f3f4f6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            {canRequestCert ? (
              <div>
                {certRequest ? (
                  <div style={{
                    padding: '14px 20px', borderRadius: 14, textAlign: 'center',
                    background: (certRequest.status === 'mentor_pending' || certRequest.status === 'admin_pending') ? '#fffbeb' : certRequest.status === 'approved' ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${(certRequest.status === 'mentor_pending' || certRequest.status === 'admin_pending') ? '#fde68a' : certRequest.status === 'approved' ? '#86efac' : '#fecaca'}`,
                  }}>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: (certRequest.status === 'mentor_pending' || certRequest.status === 'admin_pending') ? '#92400e' : certRequest.status === 'approved' ? '#15803d' : '#dc2626' }}>
                      {certRequest.status === 'mentor_pending' ? '⏳ Pending Mentor Approval' : certRequest.status === 'admin_pending' ? '⏳ Pending Admin Approval' : certRequest.status === 'approved' ? '🏆 Certificate Approved' : '❌ Certificate Rejected'}
                    </p>
                  </div>
                ) : (
                  <button onClick={() => setShowCertModal(true)}
                    style={{ width: '100%', padding: '14px 20px', borderRadius: 14, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(245,158,11,0.3)' }}>
                    <Award size={18} /> Request Certificate
                  </button>
                )}
                {/* Rate Mentor */}
                {!hasReviewed && (
                  <button onClick={() => setShowRatingModal(true)}
                    style={{ width: '100%', marginTop: 10, padding: '12px 20px', borderRadius: 14, background: '#fff', color: '#f59e0b', fontWeight: 700, fontSize: 13, border: '2px solid #fde68a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Star size={16} /> Rate Your Mentor
                  </button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 10 }}>
                <Lock size={24} color="#d1d5db" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                  Complete all modules{finalTest ? ' & pass the final test' : ''} to unlock certificate
                </p>
              </div>
            )}
          </div>

          {/* ─── Module List ─── */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #f3f4f6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1a2e24', margin: '0 0 16px 0' }}>📚 Course Content</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {modules.map((mod, modIndex) => {
                const modTest = tests.find((t) => t.moduleId === mod._id);
                const modTestResult = modTest ? latestResultByTest[modTest._id] : null;
                const unlocked = isModuleUnlocked(modIndex);
                const done = isModuleDone(mod._id);
                const allLessonsDone = (mod.lessons || []).every(l => isLessonDone(l._id));

                return (
                  <div key={mod._id} style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${done ? '#86efac' : unlocked ? '#e5e7eb' : '#f3f4f6'}`, opacity: unlocked ? 1 : 0.5, transition: 'all 0.2s' }}>
                    <button
                      onClick={() => unlocked && setExpandedModule(expandedModule === mod._id ? null : mod._id)}
                      disabled={!unlocked}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                        background: done ? '#f0fdf4' : '#fafbfc', border: 'none', cursor: unlocked ? 'pointer' : 'not-allowed',
                        textAlign: 'left', transition: 'all 0.2s',
                      }}
                    >
                      {!unlocked ? <Lock size={15} color="#d1d5db" /> : done ? <CheckCircle size={15} color="#22c55e" /> : <Circle size={15} color="#d1d5db" />}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: unlocked ? '#1a2e24' : '#9ca3af', margin: 0 }}>
                          {mod.title}
                        </p>
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
                          {(mod.lessons || []).length} lessons{modTest ? ' + quiz' : ''}
                        </p>
                      </div>
                      {unlocked && (expandedModule === mod._id ? <ChevronDown size={14} color="#9ca3af" /> : <ChevronRight size={14} color="#9ca3af" />)}
                    </button>

                    {expandedModule === mod._id && unlocked && (
                      <div style={{ background: '#fafbfc', borderTop: '1px solid #f3f4f6' }}>
                        {(mod.lessons || []).map((lesson, lessonIndex) => {
                          const Icon = typeIcon[lesson.type] || FileText;
                          const done = isLessonDone(lesson._id);
                          const lessonUnlocked = isLessonUnlocked(modIndex, lessonIndex);
                          return (
                            <button key={lesson._id}
                              onClick={() => { if(lessonUnlocked) { setActiveLesson(lesson); setVideoProgressOk(false); setActiveTest(null); setTestResult(null); } }}
                              disabled={!lessonUnlocked}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 10px 24px',
                                border: 'none', background: activeLesson?._id === lesson._id ? '#ecfdf5' : 'transparent',
                                cursor: lessonUnlocked ? 'pointer' : 'not-allowed', textAlign: 'left', transition: 'all 0.15s',
                                borderLeft: activeLesson?._id === lesson._id ? '3px solid #2d6a4f' : '3px solid transparent',
                                opacity: lessonUnlocked ? 1 : 0.6,
                              }}
                            >
                              {!lessonUnlocked ? <Lock size={13} color="#d1d5db" /> : done ? <CheckCircle size={13} color="#22c55e" /> : <Icon size={13} color={typeColor[lesson.type]} />}
                              <span style={{ fontSize: 12, color: done ? '#6b7280' : '#374151', flex: 1, fontWeight: 500, textDecoration: done ? 'none' : 'none' }}>{lesson.title}</span>
                              <span style={{ fontSize: 10, color: '#d1d5db', textTransform: 'uppercase', fontWeight: 600 }}>{lesson.type}</span>
                            </button>
                          );
                        })}

                        {/* Module Quiz */}
                        {modTest && (() => {
                          const quizUnlocked = allLessonsDone;
                          const retryInfo = getRetryInfo(modTest._id);
                          return (
                            <button
                              onClick={() => {
                                if (quizUnlocked && !retryInfo.locked) {
                                  setActiveTest(modTest);
                                  setActiveLesson(null);
                                  setTestResult(null);
                                  setAnswers({});
                                }
                              }}
                              disabled={!quizUnlocked || retryInfo.locked}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 10px 24px',
                                border: 'none', cursor: quizUnlocked && !retryInfo.locked ? 'pointer' : 'not-allowed', textAlign: 'left', transition: 'all 0.15s',
                                background: activeTest?._id === modTest._id ? '#fffbeb' : 'transparent',
                                borderLeft: activeTest?._id === modTest._id ? '3px solid #f59e0b' : '3px solid transparent',
                                opacity: quizUnlocked && !retryInfo.locked ? 1 : 0.6,
                              }}
                            >
                              {!quizUnlocked || retryInfo.locked ? <Lock size={13} color="#d1d5db" /> : <FileText size={13} color="#f59e0b" />}
                              <span style={{ fontSize: 12, color: '#92400e', flex: 1, fontWeight: 600 }}>📝 Module Quiz</span>
                              {modTestResult?.passed && <span style={{ fontSize: 10, color: '#15803d', fontWeight: 700 }}>✅ {modTestResult.score}%</span>}
                              {modTestResult && !modTestResult.passed && <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 700 }}>❌ {modTestResult.score}%</span>}
                              {retryInfo.locked && <span style={{ fontSize: 10, color: '#92400e', fontWeight: 700 }}>Retry {formatDateTime(retryInfo.retryAt)}</span>}
                            </button>
                          );
                        })()}

                        {/* Auto-complete: mark done if all lessons done + test passed (or no test) */}
                        {!done && allLessonsDone && (!modTest || modTestResult?.passed) && (
                          <button onClick={() => handleMarkModule(mod._id)}
                            style={{ width: '100%', padding: '8px 14px', border: 'none', background: '#ecfdf5', color: '#15803d', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                            ✓ Mark Module as Complete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Final Test */}
            {finalTest && (
              (() => {
                const finalRetryInfo = getRetryInfo(finalTest._id);
                return (
              <button
                onClick={() => {
                  if (!finalRetryInfo.locked) {
                    setActiveTest(finalTest);
                    setActiveLesson(null);
                    setTestResult(null);
                    setAnswers({});
                  }
                }}
                disabled={finalRetryInfo.locked}
                style={{
                  width: '100%', marginTop: 14, padding: '14px 16px', borderRadius: 14,
                  border: `2px solid ${finalTestPassed ? '#86efac' : '#fde68a'}`,
                  background: finalTestPassed ? '#ecfdf5' : '#fffbeb',
                  color: finalTestPassed ? '#15803d' : '#92400e',
                  fontSize: 14, fontWeight: 700, cursor: finalRetryInfo.locked ? 'not-allowed' : 'pointer', textAlign: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: finalRetryInfo.locked ? 0.6 : 1,
                }}
              >
                📝 {finalTestPassed ? '✅ Final Test Passed' : finalRetryInfo.locked ? `Read again - retry ${formatDateTime(finalRetryInfo.retryAt)}` : 'Take Final Test'}
              </button>
                );
              })()
            )}
          </div>
        </div>
      </div>

      {/* ─── Modals ─── */}
      {showCertModal && (
        <Modal title="Request Certificate" onClose={() => setShowCertModal(false)}>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🏆</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1a2e24', marginBottom: 8 }}>Congratulations!</h3>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>You've completed <strong>{course.title}</strong>. Your mentor will review and approve your certificate.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowCertModal(false)} style={{ flex: 1, padding: '12px 20px', borderRadius: 12, background: '#f3f4f6', color: '#374151', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={handleCertRequest} style={{ flex: 1, padding: '12px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 14 }}>Send Request</button>
            </div>
          </div>
        </Modal>
      )}

      {showReportModal && (
        <Modal title="Report Content" onClose={() => setShowReportModal(false)}>
          <form onSubmit={handleReport} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13, color: '#6b7280' }}>Choose a report reason so the admin can review it correctly.</p>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Report Reason</label>
              <select
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="input-field"
              >
                <option value="harassment">Harassment</option>
                <option value="spam">Spam</option>
                <option value="abuse">Abuse</option>
                <option value="inappropriate_content">Inappropriate Content</option>
                <option value="cheating">Cheating</option>
                <option value="fake_information">Fake Information</option>
                <option value="other">Other</option>
              </select>
            </div>
            <textarea rows={4} placeholder="Describe the issue..." value={reportMsg} onChange={(e) => setReportMsg(e.target.value)} required
              style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 14, resize: 'none', outline: 'none', fontFamily: "'Inter', sans-serif" }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setShowReportModal(false)} style={{ flex: 1, padding: '12px 20px', borderRadius: 12, background: '#f3f4f6', color: '#374151', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: '12px 20px', borderRadius: 12, background: '#dc2626', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 14 }}>Submit Report</button>
            </div>
          </form>
        </Modal>
      )}

      {showRatingModal && (
        <Modal title="Rate Your Mentor" onClose={() => setShowRatingModal(false)}>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
              How was your experience with <strong style={{ color: '#1a2e24' }}>{course.mentorId?.name}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => setRatingValue(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, transition: 'transform 0.2s', transform: i <= ratingValue ? 'scale(1.2)' : 'scale(1)' }}>
                  <Star size={32} fill={i <= ratingValue ? '#f59e0b' : 'none'} color={i <= ratingValue ? '#f59e0b' : '#d1d5db'} />
                </button>
              ))}
            </div>
            <textarea rows={3} placeholder="Share your experience (optional)..." value={ratingComment} onChange={e => setRatingComment(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 14, resize: 'none', outline: 'none', fontFamily: "'Inter', sans-serif", marginBottom: 16 }} />
            <button onClick={handleSubmitRating}
              style={{ width: '100%', padding: '14px 20px', borderRadius: 14, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
              Submit Rating ⭐
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default CourseLearning;
