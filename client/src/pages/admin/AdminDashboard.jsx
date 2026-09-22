import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import { apiGetUsers, apiGetCourses, apiGetReports } from '../../api';
import { Users, BookOpen, FileText, Shield, TrendingUp, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, mentors: 0, courses: 0, pendingCourses: 0, reports: 0, pendingReports: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [uRes, cRes, rRes] = await Promise.all([apiGetUsers(), apiGetCourses(), apiGetReports()]);
        const users = uRes.data.data || [];
        const courses = cRes.data.data || [];
        const reports = rRes.data.data || [];
        setStats({
          users: users.length,
          mentors: users.filter(u => u.role === 'mentor').length,
          courses: courses.length,
          pendingCourses: courses.filter(c => !c.isApproved).length,
          reports: reports.length,
          pendingReports: reports.filter(r => r.status === 'pending').length,
        });
        setRecentUsers(users.filter(u => !u.isApproved && u.role !== 'student').slice(0, 5));
        setRecentCourses(courses.filter(c => !c.isApproved).slice(0, 5));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

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
        background: 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Admin Panel 🛡️</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Platform Dashboard</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>Overview and management of all platform activity</p>
        </div>
        <div style={{ display: 'flex', gap: 10, position: 'relative', zIndex: 1 }}>
          <Link to="/admin/users" style={{
            background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '11px 20px',
            borderRadius: 50, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>Manage Users</Link>
          <Link to="/admin/courses" style={{
            background: '#fff', color: '#e65100', padding: '11px 20px',
            borderRadius: 50, fontSize: 13, fontWeight: 700, textDecoration: 'none',
          }}>Manage Courses</Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }} className="stats-row">
        <StatCard to="/admin/users" icon={Users} label="Total Users" value={stats.users} color="#1565c0" bg="#e3f2fd" />
        <StatCard to="/admin/users" icon={Shield} label="Mentors" value={stats.mentors} color="#2d6a4f" bg="#e8f5e9" />
        <StatCard to="/admin/courses" icon={BookOpen} label="Total Courses" value={stats.courses} color="#6a1b9a" bg="#f3e5f5" />
        <StatCard to="/admin/courses" icon={Clock} label="Pending Courses" value={stats.pendingCourses} color="#e65100" bg="#fff3e0" />
        <StatCard to="/admin/reports" icon={FileText} label="Total Reports" value={stats.reports} color="#dc2626" bg="#fee2e2" />
        <StatCard to="/admin/reports" icon={TrendingUp} label="Open Reports" value={stats.pendingReports} color="#d97706" bg="#fef3c7" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="dash-main-grid">
        {/* Pending User Approvals */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef1f4', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e24' }}>Pending User Approvals</h2>
            <Link to="/admin/users" style={{ fontSize: 13, color: '#2d6a4f', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Manage <ArrowRight size={14} />
            </Link>
          </div>
          {recentUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <CheckCircle size={32} color="#2d6a4f" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, color: '#6b7280' }}>No pending approvals</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentUsers.map(u => (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: '#fafbfc', border: '1px solid #eef1f4' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2d6a4f, #40916c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0 }}>
                    {u.name?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1a2e24' }}>{u.name}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, flexShrink: 0,
                    background: u.role === 'mentor' ? '#e3f2fd' : '#f3e5f5',
                    color: u.role === 'mentor' ? '#1565c0' : '#6a1b9a',
                  }}>{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Course Approvals */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef1f4', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e24' }}>Pending Course Approvals</h2>
            <Link to="/admin/courses" style={{ fontSize: 13, color: '#2d6a4f', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Manage <ArrowRight size={14} />
            </Link>
          </div>
          {recentCourses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <CheckCircle size={32} color="#2d6a4f" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, color: '#6b7280' }}>No pending courses</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentCourses.map(c => (
                <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: '#fafbfc', border: '1px solid #eef1f4' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={16} color="#2d6a4f" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1a2e24', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</p>
                    <p style={{ fontSize: 12, color: '#6b7280' }}>{c.mentorId?.name}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#fef3c7', color: '#92400e', flexShrink: 0 }}>Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .dash-main-grid { grid-template-columns: 1fr !important; }
          .stats-row { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default AdminDashboard;
