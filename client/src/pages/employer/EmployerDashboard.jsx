import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import { apiGetCertifiedStudents, apiGetPipelineStats } from '../../api';
import { Users, Award, Briefcase, ArrowRight, Search, CheckCircle, ChevronRight, Activity, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PendingApprovalBanner from '../../components/PendingApprovalBanner';

const EmployerDashboard = () => {
  const { user } = useAuth();
  const [certifiedCount, setCertifiedCount] = useState(0);
  const [pipelineStats, setPipelineStats] = useState({ applied: 0, shortlisted: 0, hired: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGetCertifiedStudents().then(res => setCertifiedCount(res.data.data?.length || 0)),
      apiGetPipelineStats().then(res => setPipelineStats(res.data.data || { applied: 0, shortlisted: 0, hired: 0 }))
    ]).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #6a1b9a 0%, #7b1fa2 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Employer Portal 💼</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Welcome, {user?.name?.split(' ')[0]}!</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>Discover certified talent from SkillBridge Ethiopia</p>
        </div>
        <Link to="/employer/students" style={{
          background: '#fff', color: '#6a1b9a', padding: '12px 24px',
          borderRadius: 50, fontSize: 13, fontWeight: 700, textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          Browse Talent <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <div className="spinner" />
        </div>
      ) : !user?.isApproved ? (
        <PendingApprovalBanner role="employer" />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }} className="stats-row">
            <StatCard to="/employer/students" icon={Users} label="Certified Students" value={certifiedCount} color="#2d6a4f" bg="#e8f5e9" />
            <StatCard to="/employer/students" icon={Award} label="Verified Skills" value="100%" color="#e65100" bg="#fff3e0" />
            <StatCard to="/employer/students" icon={Briefcase} label="Available Now" value={certifiedCount} color="#6a1b9a" bg="#f3e5f5" />
          </div>

          {/* Hiring Pipeline Status */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #eef1f4', padding: 24, marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a2e24', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={20} color="#6a1b9a" /> Hiring Pipeline Status
            </h2>
            <div style={{ display: 'flex', background: '#fafbfc', borderRadius: 16, border: '1px solid #f1f5f9', padding: '16px', gap: 12, overflowX: 'auto' }} className="pipeline-track">
              
              {/* Stage 1: Applied */}
              <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 16, minWidth: 200 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} color="#3b82f6" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#64748b', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Applied</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>{pipelineStats.applied}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', color: '#cbd5e1' }}><ChevronRight size={24} /></div>

              {/* Stage 2: Shortlisted */}
              <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 16, minWidth: 200 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarCheck size={20} color="#d97706" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#64748b', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shortlisted</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>{pipelineStats.shortlisted}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', color: '#cbd5e1' }}><ChevronRight size={24} /></div>

              {/* Stage 3: Hired */}
              <div style={{ flex: 1, background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 16, minWidth: 200 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={20} color="#16a34a" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#64748b', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hired</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>{pipelineStats.hired}</p>
                </div>
              </div>

            </div>
          </div>

          {/* Talent Pool CTA */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #eef1f4', padding: '48px 40px', textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f3e5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Users size={36} color="#6a1b9a" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e24', marginBottom: 10 }}>Talent Pool Ready</h2>
            <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 460, margin: '0 auto 28px', lineHeight: 1.7 }}>
              Browse our directory of certified students who have completed mentor-guided courses with verified skills and achievements.
            </p>
            <Link to="/employer/students" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(135deg, #6a1b9a, #7b1fa2)', color: '#fff',
              padding: '14px 32px', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none',
            }}>
              <Search size={18} /> Browse Talent Pool
            </Link>
          </div>

          {/* How it works */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eef1f4', padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e24', marginBottom: 20 }}>How It Works for Employers</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="how-grid">
              {[
                { icon: Search, title: 'Browse Candidates', desc: 'Search our pool of certified students filtered by skill and course completion.', color: '#6a1b9a', bg: '#f3e5f5' },
                { icon: Award, title: 'Verify Credentials', desc: 'Every certificate is mentor-approved and verified on the platform.', color: '#2d6a4f', bg: '#e8f5e9' },
                { icon: CheckCircle, title: 'Connect & Hire', desc: 'Reach out to candidates who match your exact requirements.', color: '#1565c0', bg: '#e3f2fd' },
              ].map(item => (
                <div key={item.title} style={{ padding: '20px', borderRadius: 14, background: '#fafbfc', border: '1px solid #eef1f4', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <item.icon size={22} color={item.color} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1a2e24', marginBottom: 6 }}>{item.title}</p>
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .stats-row { grid-template-columns: 1fr !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .pipeline-track { flex-direction: column !important; }
          .pipeline-track > div:nth-child(even) { transform: rotate(90deg); margin: 8px 0; align-self: center; }
        }
        @media (max-width: 640px) {
          .stats-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default EmployerDashboard;
