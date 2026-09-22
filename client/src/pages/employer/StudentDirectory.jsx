import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { apiGetCertifiedStudents } from '../../api';
import { Award, Search, ExternalLink, BadgeCheck, X, User, Mail, BookOpen, Quote } from 'lucide-react';

const StudentDirectory = () => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    apiGetCertifiedStudents()
      .then((res) => setCerts(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Group by student
  const studentsMap = {};
  certs.forEach((cert) => {
    const sid = cert.studentId?._id;
    if (!sid) return;
    if (!studentsMap[sid]) {
      studentsMap[sid] = { student: cert.studentId, certs: [] };
    }
    studentsMap[sid].certs.push(cert);
  });

  const studentList = Object.values(studentsMap).filter((s) =>
    s.student?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title="Talent Pool" subtitle={`${studentList.length} certified students available`} />

      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input-field pl-9" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {studentList.length === 0 ? (
        <div className="glass p-12 text-center">
          <Award size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No certified students yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studentList.map(({ student, certs: studentCerts }) => (
            <button 
              key={student._id} 
              onClick={() => setSelectedStudent({ student, certs: studentCerts })}
              className="glass p-5 hover:border-emerald-500/50 hover:bg-emerald-50/30 transition-all w-full text-left flex flex-col h-full ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl cursor-pointer group relative"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink size={16} className="text-slate-400" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xl font-bold text-white shadow-sm flex-shrink-0">
                  {student.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                    {student.name}
                    <BadgeCheck size={16} className="text-blue-400 flex-shrink-0" />
                  </h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">SkillBridge Certified</p>
                </div>
              </div>

              {student.bio && <p className="text-[13px] text-slate-600 mb-3 line-clamp-2 leading-relaxed">{student.bio}</p>}

              {student.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {student.skills.map((skill) => (
                    <span key={skill} className="bg-slate-100 text-slate-600 border border-slate-200 py-1 px-2.5 rounded-lg text-xs font-semibold">{skill}</span>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 mt-auto w-full">
                <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Acquired Certificates ({studentCerts.length})</p>
                <div className="space-y-1.5">
                  {studentCerts.slice(0, 2).map((cert) => (
                    <div key={cert._id} className="flex items-center gap-2">
                      <Award size={13} className="text-emerald-500 flex-shrink-0" />
                      <span className="text-[13px] font-medium text-slate-700 truncate">{cert.courseId?.title}</span>
                    </div>
                  ))}
                  {studentCerts.length > 2 && (
                    <p className="text-[11px] text-slate-500 font-medium">+{studentCerts.length - 2} more...</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Profile Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSelectedStudent(null)} />
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 sm:p-8 flex items-start gap-5 bg-slate-800/50 border-b border-slate-700/50">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-xl shadow-emerald-900/20 flex-shrink-0 border-4 border-slate-800">
                {selectedStudent.student.name?.[0]}
              </div>
              <div className="flex-1 mt-1 sm:mt-2">
                <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{selectedStudent.student.name}</h2>
                  <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full text-xs font-bold border border-blue-500/20">
                    <BadgeCheck size={14} /> Verified Profile
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                  <Award size={14} className="text-emerald-500" /> SkillBridge Certified Candidate
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="w-10 h-10 rounded-full bg-slate-700/50 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              
              {selectedStudent.student.bio && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <User size={14} /> Professional Summary
                  </h3>
                  <div className="bg-slate-700/20 rounded-2xl p-5 border border-slate-700/50 relative">
                    <Quote size={24} className="text-slate-600 absolute top-4 left-4 opacity-50" />
                    <p className="text-slate-300 text-sm leading-relaxed pl-8 relative z-10">{selectedStudent.student.bio}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <BookOpen size={14} /> Verified Skills
                </h3>
                {selectedStudent.student.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.student.skills.map((skill) => (
                      <span key={skill} className="bg-slate-700/40 text-slate-200 border border-slate-600 py-1.5 px-3 rounded-xl text-sm font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">No skills listed yet.</p>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Award size={14} /> Platform Certificates ({selectedStudent.certs.length})
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {selectedStudent.certs.map((cert) => (
                    <div key={cert._id} className="bg-slate-700/30 border border-slate-600/50 p-4 rounded-2xl flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-slate-200 text-sm leading-tight flex-1">{cert.courseId?.title}</h4>
                        <Award size={16} className="text-emerald-400 flex-shrink-0" />
                      </div>
                      <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-600/30">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">SkillBridge Issued</span>
                        <a 
                          href={`${API_BASE_URL}/certificates/${cert._id}/view`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors"
                        >
                          View Credential <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDirectory;
