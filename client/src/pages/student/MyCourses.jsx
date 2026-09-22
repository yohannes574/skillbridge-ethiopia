import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { apiGetEnrolledCourses, apiGetProgress } from '../../api';
import { BookOpen, ChevronRight, Clock, ArrowRight, Layers, Search, CheckCircle, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const levelColor = { Beginner: '#2d6a4f', Intermediate: '#1565c0', Advanced: '#e65100' };
const levelBg = { Beginner: '#f0faf3', Intermediate: '#eff6ff', Advanced: '#fff8f0' };
const catColors = ['#2d6a4f', '#1565c0', '#e65100', '#6a1b9a', '#00695c', '#ad1457'];

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

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [progressMap, setProgressMap] = useState({}); // courseId -> { pct, completedModules, totalModules }
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGetEnrolledCourses();
        const enrolled = normalizeEnrolledCourses(res.data.data || []);
        setCourses(enrolled);

        // Fetch real progress for each course in parallel
        const progressResults = await Promise.allSettled(
          enrolled.map(c => apiGetProgress(c._id))
        );
        const map = {};
        enrolled.forEach((c, i) => {
          const result = progressResults[i];
          if (result.status === 'fulfilled') {
            const p = result.value.data.data;
            const totalModules = c.modules?.length || 0;
            const completedModules = p?.completedModules?.length || 0;
            map[c._id] = {
              pct: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
              completedModules,
              totalModules,
            };
          } else {
            map[c._id] = { pct: 0, completedModules: 0, totalModules: c.modules?.length || 0 };
          }
        });
        setProgressMap(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = filter === 'all' ? courses : courses.filter(c => c.level === filter);
  const completedCount = Object.values(progressMap).filter(p => p.pct === 100).length;

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <div className="spinner" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a2e24', letterSpacing: '-0.5px' }}>My Courses</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>Continue your learning journey</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {['all', 'Beginner', 'Intermediate', 'Advanced'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: filter === f ? '#1a2e24' : '#f3f4f6',
              color: filter === f ? '#fff' : '#6b7280',
            }}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Mini Row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Courses', value: courses.length, color: '#2d6a4f', icon: BookOpen },
          { label: 'Completed', value: completedCount, color: '#15803d', icon: CheckCircle },
          { label: 'In Progress', value: courses.length - completedCount, color: '#1565c0', icon: Clock },
        ].map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
            borderRadius: 14, background: '#fff', border: '1px solid #eef1f4',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={16} color={s.color} />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#1a2e24', letterSpacing: '-0.5px' }}>{s.value}</p>
              <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Course Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, border: '1px solid #eef1f4' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0faf3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BookOpen size={32} color="#2d6a4f" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2e24', marginBottom: 8 }}>No enrolled courses</h3>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>
            You must request and get accepted by a mentor before accessing course content.
          </p>
          <Link to="/student/browse" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #2d6a4f, #1a4731)', color: '#fff',
            padding: '12px 28px', borderRadius: 50, fontSize: 14, fontWeight: 700,
            textDecoration: 'none', boxShadow: '0 4px 16px rgba(45,106,79,0.3)',
          }}>
            <Search size={16} /> Browse Courses
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filtered.map((course, idx) => {
            const prog = progressMap[course._id] || { pct: 0, completedModules: 0, totalModules: course.modules?.length || 0 };
            const { pct, completedModules, totalModules } = prog;
            const isComplete = pct === 100;
            const color = isComplete ? '#15803d' : catColors[idx % catColors.length];
            return (
              <Link key={course._id} to={`/student/course/${course._id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  background: '#fff', borderRadius: 20, overflow: 'hidden',
                  border: `1px solid ${isComplete ? '#86efac' : '#eef1f4'}`, transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 20px 50px ${color}18`; e.currentTarget.style.borderColor = `${color}40`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = isComplete ? '#86efac' : '#eef1f4'; }}
                >
                  {/* Card Header / Thumbnail */}
                  <div style={{ height: 140, position: 'relative', overflow: 'hidden', background: course.thumbnail ? 'none' : `linear-gradient(135deg, ${color}18, ${color}08)` }}>
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(rgba(0,0,0,0.2) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                        <BookOpen size={40} color={color} style={{ opacity: 0.25 }} />
                      </div>
                    )}
                    {/* Completed overlay */}
                    {isComplete && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(21,128,61,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: '#15803d', color: '#fff', borderRadius: 50, padding: '6px 16px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle size={14} /> Completed
                        </div>
                      </div>
                    )}
                    {/* Level Badge */}
                    <div style={{ position: 'absolute', top: 12, right: 12, background: levelBg[course.level] || '#f3f4f6', color: levelColor[course.level] || '#374151', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, backdropFilter: 'blur(8px)' }}>
                      {course.level || 'General'}
                    </div>
                    {/* Progress bar at bottom of card image */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, background: 'rgba(0,0,0,0.08)' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: isComplete ? 'linear-gradient(90deg,#15803d,#22c55e)' : `linear-gradient(90deg, ${color}, ${color}cc)`, transition: 'width 1s ease' }} />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {course.category || 'General'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e24', marginBottom: 6, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {course.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${color}aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                        {course.mentorId?.name?.[0]}
                      </div>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{course.mentorId?.name}</span>
                    </div>

                    {/* Real Progress Section */}
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{completedModules}/{totalModules} modules</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color }}>{pct}%</span>
                      </div>
                      <div style={{ flex: 1, height: 7, borderRadius: 6, background: '#f3f4f6', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, background: isComplete ? 'linear-gradient(90deg,#15803d,#22c55e)' : `linear-gradient(90deg, ${color}, ${color}aa)`, transition: 'width 1s ease' }} />
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isComplete ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={12} /> All done!
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Layers size={12} /> In progress
                          </span>
                        )}
                      </div>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowRight size={14} color={color} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyCourses;


