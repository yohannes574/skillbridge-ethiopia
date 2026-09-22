import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, Send, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiForgotPassword } from '../../api';

const ForgotPassword = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiForgotPassword({ email: email.trim().toLowerCase() });
      setSentEmail(email.trim().toLowerCase());
      setSent(true);
      toast.success(data?.message || 'Reset link sent!');
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 404) {
        toast.error(message || 'No account found with this email.');
      } else if (status === 403) {
        toast.error(message || 'This account has been blocked.');
      } else {
        toast.error(message || 'Failed to process reset request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setSent(false);
    handleSubmit({ preventDefault: () => {} });
  };

  // Mask email for display (e.g., na***@gmail.com)
  const maskEmail = (email) => {
    const [user, domain] = email.split('@');
    if (!domain) return email;
    const visible = user.slice(0, 2);
    return `${visible}${'•'.repeat(Math.max(user.length - 2, 3))}@${domain}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8faf9 0%, #e8f5e9 50%, #f0faf3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: 460,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 24,
        padding: 36,
        boxShadow: '0 20px 40px rgba(15,23,42,0.08), 0 4px 12px rgba(15,23,42,0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #2d6a4f, #40916c, #52b788)',
          borderRadius: '24px 24px 0 0',
        }} />

        <Link
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#2d6a4f',
            textDecoration: 'none',
            fontWeight: 600,
            marginBottom: 24,
            fontSize: 14,
            padding: '6px 12px',
            borderRadius: 8,
            transition: 'background 0.2s',
            marginLeft: -12,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f0faf3'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

        {!sent ? (
          <>
            {/* Icon */}
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #d8f3dc, #b7e4c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <ShieldCheck size={28} color="#2d6a4f" />
            </div>

            <h1 style={{
              fontSize: 26,
              fontWeight: 800,
              color: '#1a2e24',
              marginBottom: 8,
              letterSpacing: '-0.5px',
            }}>
              Forgot Password?
            </h1>
            <p style={{
              fontSize: 14,
              color: '#64748b',
              lineHeight: 1.7,
              marginBottom: 24,
            }}>
              Enter the email address associated with your account. We'll verify it exists and send you a password reset link.
            </p>

            {/* Security note */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 14px',
              background: '#f0faf3',
              borderRadius: 12,
              border: '1px solid #d5e8da',
              marginBottom: 24,
            }}>
              <AlertCircle size={16} color="#2d6a4f" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#4a6355', lineHeight: 1.6, margin: 0 }}>
                We will verify that this email belongs to a registered account before sending any reset link. You must use the same email you signed up with.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: 8,
                }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    color="#94a3b8"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      left: 14,
                    }}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    style={{
                      width: '100%',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: 12,
                      padding: '13px 14px 13px 40px',
                      outline: 'none',
                      fontSize: 14,
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2d6a4f';
                      e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 4,
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg, #2d6a4f, #1a4731)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px 16px',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(45,106,79,0.25)',
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: 18,
                      height: 18,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Verifying & Sending...
                  </>
                ) : (
                  <>Verify & Send Reset Link <Send size={16} /></>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Success State */
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            {/* Success icon */}
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #d8f3dc, #b7e4c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              animation: 'popIn 0.4s ease-out',
            }}>
              <CheckCircle size={36} color="#2d6a4f" />
            </div>

            <h2 style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#1a2e24',
              marginBottom: 8,
            }}>
              Reset Link Sent!
            </h2>
            <p style={{
              fontSize: 14,
              color: '#64748b',
              lineHeight: 1.7,
              marginBottom: 8,
            }}>
              We verified your account and sent a password reset link to:
            </p>
            <p style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#2d6a4f',
              background: '#f0faf3',
              padding: '10px 16px',
              borderRadius: 10,
              display: 'inline-block',
              marginBottom: 20,
              border: '1px solid #d5e8da',
            }}>
              {maskEmail(sentEmail)}
            </p>

            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 24,
              textAlign: 'left',
            }}>
              <p style={{ fontSize: 12, color: '#92400e', lineHeight: 1.6, margin: 0 }}>
                <strong>Note:</strong> The link expires in 30 minutes. Check your spam folder if you don't see the email within a few minutes.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleResend}
                disabled={loading}
                style={{
                  background: 'transparent',
                  color: '#2d6a4f',
                  border: '1.5px solid #2d6a4f',
                  borderRadius: 12,
                  padding: '12px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#f0faf3';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {loading ? 'Resending...' : 'Resend Reset Link'}
              </button>

              <Link
                to="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  color: '#64748b',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '10px 16px',
                }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
