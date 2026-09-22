import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRegister } from '../../api';
import toast from 'react-hot-toast';
import { UserPlus, Eye, EyeOff, CheckCircle, ArrowRight, GraduationCap, Users, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const roles = [
  { value: 'student', label: 'Student', desc: 'Learn & grow', icon: GraduationCap, color: '#2d6a4f', bg: '#e8f5e9' },
  { value: 'mentor', label: 'Mentor', desc: 'Teach & guide', icon: Users, color: '#1565c0', bg: '#e3f2fd' },
  { value: 'employer', label: 'Employer', desc: 'Find talent', icon: Briefcase, color: '#6a1b9a', bg: '#f3e5f5' },
];

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { data } = await apiRegister(form);
      toast.success(data.message);
      // All roles now get a token — auto-login and redirect to their dashboard
      login(data.data, data.token);
      const redirects = { student: '/student/dashboard', mentor: '/mentor/dashboard', admin: '/admin/dashboard', employer: '/employer/dashboard' };
      navigate(redirects[data.data.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      {/* Left Panel – Dark Green */}
      <div style={{
        width: '42%', background: 'linear-gradient(160deg, #1a2e24 0%, #1c3a2c 50%, #213d2f 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 56px', position: 'relative', overflow: 'hidden',
      }} className="auth-left-panel">
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '32px 32px', pointerEvents: 'none',
        }} />
        <div style={{ position: 'absolute', top: '25%', right: '-80px', width: 280, height: 280, borderRadius: '50%', background: 'rgba(45,106,79,0.1)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, boxShadow: '0 4px 16px rgba(45,106,79,0.3)',
            }}>🌉</div>
            <span style={{ fontWeight: 800, color: '#fff', fontSize: 20 }}>SkillBridge</span>
          </Link>
        </div>

        {/* Center Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>
            Join Today
          </p>
          <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 20, letterSpacing: '-1px' }}>
            Start Your Learning<br />
            <span style={{ fontStyle: 'italic', fontFamily: "'Playfair Display', serif", color: '#b7e4c7' }}>Journey Today</span>
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 320 }}>
            Create your free account and connect with expert mentors. Learn at your own pace and earn verified certificates.
          </p>

          {/* Role descriptions */}
          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { emoji: '🎓', title: 'Students', desc: 'Access courses & mentorship' },
              { emoji: '👨‍🏫', title: 'Mentors', desc: 'Share expertise & guide learners' },
              { emoji: '💼', title: 'Employers', desc: 'Discover certified talent' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{item.emoji}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>© 2026 SkillBridge Ethiopia</p>
        </div>
      </div>

      {/* Right Panel – White Form */}
      <div style={{
        flex: 1, background: '#fff', overflowY: 'auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1a2e24', marginBottom: 8, letterSpacing: '-0.5px' }}>Create Account</h2>
            <p style={{ fontSize: 14, color: '#6b7280' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#2d6a4f', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Full Name</label>
              <input
                className="input-field"
                placeholder="Abebe Bekele"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{ paddingRight: 44 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>I want to join as</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {roles.map((r) => {
                  const isSelected = form.role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm({ ...form, role: r.value })}
                      style={{
                        padding: '14px 10px', borderRadius: 12, textAlign: 'center',
                        border: `2px solid ${isSelected ? r.color : '#eef1f4'}`,
                        background: isSelected ? r.bg : '#fafbfc',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                        <r.icon size={16} color={r.color} />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: isSelected ? r.color : '#374151', marginBottom: 2 }}>{r.label}</p>
                      <p style={{ fontSize: 11, color: '#9ca3af' }}>{r.desc}</p>
                    </button>
                  );
                })}
              </div>
              {(form.role === 'mentor' || form.role === 'employer') && (
                <p style={{ fontSize: 12, color: '#d97706', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, background: '#fef3c7', padding: '8px 12px', borderRadius: 8 }}>
                  ⚠️ {form.role === 'mentor' ? 'Mentors' : 'Employers'} require admin approval before full access.
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #2d6a4f, #1a4731)',
                color: '#fff', padding: '14px 24px', borderRadius: 50,
                border: 'none', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', marginTop: 4,
              }}
            >
              {loading ? (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              ) : (
                <> Create Account <ArrowRight size={18} /> </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Register;
