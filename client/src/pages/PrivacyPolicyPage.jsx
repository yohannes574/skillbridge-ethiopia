import React from 'react';
import { Shield, Lock, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f8faf9', color: '#1a2e24', fontFamily: "'Inter', sans-serif", paddingTop: 40, paddingBottom: 80 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
        
        {/* Navigation */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#2d6a4f', textDecoration: 'none', fontWeight: 600, fontSize: 14, marginBottom: 32 }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #2d6a4f, #40916c)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(45,106,79,0.2)' }}>
            <Shield size={32} />
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#1a2e24', marginBottom: 12, letterSpacing: '-0.5px' }}>Privacy Policy</h1>
          <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 500, margin: '0 auto' }}>Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content Box */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '48px 56px', border: '1px solid #eef1f4', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
          
          <div style={{ marginBottom: 32, padding: '16px 20px', background: '#e8f5e9', borderRadius: 12, border: '1px solid #c8e6c9', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <FileText size={24} color="#2d6a4f" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a2e24', margin: '0 0 4px 0' }}>Academic Context Notice</h3>
              <p style={{ fontSize: 14, color: '#2d6a4f', margin: 0, lineHeight: 1.5 }}>
                SkillBridge is a university graduation project. The platform is designed for educational and demonstration purposes. No real monetary transactions take place, and we do not sell or monetize your data.
              </p>
            </div>
          </div>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a2e24', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              1. Information We Collect
            </h2>
            <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.7, marginBottom: 12 }}>
              When you register as a Student, Mentor, or Employer on SkillBridge, we collect basic profile information necessary to facilitate the platform's core functionalities. This includes your name, email address, password (which is securely hashed), and any biographical data or skills you voluntarily provide in your profile.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a2e24', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              2. How We Use Your Data
            </h2>
            <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.7, marginBottom: 12 }}>
              Your information is exclusively used for:
            </p>
            <ul style={{ paddingLeft: 20, fontSize: 15, color: '#4b5563', lineHeight: 1.7 }}>
              <li style={{ marginBottom: 8 }}>Authenticating your account and keeping your sessions secure.</li>
              <li style={{ marginBottom: 8 }}>Connecting students with appropriate mentors and employers.</li>
              <li style={{ marginBottom: 8 }}>Tracking academic and mentorship progress (like course completions and quiz scores).</li>
              <li style={{ marginBottom: 8 }}>Evaluating the technical success of this graduation project.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a2e24', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              3. Data Protection & Security
            </h2>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={18} color="#4b5563" /></div>
              <p style={{ margin: 0, fontSize: 15, color: '#4b5563', lineHeight: 1.7, flex: 1 }}>
                All passwords are cryptographically hashed before being stored in our database. We employ standard web security practices to protect the integrity of the demonstration platform.
              </p>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a2e24', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              4. Data Deletion
            </h2>
            <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.7, marginBottom: 12 }}>
              Because this is an academic project, the entire database—including all user accounts, uploaded courses, and mock portfolios—will be permanently wiped upon the completion of the academic evaluation phase. If you wish to delete your data sooner, you may contact the administrative team directly.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
