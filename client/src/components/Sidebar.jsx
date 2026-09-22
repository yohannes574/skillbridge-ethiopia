import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, MessageCircle, Award, Shield,
  FileText, LogOut, Settings, Star, Briefcase, Search, Bell, AlertTriangle, User
} from 'lucide-react';

const studentLinks = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/browse', icon: Search, label: 'Browse Courses' },
  { to: '/student/courses', icon: BookOpen, label: 'My Courses' },
  { to: '/student/chat', icon: MessageCircle, label: 'Messages' },
  { to: '/student/certificates', icon: Award, label: 'Certificates' },
  { to: '/student/badges', icon: Star, label: 'Badges' },
  { to: '/student/jobs', icon: Briefcase, label: 'Job Board' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const mentorLinks = [
  { to: '/mentor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/mentor/courses', icon: BookOpen, label: 'My Courses' },
  { to: '/mentor/students', icon: Users, label: 'Students' },
  { to: '/mentor/certificates', icon: Award, label: 'Certificates' },
  { to: '/mentor/chat', icon: MessageCircle, label: 'Messages' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const adminLinks = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users',        icon: Users,           label: 'Users' },
  { to: '/admin/courses',      icon: BookOpen,        label: 'Courses' },
  { to: '/admin/certificates', icon: Award,           label: 'Certificates' },
  { to: '/admin/reports',      icon: FileText,        label: 'Reports' },
  { to: '/admin/badges',       icon: Star,            label: 'Badges' },
  { to: '/profile',            icon: User,            label: 'Profile' },
];

const employerLinks = [
  { to: '/employer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employer/jobs', icon: Briefcase, label: 'My Jobs' },
  { to: '/employer/requests', icon: FileText, label: 'Applications' },
  { to: '/employer/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/employer/students', icon: Users, label: 'Talent Pool' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const linksByRole = { student: studentLinks, mentor: mentorLinks, admin: adminLinks, employer: employerLinks };

const roleConfig = {
  student:  { color: '#2d6a4f', bg: '#e8f5e9', label: 'Student' },
  mentor:   { color: '#1565c0', bg: '#e3f2fd', label: 'Mentor' },
  admin:    { color: '#e65100', bg: '#fff3e0', label: 'Admin' },
  employer: { color: '#6a1b9a', bg: '#f3e5f5', label: 'Employer' },
};

const Sidebar = ({ unreadMessageCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const links = linksByRole[user?.role] || [];
  const role = roleConfig[user?.role] || roleConfig.student;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: 240, height: '100vh',
      background: 'linear-gradient(180deg, #1a2e24 0%, #1c3528 100%)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      padding: '20px 0', flexShrink: 0,
      position: 'sticky', top: 0,
      zIndex: 60,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🌉</div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 14, color: '#fff', lineHeight: 1.2 }}>SkillBridge</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Ethiopia LMS</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: '12px 16px', marginBottom: 8 }}>
        <div style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: 12,
          padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: `linear-gradient(135deg, ${role.color}, #40916c)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </p>
            <span style={{
              fontSize: 10, fontWeight: 600, color: role.color,
              background: `${role.bg}22`, padding: '1px 8px', borderRadius: 20,
              textTransform: 'capitalize',
            }}>
              {role.label}
            </span>
          </div>
        </div>
      </div>

      {/* Section label */}
      <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 20px', marginBottom: 6 }}>
        Menu
      </p>

      {/* Nav links */}
      <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 10px' }}>
        {links.map(({ to, icon: Icon, label }) => {
          const isDashboard = label === 'Dashboard';
          const isLocked = !user?.isApproved && !isDashboard;

          if (isLocked) {
            return (
              <div
                key={to}
                title="Complete your application to unlock"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                  color: 'rgba(255,255,255,0.22)', marginBottom: 2, cursor: 'not-allowed',
                  userSelect: 'none',
                }}
              >
                <Icon size={17} style={{ opacity: 0.4 }} />
                <span style={{ flex: 1 }}>{label}</span>
                <span style={{ fontSize: 11 }}>🔒</span>
              </div>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                textDecoration: 'none', marginBottom: 2, transition: 'all 0.2s',
                color: isActive ? '#b7e4c7' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'rgba(45,106,79,0.2)' : 'transparent',
                borderLeft: isActive ? '3px solid #40916c' : '3px solid transparent',
              })}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={e => {
                const isActive = e.currentTarget.classList.contains('active');
                e.currentTarget.style.color = isActive ? '#b7e4c7' : 'rgba(255,255,255,0.5)';
                e.currentTarget.style.background = isActive ? 'rgba(45,106,79,0.2)' : 'transparent';
              }}
            >
              <Icon size={17} />
              <span className="flex-1 whitespace-nowrap">{label}</span>
              {label === 'Messages' && unreadMessageCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  marginLeft: 'auto'
                }}>
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Divider + Logout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '8px 10px 0', paddingTop: 8 }}>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,100,100,0.7)', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.background = 'rgba(220,38,38,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,100,100,0.7)'; e.currentTarget.style.background = 'none'; }}
        >
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(6px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setShowLogoutConfirm(false)}>
          <div style={{
            background: '#fff', borderRadius: 24, padding: '36px 32px 28px', width: '100%', maxWidth: 380,
            boxShadow: '0 25px 60px rgba(0,0,0,0.2)', textAlign: 'center',
            animation: 'fadeInUp 0.2s ease-out',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #fee2e2, #fef2f2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', border: '1px solid #fecaca',
            }}>
              <LogOut size={28} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Are you sure you want to log out?</h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 28px', lineHeight: 1.6 }}>
              You will need to sign in again to access your account.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700,
                  background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700,
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none',
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
