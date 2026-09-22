import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { apiGetCourses, apiGetCourse, apiApproveCourse, apiRejectCourse, apiDeleteCourse } from '../../api';
import toast from 'react-hot-toast';
import { BookOpen, Check, X, Trash2, Search, Layers, Clock, User, Eye, ExternalLink, Play, FileText, Link as LinkIcon } from 'lucide-react';

const levelColor = { Beginner: '#10b981', Intermediate: '#f59e0b', Advanced: '#ef4444' };
const levelBg = { Beginner: '#ecfdf5', Intermediate: '#fffbeb', Advanced: '#fef2f2' };
const lessonMeta = {
  video: { icon: Play, color: '#2563eb', bg: '#eff6ff' },
  note: { icon: FileText, color: '#059669', bg: '#ecfdf5' },
  pdf: { icon: FileText, color: '#d97706', bg: '#fffbeb' },
  link: { icon: LinkIcon, color: '#7c3aed', bg: '#f5f3ff' },
};

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actioning, setActioning] = useState(null);
  const [viewingCourse, setViewingCourse] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await apiGetCourses();
      setCourses(res.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    setActioning(id + 'approve');
    try { await apiApproveCourse(id); toast.success('Course approved!'); await load(); }
    catch { toast.error('Failed'); }
    finally { setActioning(null); }
  };

  const handleReject = async (id) => {
    setActioning(id + 'reject');
    try { await apiRejectCourse(id); toast.success('Course rejected'); await load(); }
    catch { toast.error('Failed'); }
    finally { setActioning(null); }
  };

  const handleDelete = async (id) => {
    try { await apiDeleteCourse(id); toast.success('Course deleted'); await load(); }
    catch { toast.error('Failed to delete course'); }
    finally { setConfirmDelete(null); }
  };

  const openCourseView = async (id) => {
    setViewLoading(true);
    try {
      const res = await apiGetCourse(id);
      setViewingCourse(res.data.data || null);
    } catch {
      toast.error('Failed to load course content');
    } finally {
      setViewLoading(false);
    }
  };

  const closeCourseView = () => setViewingCourse(null);

  const filtered = courses.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === 'approved' && !c.isApproved) return false;
    if (statusFilter === 'pending' && c.isApproved) return false;
    return true;
  });

  const pendingCount = courses.filter(c => !c.isApproved).length;
  const approvedCount = courses.filter(c => c.isApproved).length;

  if (loading) return <DashboardLayout><div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title="Course Management" subtitle={`${courses.length} total courses`} />

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 22px', border: '1px solid #f3f4f6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 4px 0' }}>Total Courses</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#1a2e24', margin: 0 }}>{courses.length}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 22px', border: '1px solid #f3f4f6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 4px 0' }}>Approved</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#15803d', margin: 0 }}>{approvedCount}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 22px', border: '1px solid #f3f4f6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 4px 0' }}>Pending</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b', margin: 0 }}>{pendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '10px 16px' }}>
          <Search size={16} color="#9ca3af" />
          <input placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 14, color: '#374151', width: '100%', background: 'none', fontFamily: "'Inter', sans-serif" }} />
        </div>
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 14, background: '#f3f4f6' }}>
          {[{ value: '', label: 'All' }, { value: 'pending', label: '⏳ Pending' }, { value: 'approved', label: '✅ Approved' }].map(opt => (
            <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
              style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: statusFilter === opt.value ? '#fff' : 'transparent',
                color: statusFilter === opt.value ? '#1a2e24' : '#6b7280',
                boxShadow: statusFilter === opt.value ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Course Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.map((course) => (
          <div key={course._id} style={{
            background: '#fff', borderRadius: 18, padding: '20px 24px',
            border: `1px solid ${course.isApproved ? '#f3f4f6' : '#fde68a'}`,
            boxShadow: course.isApproved ? '0 2px 8px rgba(0,0,0,0.04)' : '0 2px 12px rgba(245,158,11,0.08)',
            display: 'flex', alignItems: 'center', gap: 18, transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = course.isApproved ? '0 2px 8px rgba(0,0,0,0.04)' : '0 2px 12px rgba(245,158,11,0.08)'}
          >
            {/* Course Thumbnail/Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: 16, flexShrink: 0,
              background: course.thumbnail
                ? `url(${course.thumbnail}) center/cover`
                : 'linear-gradient(135deg, #2d6a4f, #40916c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!course.thumbnail && <BookOpen size={26} color="rgba(255,255,255,0.7)" />}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e24', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title}</h3>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0,
                  background: course.isApproved ? '#ecfdf5' : '#fffbeb',
                  color: course.isApproved ? '#15803d' : '#92400e',
                }}>
                  {course.isApproved ? '✅ Approved' : '⏳ Pending'}
                </span>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0,
                  background: levelBg[course.level] || '#f3f4f6',
                  color: levelColor[course.level] || '#374151',
                }}>
                  {course.level}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#6b7280' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} /> {course.mentorId?.name || 'Unknown'}</span>
                <span>{course.category}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Layers size={12} /> {course.modules?.length || 0} modules</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {course.durationWeeks || 4} weeks</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button onClick={() => openCourseView(course._id)} disabled={viewLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: 13, border: '1px solid #bfdbfe', cursor: 'pointer', transition: 'all 0.2s' }}>
                <Eye size={14} /> View Content
              </button>
              {!course.isApproved && (
                <button onClick={() => handleApprove(course._id)} disabled={!!actioning}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: '#ecfdf5', color: '#15803d', fontWeight: 600, fontSize: 13, border: '1px solid #86efac', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <Check size={14} /> Approve
                </button>
              )}
              {course.isApproved && (
                <button onClick={() => handleReject(course._id)} disabled={!!actioning}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: '#fffbeb', color: '#92400e', fontWeight: 600, fontSize: 13, border: '1px solid #fde68a', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <X size={14} /> Revoke
                </button>
              )}
              <button onClick={() => setConfirmDelete({ id: course._id, title: course.title })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 8, borderRadius: 8, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 48, textAlign: 'center', border: '1px solid #f3f4f6' }}>
            <BookOpen size={40} style={{ margin: '0 auto 12px', color: '#d1d5db' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#6b7280' }}>No courses found</p>
          </div>
        )}
      </div>

      {viewingCourse && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={closeCourseView}>
          <div style={{ width: 'min(980px, 96vw)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 20, border: '1px solid #e5e7eb', boxShadow: '0 24px 60px rgba(15,23,42,0.22)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #eef1f4', background: '#fff' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 2px 0' }}>Course Review</p>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a2e24' }}>{viewingCourse.title}</h3>
              </div>
              <button onClick={closeCourseView} style={{ border: 'none', background: '#f3f4f6', color: '#374151', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>

            <div style={{ padding: 22, display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #eef1f4', borderRadius: 12, padding: '10px 12px' }}><p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Mentor</p><p style={{ margin: '4px 0 0', fontSize: 13, color: '#1f2937', fontWeight: 700 }}>{viewingCourse.mentorId?.name || 'Unknown'}</p></div>
                <div style={{ background: '#f8fafc', border: '1px solid #eef1f4', borderRadius: 12, padding: '10px 12px' }}><p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Category</p><p style={{ margin: '4px 0 0', fontSize: 13, color: '#1f2937', fontWeight: 700 }}>{viewingCourse.category || 'General'}</p></div>
                <div style={{ background: '#f8fafc', border: '1px solid #eef1f4', borderRadius: 12, padding: '10px 12px' }}><p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Level</p><p style={{ margin: '4px 0 0', fontSize: 13, color: '#1f2937', fontWeight: 700 }}>{viewingCourse.level || 'Beginner'}</p></div>
                <div style={{ background: '#f8fafc', border: '1px solid #eef1f4', borderRadius: 12, padding: '10px 12px' }}><p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Modules</p><p style={{ margin: '4px 0 0', fontSize: 13, color: '#1f2937', fontWeight: 700 }}>{viewingCourse.modules?.length || 0}</p></div>
              </div>

              <div style={{ background: '#fbfdff', border: '1px solid #eef1f4', borderRadius: 14, padding: '14px 16px' }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Course Description</p>
                <p style={{ margin: 0, fontSize: 14, color: '#4b5563', lineHeight: 1.65 }}>{viewingCourse.description || 'No description provided.'}</p>
              </div>

              <div>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: '#374151', fontWeight: 700 }}>Uploaded Content</p>
                {(viewingCourse.modules?.length || 0) === 0 ? (
                  <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: 14, color: '#9a3412', fontSize: 13, fontWeight: 600 }}>
                    This course has no modules/lessons uploaded yet.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {(viewingCourse.modules || []).map((mod, modIdx) => (
                      <div key={mod._id || modIdx} style={{ border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
                        <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>Module {modIdx + 1}: {mod.title}</span>
                          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{mod.lessons?.length || 0} lessons</span>
                        </div>

                        <div style={{ padding: 10, display: 'grid', gap: 8 }}>
                          {(mod.lessons || []).length === 0 ? (
                            <div style={{ fontSize: 12, color: '#9ca3af', padding: '4px 6px' }}>No lessons in this module yet.</div>
                          ) : (
                            (mod.lessons || []).map((lesson, lessonIdx) => {
                              const meta = lessonMeta[lesson.type] || lessonMeta.note;
                              const Icon = meta.icon;
                              return (
                                <div key={lesson._id || lessonIdx} style={{ border: '1px solid #f1f5f9', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 32, height: 32, borderRadius: 9, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={14} color={meta.color} />
                                  </div>
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: 13, color: '#1f2937', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lesson.title}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>{(lesson.type || 'note').toUpperCase()} {lesson.duration ? `• ${lesson.duration}` : ''}</p>
                                  </div>
                                  {lesson.contentUrl ? (
                                    <a href={lesson.contentUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#1d4ed8', textDecoration: 'none', padding: '6px 9px', borderRadius: 8, border: '1px solid #bfdbfe', background: '#eff6ff' }}>
                                      Open <ExternalLink size={12} />
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>No URL</span>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewLoading && (
        <div style={{ position: 'fixed', right: 24, top: 20, background: '#111827', color: '#fff', borderRadius: 12, padding: '10px 14px', zIndex: 80, boxShadow: '0 10px 24px rgba(0,0,0,0.2)', fontSize: 13, fontWeight: 600 }}>
          Loading course content...
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {confirmDelete && (
        <Modal title="Delete Course" onClose={() => setConfirmDelete(null)}>
          <div style={{ textAlign: 'center', padding: '10px 0 20px 0' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={30} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2e24', margin: '0 0 8px 0' }}>Are you sure?</h3>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              You are about to permanently delete the course <strong>"{confirmDelete.title}"</strong>. This action cannot be undone.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '10px 0', border: '1px solid #d1d5db', background: '#fff', color: '#374151', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button type="button" onClick={() => handleDelete(confirmDelete.id)} style={{ flex: 1, padding: '10px 0', border: 'none', background: '#ef4444', color: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              Yes, Delete
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default AdminCourses;
