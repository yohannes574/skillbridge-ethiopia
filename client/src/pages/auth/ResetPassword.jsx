import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiResetPassword } from '../../api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const tokenMissing = useMemo(() => !token || String(token).trim().length === 0, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    try {
      const { data } = await apiResetPassword({ token, password });
      toast.success(data?.message || 'Password updated successfully');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reset link is invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 28, boxShadow: '0 12px 28px rgba(15,23,42,0.08)' }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#2d6a4f', textDecoration: 'none', fontWeight: 700, marginBottom: 18 }}>
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a2e24', marginBottom: 8 }}>Set New Password</h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>
          Create a new password for your account.
        </p>

        {tokenMissing ? (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 14, color: '#b91c1c', fontSize: 13, fontWeight: 700 }}>
            Reset token is missing. Please request a new password reset link.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155' }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 12 }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 12, padding: '11px 12px 11px 36px', outline: 'none', fontSize: 14 }}
              />
            </div>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <CheckCircle size={16} color="#94a3b8" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 12 }} />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 12, padding: '11px 12px 11px 36px', outline: 'none', fontSize: 14 }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: 6, background: loading ? '#94a3b8' : 'linear-gradient(135deg, #2d6a4f, #1a4731)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 14px', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
