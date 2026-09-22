import React from 'react';
import { BookOpen, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfServicePage = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f8faf9', color: '#1a2e24', fontFamily: "'Inter', sans-serif", paddingTop: 40, paddingBottom: 80 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
        
        {/* Navigation */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#2d6a4f', textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 32 }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #1565c0, #1e3a8a)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(21,101,192,0.2)' }}>
            <BookOpen size={32} />
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#1a2e24', marginBottom: 12, letterSpacing: '-0.5px' }}>Terms of Service</h1>
          <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 500, margin: '0 auto' }}>Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content Box */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '48px 56px', border: '1px solid #eef1f4', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
          
          <div style={{ marginBottom: 32, padding: '16px 20px', background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe', display: 'flex', gap: 14, alignItems: 'center' }}>
            <CheckCircle size={24} color="#1d4ed8" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 14, color: '#1e40af', margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
              By registering an account on SkillBridge, you acknowledge that this is a final-year academic project.
            </p>
          </div>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a2e24', marginBottom: 16 }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.7, marginBottom: 12 }}>
              By accessing and using SkillBridge, you accept and agree to be bound by the terms and provisions of this agreement. Since this is a graduation project built for evaluation, you agree to interact with the platform respectfully and not attempt to exploit or maliciously attack the demonstration servers.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a2e24', marginBottom: 16 }}>
              2. User Obligations
            </h2>
            <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.7, marginBottom: 12 }}>
              If you are testing this application as a Mentor or Employer, you are responsible for any content you upload. You agree not to upload offensive, inappropriate, or copyrighted material without permission. As a Student, you agree not to submit spam during quizzes, report submissions, or mentorship requests.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a2e24', marginBottom: 16 }}>
              3. Service Availability
            </h2>
            <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.7, marginBottom: 12 }}>
              SkillBridge is hosted on academic and free-tier infrastructure. We do not guarantee 100% uptime, and the service may be taken offline at any point after the academic grading period has concluded. 
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a2e24', marginBottom: 16 }}>
              4. Disclaimer of Warranties
            </h2>
            <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.7, marginBottom: 12 }}>
              The platform is provided "as is" without any guarantees. The developer assumes no liability for data loss, service interruptions, or any consequences arising from the use of this academic prototype. Any career alignments or certificates generated within the app hold no legal or real-world accreditations.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
