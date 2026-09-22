import { useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import { Bell, Search, BookOpen, Award, Package, X, CheckCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiGetNotifications, apiGetUnreadCount, apiMarkNotificationRead, apiMarkAllNotificationsRead, apiGetUnread, apiGetJobApplications, apiGetStudentApplications } from '../api';

const typeIcon = {
  new_lesson:           '🎬',
  new_module:           '📚',
  enrollment_approved:  '✅',
  enrollment_rejected:  '❌',
  certificate_approved: '🏆',
  quiz_passed:          '🎉',
  quiz_failed:          '😔',
  report_warning:       '⚠️',
  report_review:        '🛎️',
  report_restricted:     '🚫',
  session_scheduled:    '📅',
  session_reminder:     '⏰',
  new_job:              '💼',
  general:              '🔔',
};

const NotificationPanel = ({ onClose, liveInterviewAlerts = [] }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiGetNotifications()
      .then(r => setItems(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleClick = async (notif) => {
    if (!notif.read) {
      await apiMarkNotificationRead(notif._id).catch(() => {});
      setItems(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
    }
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  const markAll = async () => {
    await apiMarkAllNotificationsRead().catch(() => {});
    setItems(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unread = items.filter(n => !n.read).length + liveInterviewAlerts.length;

  return (
    <div style={{
      position: 'absolute', top: 52, right: 0, width: 360, zIndex: 200,
      background: '#fff', borderRadius: 18, boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
      border: '1px solid #eef1f4', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#1a2e24', margin: 0 }}>Notifications</p>
          {unread > 0 && <p style={{ fontSize: 11, color: '#2d6a4f', fontWeight: 600, margin: 0 }}>{unread} unread</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {unread > 0 && (
            <button onClick={markAll} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#2d6a4f', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>
              <CheckCheck size={12} /> Mark all read
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading...</div>
        ) : items.length === 0 && liveInterviewAlerts.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔔</div>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>No notifications yet</p>
          </div>
        ) : (
          [...liveInterviewAlerts.map((alert, idx) => ({
            _id: `live-${alert.applicationId}-${idx}`,
            type: 'live_interview_alert',
            title: 'Live Interview Alert',
            message: alert.message,
            read: false,
            link: alert.link,
            createdAt: new Date().toISOString(),
          })), ...items].slice(0, 10).map(notif => (
            <button
              key={notif._id}
              onClick={() => handleClick(notif)}
              style={{
                width: '100%', textAlign: 'left', border: 'none', borderBottom: '1px solid #f9fafb',
                padding: '12px 20px', cursor: notif.link ? 'pointer' : 'default',
                background: notif.read ? '#fff' : '#f0fdf4',
                display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (notif.read) e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={e => { e.currentTarget.style.background = notif.read ? '#fff' : '#f0fdf4'; }}
            >
              <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{notif.type === 'live_interview_alert' ? '🚨' : (typeIcon[notif.type] || '🔔')}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: notif.read ? 500 : 700, color: '#1a2e24', margin: '0 0 2px 0', lineHeight: 1.3 }}>
                  {notif.title}
                </p>
                <p style={{ fontSize: 11, color: '#6b7280', margin: 0, lineHeight: 1.4, whiteSpace: 'normal' }}>
                  {notif.message}
                </p>
                <p style={{ fontSize: 10, color: '#d1d5db', margin: '4px 0 0 0', fontWeight: 500 }}>
                  {new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {!notif.read && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2d6a4f', flexShrink: 0, marginTop: 4 }} />
              )}
            </button>
          ))
        )}
      </div>

      {items.length > 10 && (
        <div style={{ padding: '10px 20px', textAlign: 'center', borderTop: '1px solid #f3f4f6', fontSize: 12, color: '#9ca3af' }}>
          Showing 10 of {items.length}
        </div>
      )}
    </div>
  );
};

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [liveInterviewAlerts, setLiveInterviewAlerts] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const panelRef = useRef(null);

  const fetchUnread = () => {
    apiGetUnreadCount().then(r => setUnreadCount(r.data.count || 0)).catch(() => {});
    apiGetUnread().then(r => setUnreadMessageCount(r.data.count || 0)).catch(() => {});
  };

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

  const fetchLiveInterviewAlerts = async () => {
    try {
      if (!user?.role || !['student', 'employer'].includes(user.role)) {
        setLiveInterviewAlerts([]);
        return;
      }

      const response = user.role === 'employer'
        ? await apiGetJobApplications()
        : await apiGetStudentApplications();

      const applications = response?.data?.data || [];
      const nowMs = Date.now();
      const roleJoinField = user.role === 'employer' ? 'employerJoinedAt' : 'studentJoinedAt';

      const liveAlerts = applications
        .filter((app) => app.status === 'interview_scheduled' && app.stageTracking)
        .map((app) => {
          const start = getInterviewStartDateTime(app.stageTracking);
          if (!start) return null;

          const startMs = start.getTime();
          const endMs = startMs + 3 * 60 * 1000;
          const hasJoined = !!app.stageTracking?.[roleJoinField];
          if (hasJoined || nowMs < startMs || nowMs > endMs) return null;

          const counterpartName = user.role === 'employer'
            ? (app.studentId?.name || 'candidate')
            : (app.employerId?.name || 'employer');

          return {
            applicationId: app._id,
            message: `Interview with ${counterpartName} is live now. Join within 3 minutes.`,
            link: user.role === 'employer' ? '/employer/requests' : '/student/jobs',
          };
        })
        .filter(Boolean);

      setLiveInterviewAlerts(liveAlerts);
    } catch {
      setLiveInterviewAlerts([]);
    }
  };

  useEffect(() => {
    fetchUnread();
    fetchLiveInterviewAlerts();
    const interval = setInterval(fetchUnread, 30000); // poll every 30s
    const interviewAlertInterval = setInterval(fetchLiveInterviewAlerts, 15000);
    const bannerTimer = setTimeout(() => setShowBanner(false), 8000); // 8 seconds
    return () => {
      clearInterval(interval);
      clearInterval(interviewAlertInterval);
      clearTimeout(bannerTimer);
    };
  }, [user?.role]);

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    if (showPanel) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPanel]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8faf9' }}>
      <Sidebar unreadMessageCount={unreadMessageCount} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Navbar */}
        <header style={{
          height: 64, background: '#fff', borderBottom: '1px solid #eef1f4',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', position: 'sticky', top: 0, zIndex: 40,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#f8faf9', border: '1px solid #eef1f4',
            borderRadius: 50, padding: '8px 16px', maxWidth: 320, flex: 1,
          }}>
            <Search size={16} color="#9ca3af" />
            <input
              placeholder="Search courses, mentors..."
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#374151', width: '100%', fontFamily: "'Inter', sans-serif" }}
            />
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }} ref={panelRef}>
              <button
                onClick={() => {
                  setShowPanel(p => !p);
                  if (!showPanel) fetchUnread(); // refresh count when opening
                }}
                style={{
                  width: 38, height: 38, borderRadius: '50%', background: showPanel ? '#e8f5e9' : '#f8faf9',
                  border: '1px solid #eef1f4', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e8f5e9'}
                onMouseLeave={e => e.currentTarget.style.background = showPanel ? '#e8f5e9' : '#f8faf9'}
              >
                <Bell size={17} color={showPanel ? '#2d6a4f' : '#6b7280'} />
                {(unreadCount + liveInterviewAlerts.length) > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16,
                    borderRadius: 8, background: '#ef4444', border: '2px solid #fff',
                    fontSize: 9, fontWeight: 800, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px', lineHeight: 1,
                  }}>
                    {(unreadCount + liveInterviewAlerts.length) > 99 ? '99+' : (unreadCount + liveInterviewAlerts.length)}
                  </span>
                )}
              </button>

              {showPanel && (
                <NotificationPanel
                  liveInterviewAlerts={liveInterviewAlerts}
                  onClose={() => {
                    setShowPanel(false);
                    fetchUnread(); // refresh count after reading
                  }}
                />
              )}
            </div>

            {/* Avatar */}
            <div 
              onClick={() => navigate('/profile')}
              title="View Profile"
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14, color: '#fff', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(45,106,79,0.2)'
              }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Global Alert Banner */}
        {showBanner && (unreadMessageCount > 0 || unreadCount > 0) && (
          <div className="bg-emerald-500 text-white px-6 py-2.5 flex items-center justify-between text-[14px] font-bold shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 relative z-30 border-b border-emerald-600/50">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)] border border-white/20" />
              <span>
                Attention: You have {unreadMessageCount > 0 ? `${unreadMessageCount} unread message(s)` : ''}
                {unreadMessageCount > 0 && unreadCount > 0 ? ' and ' : ''}
                {unreadCount > 0 ? `${unreadCount} unread notification(s)` : ''}!
              </span>
            </div>
            <button onClick={() => setShowBanner(false)} className="p-1 hover:bg-emerald-600/50 rounded-lg transition-colors border border-transparent hover:border-emerald-400">
              <X size={16} />
            </button>
          </div>
        )}

        {liveInterviewAlerts.length > 0 && (
          <div style={{ background: '#b91c1c', color: '#fff', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #991b1b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 800 }}>
              <AlertTriangle size={16} />
              {liveInterviewAlerts[0].message}
              {liveInterviewAlerts.length > 1 ? ` (+${liveInterviewAlerts.length - 1} more)` : ''}
            </div>
            <button
              onClick={() => navigate(liveInterviewAlerts[0].link)}
              style={{ background: '#fff', color: '#b91c1c', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
            >
              Open
            </button>
          </div>
        )}

        {/* Page Content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
