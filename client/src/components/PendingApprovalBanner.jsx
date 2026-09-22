import { useAuth } from '../context/AuthContext';
import { MentorOnboardingForm, EmployerOnboardingForm } from './OnboardingForms';
import { Clock, RefreshCw, AlertTriangle } from 'lucide-react';

/**
 * Smart pending state component.
 * Renders different UI based on submissionStatus:
 *  - not_submitted → show onboarding form
 *  - submitted      → show "under review" waiting screen
 *  - rejected       → show rejection reason + allow resubmission
 */
const PendingApprovalBanner = ({ role }) => {
  const { user, updateUser } = useAuth();
  const status = user?.submissionStatus || 'not_submitted';

  // ─── NOT_SUBMITTED: Show the onboarding form ─────────────────────
  if (status === 'not_submitted' || status === 'rejected') {
    return (
      <>
        {/* Rejection notice (shown only if previously rejected) */}
        {status === 'rejected' && (
          <div style={{
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            borderRadius: 16, padding: '20px 28px', marginBottom: 20,
            display: 'flex', alignItems: 'flex-start', gap: 16,
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={20} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Application Rejected</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                {user?.rejectionReason || 'Your application was not approved. Please review and resubmit with complete information.'}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={12} /> Please update your application below and resubmit.
              </p>
            </div>
          </div>
        )}

        {role === 'mentor'
          ? <MentorOnboardingForm />
          : <EmployerOnboardingForm />
        }
      </>
    );
  }

  // ─── SUBMITTED: Show "Under Review" screen ───────────────────────
  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #eef1f4', padding: '60px 40px', textAlign: 'center' }}>
      {/* Animated clock icon */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        border: '3px solid #fbbf24',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
        animation: 'pulse 2s ease-in-out infinite',
      }}>
        <Clock size={36} color="#d97706" />
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e24', marginBottom: 10 }}>Application Under Review</h2>
      <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 440, margin: '0 auto 8px', lineHeight: 1.7 }}>
        Your {role === 'mentor' ? 'mentor' : 'employer'} application has been submitted and is currently being reviewed by our admin team.
      </p>
      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 32 }}>
        This usually takes <strong style={{ color: '#374151' }}>1–2 business days</strong>. You'll have full access once approved.
      </p>

      {/* What's submitted */}
      <div style={{ background: '#f8faf9', borderRadius: 14, padding: '16px 24px', border: '1px solid #eef1f4', display: 'inline-block', textAlign: 'left', marginBottom: 28 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Your Application Includes</p>
        {role === 'mentor' ? (
          <>
            {[
              user?.profileSubmission?.fullName && `✓ Name: ${user.profileSubmission.fullName}`,
              user?.profileSubmission?.currentRole && `✓ Role: ${user.profileSubmission.currentRole}`,
              user?.profileSubmission?.skills?.length > 0 && `✓ Skills: ${user.profileSubmission.skills.join(', ')}`,
              user?.profileSubmission?.cvFile && `✓ CV / Resume uploaded`,
              user?.profileSubmission?.agreedToTerms && `✓ Mentor agreement signed`,
            ].filter(Boolean).map((item, i) => (
              <p key={i} style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>{item}</p>
            ))}
          </>
        ) : (
          <>
            {[
              user?.profileSubmission?.companyName && `✓ Company: ${user.profileSubmission.companyName}`,
              user?.profileSubmission?.industry && `✓ Industry: ${user.profileSubmission.industry}`,
              user?.profileSubmission?.location?.city && `✓ Location: ${user.profileSubmission.location.city}, ${user.profileSubmission.location.country}`,
              user?.profileSubmission?.businessRegFile && `✓ Business certificate uploaded`,
              user?.profileSubmission?.taxId && `✓ Tax ID / TIN provided`,
              user?.profileSubmission?.agreedToTerms && `✓ Employer agreement signed`,
            ].filter(Boolean).map((item, i) => (
              <p key={i} style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>{item}</p>
            ))}
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251,191,36,0.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(251,191,36,0); }
        }
      `}</style>
    </div>
  );
};

export default PendingApprovalBanner;
