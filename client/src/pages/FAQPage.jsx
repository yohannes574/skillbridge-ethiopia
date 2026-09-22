import { Link } from 'react-router-dom';
import { ChevronDown, CircleHelp, ArrowLeft } from 'lucide-react';

const faqItems = [
  {
    category: 'Account & Access',
    q: 'I cannot log in to my account. What should I do?',
    a: 'Check your email and password first. If the issue continues, use Contact Us or Help Desk and include your account email plus the exact error message.',
  },
  {
    category: 'Courses',
    q: 'How do I enroll in a course?',
    a: 'Go to Browse Courses, open your preferred course, then submit an enrollment request. You can start learning once it is approved.',
  },
  {
    category: 'Mentor Support',
    q: 'How do I report a mentor issue?',
    a: 'Inside active learning pages, use the report option and select the category. Admin will review and notify you about the outcome.',
  },
  {
    category: 'Certificates',
    q: 'When will my certificate be available?',
    a: 'After course completion and review flow, certificates appear in your Certificates area once approved.',
  },
  {
    category: 'Jobs',
    q: 'How do interview alerts work?',
    a: 'When an interview starts, both sides receive a live alert for the first 3 minutes until each side joins the interview room.',
  },
  {
    category: 'Technical',
    q: 'The page is not updating after changes. What can I do?',
    a: 'Try a hard refresh (Ctrl+F5). If you still see outdated content, clear browser cache for this site and reload.',
  },
];

const FAQPage = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f8faf9', color: '#1a2e24' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#2d6a4f', textDecoration: 'none', fontWeight: 700, marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div style={{ background: 'linear-gradient(135deg, #1a2e24, #2d6a4f)', borderRadius: 24, padding: '34px 28px', color: '#fff', marginBottom: 28 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.6px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Support Center</p>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 10, letterSpacing: '-0.8px' }}>Frequently Asked Questions</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', maxWidth: 720, lineHeight: 1.7 }}>
            Quick answers to the most common questions from students, mentors, and employers.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          {faqItems.map((item, idx) => (
            <details key={`${item.q}-${idx}`} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 18px' }}>
              <summary style={{ listStyle: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>{item.category}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>{item.q}</p>
                </div>
                <ChevronDown size={18} color="#64748b" />
              </summary>
              <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.7, marginTop: 12 }}>{item.a}</p>
            </details>
          ))}
        </div>

        <div style={{ marginTop: 28, background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CircleHelp size={18} color="#047857" />
            <p style={{ fontSize: 14, color: '#065f46', fontWeight: 700 }}>Still need help?</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/contact-us" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', textDecoration: 'none', padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>Contact Us</Link>
            <Link to="/help-desk" style={{ background: '#047857', color: '#fff', textDecoration: 'none', padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>Open Help Desk</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
