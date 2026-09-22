import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiLogin, apiLoginWithGoogle } from '../../api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const clearLoginInputs = () => {
      setForm({ email: '', password: '' });
      if (emailInputRef.current) emailInputRef.current.value = '';
      if (passwordInputRef.current) passwordInputRef.current.value = '';
    };

    clearLoginInputs();
    const timer = setTimeout(clearLoginInputs, 50);
    window.addEventListener('pageshow', clearLoginInputs);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pageshow', clearLoginInputs);
    };
  }, []);

  const completeLogin = (payload) => {
    login(payload.data, payload.token);
    toast.success(`Welcome back, ${payload.data.name}! 👋`);
    const redirects = { student: '/student/dashboard', mentor: '/mentor/dashboard', admin: '/admin/dashboard', employer: '/employer/dashboard' };
    navigate(redirects[payload.data.role] || '/');
  };

  const handleGoogleCredential = async (credential) => {
    if (!credential) return;
    setGoogleLoading(true);
    try {
      const { data } = await apiLoginWithGoogle({ credential });
      completeLogin(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (!googleClientId || !googleBtnRef.current) return;

    const scriptId = 'google-identity-services';
    const initGoogle = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => handleGoogleCredential(response.credential),
      });

      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 380,
        text: 'signin_with',
        shape: 'pill',
      });
    };

    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener('load', initGoogle, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.id = scriptId;
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  }, [googleClientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiLogin(form);
      completeLogin(data);
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      if (apiMessage && apiMessage.toLowerCase().includes('token')) {
        toast.error('Incorrect email or password');
      } else {
        toast.error(apiMessage || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      {/* Left Panel – Dark Green */}
      <div style={{
        width: '45%', background: 'linear-gradient(160deg, #1a2e24 0%, #1c3a2c 50%, #213d2f 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 56px', position: 'relative', overflow: 'hidden',
      }} className="auth-left-panel">
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '32px 32px', pointerEvents: 'none',
        }} />
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '20%', right: '-60px', width: 240, height: 240, borderRadius: '50%', background: 'rgba(45,106,79,0.12)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '10%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(183,228,199,0.06)', filter: 'blur(40px)', pointerEvents: 'none' }} />

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
            Welcome Back
          </p>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 20, letterSpacing: '-1px' }}>
            Bridge Your Skills<br />
            <span style={{ fontStyle: 'italic', fontFamily: "'Playfair Display', serif", color: '#b7e4c7' }}>to Real Opportunities</span>
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 340 }}>
            Sign in to continue your learning journey with verified mentors and build the skills top employers are looking for.
          </p>

          {/* Trust points */}
          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Verified Mentor Guidance', 'Earn Real Certificates', 'Trusted by 500+ Learners'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle size={16} color="#40916c" />
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{item}</span>
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
        flex: 1, background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1a2e24', marginBottom: 8, letterSpacing: '-0.5px' }}>Sign In</h2>
            <p style={{ fontSize: 14, color: '#6b7280' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#2d6a4f', fontWeight: 600, textDecoration: 'none' }}>Create one free</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Email Address</label>
              <input
                ref={emailInputRef}
                type="email"
                name="sb_email_input"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="off"
                required
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Password</label>
                <Link to="/forgot-password" state={{ email: form.email }} style={{ fontSize: 12, color: '#2d6a4f', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  ref={passwordInputRef}
                  type={showPass ? 'text' : 'password'}
                  name="sb_password_input"
                  className="input-field"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
                  style={{ paddingRight: 44 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
                <> Sign In <ArrowRight size={18} /> </>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ height: 1, flex: 1, background: '#e5e7eb' }} />
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>or</span>
              <div style={{ height: 1, flex: 1, background: '#e5e7eb' }} />
            </div>

            <div style={{ minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {googleClientId ? (
                <div ref={googleBtnRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
              ) : (
                <button
                  type="button"
                  disabled
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 50, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#9ca3af', fontWeight: 600, cursor: 'not-allowed' }}
                >
                  Google Sign-In not configured
                </button>
              )}
            </div>
            {googleLoading && (
              <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>Signing in with Google...</p>
            )}
          </form>

          {/* Demo Credentials */}
          <div style={{
            marginTop: 32, padding: '16px 20px', borderRadius: 12,
            background: '#f0faf3', border: '1px solid #d5e8da',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Demo Admin Credentials</p>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
              Email: <span style={{ fontWeight: 600, color: '#1a2e24' }}>admin@gmail.com</span>
            </p>
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              Password: <span style={{ fontWeight: 600, color: '#1a2e24' }}>12121212</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
