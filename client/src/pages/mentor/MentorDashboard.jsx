import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { apiGetCourses, apiGetMentorStudents, apiGetEnrollmentRequests, apiGetCertRequests } from '../../api';
import { BookOpen, Users, Award, Clock, ArrowRight, TrendingUp, MessageCircle, BarChart3, Target, Zap, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import PendingApprovalBanner from '../../components/PendingApprovalBanner';

/* ─── Mini Bar Chart Component ─── */
const BarChart = ({ data, height = 160, barColor = '#2d6a4f' }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height, paddingTop: 10 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{d.value}</span>
          <div style={{
            width: '100%', borderRadius: '6px 6px 0 0',
            background: `linear-gradient(180deg, ${barColor}, ${barColor}aa)`,
            height: `${Math.max((d.value / max) * (height - 40), 6)}px`,
            transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            minHeight: 6,
          }} />
          <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Horizontal Progress Bar ─── */
const HBarChart = ({ data, maxVal }) => {
  const m = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{d.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: d.color || '#2d6a4f' }}>{d.value}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 8, background: '#f3f4f6', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(d.value, 100)}%`, height: '100%', borderRadius: 8,
              background: `linear-gradient(90deg, ${d.color || '#2d6a4f'}, ${d.color || '#52b788'})`,
              transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─── Enhanced Stat Card ─── */
const EnhancedStatCard = ({ icon: Icon, label, value, target, color, bg, desc, to }) => {
  const pct = target ? Math.min(Math.round((value / target) * 100), 100) : null;
  const cardStyle = {
    background: bg, borderRadius: 18, padding: '22px 20px',
    border: `1px solid ${color}18`, position: 'relative', overflow: 'hidden',
    transition: 'all 0.3s', textDecoration: 'none', display: 'block',
    cursor: to ? 'pointer' : 'default',
  };

  const cardBody = (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
        {target && (
          <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}12`, padding: '3px 8px', borderRadius: 20 }}>
            /{target} goal
          </span>
        )}
      </div>
      <p style={{ fontSize: 28, fontWeight: 900, color: '#1a2e24', marginBottom: 2, letterSpacing: '-1px' }}>{value}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: target ? 10 : 0 }}>{label}</p>
      {target && (
        <div>
          <div style={{ height: 6, borderRadius: 6, background: `${color}15`, overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%', borderRadius: 6,
              background: `linear-gradient(90deg, ${color}, ${color}cc)`,
              transition: 'width 1s ease',
            }} />
          </div>
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{pct}% of goal</p>
        </div>
      )}
      {desc && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{desc}</p>}
    </>
  );

  const hoverIn = e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${color}15`; };
  const hoverOut = e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; };

  if (to) {
    return (
      <Link to={to} style={cardStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
        {cardBody}
      </Link>
    );
  }

  return (
    <div style={{
      ...cardStyle,
      cursor: 'default',
    }}
      onMouseEnter={hoverIn}
      onMouseLeave={hoverOut}
    >
      {cardBody}
    </div>
  );
};

const MentorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ courses: 0, students: 0, pendingRequests: 0, pendingCerts: 0, totalRequests: 0, approvedRequests: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, sRes, rRes, crRes] = await Promise.all([
          apiGetCourses(), apiGetMentorStudents(), apiGetEnrollmentRequests(), apiGetCertRequests(),
        ]);
        const allRequests = rRes.data.data || [];
        const courseList = cRes.data.data || [];
        setCourses(courseList);
        setStats({
          courses: courseList.length,
          students: sRes.data.data?.length || 0,
          pendingRequests: allRequests.filter(r => r.status === 'pending').length,
          pendingCerts: (crRes.data.data || []).filter(r => r.status === 'pending').length,
          totalRequests: allRequests.length,
          approvedRequests: allRequests.filter(r => r.status === 'approved').length,
        });
        setRecentRequests(allRequests.filter(r => r.status === 'pending').slice(0, 5));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Simulated weekly activity data (in real app, fetch from analytics endpoint)
  const weeklyActivity = useMemo(() => [
    { label: 'Mon', value: Math.floor(Math.random() * 8) + 2 },
    { label: 'Tue', value: Math.floor(Math.random() * 10) + 3 },
    { label: 'Wed', value: Math.floor(Math.random() * 7) + 1 },
    { label: 'Thu', value: Math.floor(Math.random() * 12) + 4 },
    { label: 'Fri', value: Math.floor(Math.random() * 9) + 2 },
    { label: 'Sat', value: Math.floor(Math.random() * 5) + 1 },
    { label: 'Sun', value: Math.floor(Math.random() * 4) + 1 },
  ], []);

  // Course performance data
  const coursePerformance = useMemo(() => {
    if (!courses.length) return [];
    return courses.slice(0, 5).map(c => ({
      label: c.title?.length > 20 ? c.title.substring(0, 20) + '…' : c.title,
      value: Math.floor(Math.random() * 60) + 40, // In real app: actual completion %
      color: ['#2d6a4f', '#1565c0', '#e65100', '#6a1b9a', '#00695c'][courses.indexOf(c) % 5],
    }));
  }, [courses]);

  // Request trend mini data
  const requestTrend = useMemo(() => [
    { label: 'Enrollments', value: stats.totalRequests, color: '#1565c0' },
    { label: 'Approved', value: stats.approvedRequests, color: '#2d6a4f' },
    { label: 'Pending', value: stats.pendingRequests, color: '#e65100' },
    { label: 'Certs Pending', value: stats.pendingCerts, color: '#6a1b9a' },
  ], [stats]);

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <div className="spinner" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2e24 0%, #2d6a4f 50%, #1a4731 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(82,183,136,0.15), transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Mentor Dashboard 👨‍🏫</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Hello, {user?.name?.split(' ')[0]}!</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>Manage your courses and guide your students</p>
        </div>
        {user?.isApproved && (
          <Link to="/mentor/courses" style={{
            background: 'linear-gradient(135deg, #b7e4c7, #95d5b2)', color: '#1a2e24', padding: '12px 24px',
            borderRadius: 50, fontSize: 13, fontWeight: 700, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            boxShadow: '0 4px 16px rgba(183,228,199,0.3)',
          }}>
            Create Course <ArrowRight size={16} />
          </Link>
        )}
      </div>

      {!user?.isApproved ? (
        <PendingApprovalBanner role="mentor" />
      ) : (
        <>
          {/* ─── Enhanced Stat Cards with Progress ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }} className="stats-row">
            <EnhancedStatCard to="/mentor/courses" icon={BookOpen} label="My Courses" value={stats.courses} target={5} color="#2d6a4f" bg="#f0faf3" />
            <EnhancedStatCard to="/mentor/students" icon={Users} label="Active Students" value={stats.students} target={20} color="#1565c0" bg="#eff6ff" />
            <EnhancedStatCard to="/mentor/students" icon={Clock} label="Pending Requests" value={stats.pendingRequests} color="#e65100" bg="#fff8f0" desc={stats.pendingRequests > 0 ? '⚡ Needs your attention' : '✅ All caught up'} />
            <EnhancedStatCard to="/mentor/certificates" icon={Award} label="Cert Approvals" value={stats.pendingCerts} color="#6a1b9a" bg="#faf5ff" desc={stats.pendingCerts > 0 ? '📋 Review pending certs' : '🎉 No pending certs'} />
          </div>

          {/* ─── Charts Section ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }} className="chart-grid">
            {/* Student Activity Bar Chart */}
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #eef1f4', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e24', marginBottom: 2 }}>Student Activity</h3>
                  <p style={{ fontSize: 12, color: '#9ca3af' }}>Active students this week</p>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0faf3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={18} color="#2d6a4f" />
                </div>
              </div>
              <BarChart data={weeklyActivity} barColor="#2d6a4f" />
            </div>

            {/* Course Performance Horizontal Bar */}
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #eef1f4', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e24', marginBottom: 2 }}>Course Performance</h3>
                  <p style={{ fontSize: 12, color: '#9ca3af' }}>Completion rate by course</p>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={18} color="#1565c0" />
                </div>
              </div>
              {coursePerformance.length > 0 ? (
                <HBarChart data={coursePerformance} maxVal={100} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ fontSize: 13, color: '#9ca3af' }}>Create courses to see performance</p>
                </div>
              )}
            </div>
          </div>

          {/* ─── Request Overview Mini Cards ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }} className="mini-stats-row">
            {requestTrend.map((item, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1px solid #eef1f4',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#1a2e24', letterSpacing: '-0.5px' }}>{item.value}</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{item.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ─── Bottom Grid: Pending + Quick Actions ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="dash-main-grid">
            {/* Pending Requests */}
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #eef1f4', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: stats.pendingRequests > 0 ? '#f59e0b' : '#22c55e' }} />
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e24' }}>Pending Enrollments</h2>
                </div>
                <Link to="/mentor/students" style={{ fontSize: 13, color: '#2d6a4f', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Manage <ArrowRight size={14} />
                </Link>
              </div>
              {recentRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
                  <p style={{ fontSize: 14, color: '#6b7280' }}>No pending requests</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recentRequests.map((req) => (
                    <div key={req._id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 12,
                      background: '#fafbfc', border: '1px solid #eef1f4',
                      transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f0faf3'; e.currentTarget.style.borderColor = '#d5e8da'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fafbfc'; e.currentTarget.style.borderColor = '#eef1f4'; }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0,
                      }}>
                        {req.studentId?.name?.[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#1a2e24' }}>{req.studentId?.name}</p>
                        <p style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.courseId?.title}</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#fef3c7', color: '#92400e', flexShrink: 0 }}>Pending</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #eef1f4', padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e24', marginBottom: 18 }}>Quick Actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { to: '/mentor/courses', icon: BookOpen, label: 'Create New Course', desc: 'Add and manage courses', color: '#2d6a4f', bg: '#f0faf3' },
                  { to: '/mentor/students', icon: Users, label: 'Review Requests', desc: 'Accept or reject students', color: '#1565c0', bg: '#eff6ff' },
                  { to: '/mentor/certificates', icon: Award, label: 'Approve Certificates', desc: 'Review certificate requests', color: '#e65100', bg: '#fff8f0' },
                  { to: '/mentor/chat', icon: MessageCircle, label: 'Chat with Students', desc: 'Provide guidance & support', color: '#6a1b9a', bg: '#faf5ff' },
                ].map(item => (
                  <Link key={item.to} to={item.to} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                    borderRadius: 14, border: '1px solid #eef1f4', textDecoration: 'none',
                    background: item.bg, transition: 'all 0.25s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = `0 4px 20px ${item.color}12`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <item.icon size={18} color={item.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1a2e24' }}>{item.label}</p>
                      <p style={{ fontSize: 12, color: '#6b7280' }}>{item.desc}</p>
                    </div>
                    <ArrowRight size={14} color="#9ca3af" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <style>{`
            @media (max-width: 1024px) {
              .dash-main-grid, .chart-grid { grid-template-columns: 1fr !important; }
              .stats-row, .mini-stats-row { grid-template-columns: repeat(2, 1fr) !important; }
            }
            @media (max-width: 640px) {
              .stats-row, .mini-stats-row { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </>
      )}
    </DashboardLayout>
  );
};

export default MentorDashboard;
