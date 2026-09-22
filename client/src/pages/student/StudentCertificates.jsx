import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { apiGetMyCertificates, apiGetCertRequests, apiGetEnrolledCourses, apiRequestCertificate } from '../../api';
import { Award, ExternalLink, Clock, CheckCircle, XCircle, Plus, BookOpen, X, PlayCircle, Star, Users, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

const normalizeEnrolledCourses = (items) => {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item) => {
      if (!item) return null;
      if (item.courseId && typeof item.courseId === 'object') {
        return {
          ...item.courseId,
          enrolledAt: item.createdAt || item.courseId.createdAt,
        };
      }
      return item;
    })
    .filter((course) => course && course._id);
};

const StudentCertificates = () => {
  const [certs, setCerts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Request Modal State
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cRes, rRes, courseRes] = await Promise.all([
        apiGetMyCertificates(), 
        apiGetCertRequests(),
        apiGetEnrolledCourses()
      ]);
      setCerts(cRes.data.data || []);
      setRequests(rRes.data.data || []);
      setCourses(normalizeEnrolledCourses(courseRes.data.data || []));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load certificates data");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return toast.error("Please select a course");
    
    const course = courses.find(c => c._id === selectedCourseId);
    if (!course || !course.mentorId) return toast.error("Invalid course or mentor missing");

    setRequesting(true);
    try {
      await apiRequestCertificate({ courseId: selectedCourseId, mentorId: course.mentorId._id || course.mentorId });
      toast.success("Certificate request submitted!");
      setShowModal(false);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to request certificate. Make sure you have passed the final test.");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div></div></DashboardLayout>;

  // Filter out courses that already have certificates or pending requests
  const eligibleCourses = courses.filter(course => {
    const hasCert = certs.some(c => c.courseId?._id === course._id);
    const hasPending = requests.some(r => r.courseId?._id === course._id && r.status !== 'rejected');
    return !hasCert && !hasPending;
  });

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
        <PageHeader title="My Certificates" subtitle="View your official credentials and manage requests" />
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', padding: '14px 24px', borderRadius: 14, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
        >
          <Award size={20} /> Request Certificate
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {/* Issued Certificates */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={24} strokeWidth={2.5} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>Earned Certificates <span style={{ color: '#10b981' }}>({certs.length})</span></h2>
          </div>
          
          {certs.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 24, padding: '60px 20px', textAlign: 'center', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ width: 80, height: 80, background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', transform: 'rotate(5deg)' }}>
                <Award size={40} color="#cbd5e1" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>No Certificates Yet</h3>
              <p style={{ color: '#64748b', fontSize: 15, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>Complete all modules and pass the final test in any enrolled course to earn your official digital certificate.</p>
              <button 
                onClick={() => setShowModal(true)}
                style={{ background: '#fff', color: '#059669', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, border: '2px solid #a7f3d0', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Clock size={18} /> Check Eligibility
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {certs.map((cert) => (
                <div key={cert._id} style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: 110, background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', padding: 24, position: 'relative', borderBottom: '1px solid #a7f3d0' }}>
                    <Award size={40} color="#059669" />
                    <div style={{ position: 'absolute', bottom: -20, right: 24, width: 44, height: 44, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                      <CheckCircle size={24} color="#059669" />
                    </div>
                  </div>
                  <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: '0 0 8px', lineHeight: 1.3 }}>{cert.courseId?.title}</h3>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BookOpen size={16} color="#94a3b8" /> Signed by {cert.mentorId?.name}
                    </p>
                    <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} /> {new Date(cert.issuedAt).toLocaleDateString()}
                      </p>
                      <a
                        href={`${API_BASE_URL}/certificates/${cert._id}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 14, fontWeight: 700, color: '#059669', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        View Official <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pending Requests */}
        {requests.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={24} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>Pending Requests</h2>
            </div>
            
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {requests.map((req, idx) => (
                  <div key={req._id} style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottom: idx !== requests.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 48, height: 48, background: '#f1f5f9', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <Award size={24} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>{req.courseId?.title}</h4>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', margin: 0 }}>Mentor: {req.mentorId?.name}</p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', margin: 0 }}>{new Date(req.createdAt).toLocaleDateString()}</p>
                      
                      <div style={{ 
                        padding: '6px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                        ...(req.status === 'mentor_pending' || req.status === 'admin_pending' 
                            ? { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }
                            : req.status === 'approved' 
                            ? { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }
                            : { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' })
                      }}>
                        {req.status === 'mentor_pending' && <><Clock size={14} /> In Mentor Review</>}
                        {req.status === 'admin_pending' && <><Clock size={14} /> In Admin Review</>}
                        {req.status === 'approved' && <><CheckCircle size={14} /> Approved</>}
                        {req.status === 'rejected' && <><XCircle size={14} /> Rejected</>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-[fadeInUp_0.2s_ease-out]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-teal-50/60">
              <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                <Award size={20} className="text-emerald-500" /> Request Certificate
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-white shadow-sm border border-slate-200 rounded-full p-1.5 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-slate-500 text-[15px] mb-6 leading-relaxed">
                Finished all modules and passed the final test? Request your official digital certificate here.
              </p>

              <form onSubmit={handleRequestSubmit}>
                <div className="mb-5">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Eligible Course</label>
                  {eligibleCourses.length === 0 ? (
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                      <BookOpen size={28} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm font-medium">No eligible courses found.</p>
                      <p className="text-slate-400 text-xs mt-1">You either haven't enrolled yet, or already requested them all.</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <select 
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3.5 text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 appearance-none transition-all cursor-pointer"
                        required
                      >
                        <option value="" disabled>-- Select a Course --</option>
                        {eligibleCourses.map(course => (
                          <option key={course._id} value={course._id}>{course.title}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <PlayCircle size={18} className="rotate-90" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Mentor Details Card */}
                {selectedCourseId && (() => {
                  const course = courses.find(c => c._id === selectedCourseId);
                  const mentor = course?.mentorId;
                  if (!mentor) return null;
                  return (
                    <div className="mb-6 bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-200/80 rounded-2xl p-5 animate-[fadeInUp_0.2s_ease-out]">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Certificate Signed By</p>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-emerald-500/20 flex-shrink-0">
                          {mentor.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-extrabold text-slate-800 truncate">{mentor.name}</h4>
                          <p className="text-sm text-slate-500 truncate">{mentor.email}</p>
                          {mentor.rating > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} size={12} fill={i <= Math.round(mentor.rating) ? '#f59e0b' : 'none'} color={i <= Math.round(mentor.rating) ? '#f59e0b' : '#d1d5db'} />
                              ))}
                              <span className="text-xs text-slate-400 ml-1">({mentor.reviewCount || 0})</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {mentor.yearsOfExperience > 0 && (
                          <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-slate-100">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                              <Briefcase size={14} className="text-blue-500" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{mentor.yearsOfExperience}+ Years</p>
                              <p className="text-[10px] text-slate-400">Experience</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-slate-100">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <Award size={14} className="text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">Verified</p>
                            <p className="text-[10px] text-slate-400">Mentor</p>
                          </div>
                        </div>
                      </div>

                      {/* Skills */}
                      {(mentor.skills || []).length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {mentor.skills.slice(0, 6).map((skill, i) => (
                              <span key={i} className="px-2.5 py-1 bg-white text-emerald-700 text-[11px] font-semibold rounded-lg border border-emerald-100">
                                {skill}
                              </span>
                            ))}
                            {mentor.skills.length > 6 && (
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[11px] font-semibold rounded-lg">
                                +{mentor.skills.length - 6}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={requesting || eligibleCourses.length === 0}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {requesting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Plus size={18} /> Submit Request</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentCertificates;
