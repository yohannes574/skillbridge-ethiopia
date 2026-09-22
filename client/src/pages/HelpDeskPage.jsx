import { Link } from 'react-router-dom';
import { ArrowLeft, LifeBuoy, ClipboardList, ShieldCheck, Clock3 } from 'lucide-react';

const HelpDeskPage = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f8faf9', color: '#1a2e24' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#2d6a4f', textDecoration: 'none', fontWeight: 700, marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div style={{ background: 'linear-gradient(135deg, #0f766e, #115e59)', borderRadius: 24, padding: '34px 28px', color: '#fff', marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.6px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', marginBottom: 8 }}>Support Operations</p>
          <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 10, letterSpacing: '-0.8px' }}>Help Desk</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.82)', maxWidth: 720, lineHeight: 1.7 }}>
            For issue tracking and follow-up, use Help Desk flow. Submit clear details to get faster resolution.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginBottom: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ecfeff', border: '1px solid #ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <ClipboardList size={18} color="#0f766e" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>What to Include</h3>
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.65 }}>
              Add exact steps, screenshots if available, expected behavior, and what actually happened.
            </p>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Clock3 size={18} color="#15803d" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Response Targets</h3>
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.65 }}>
              High: within 4 hours, Medium: within 24 hours, Low: within 72 hours.
            </p>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <LifeBuoy size={18} color="#c2410c" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Best Channel</h3>
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.65 }}>
              Use Contact Us for quick questions, Help Desk for technical incidents and tracked follow-up.
            </p>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef2ff', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <ShieldCheck size={18} color="#4338ca" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Safety Issues</h3>
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.65 }}>
              For harassment or severe abuse concerns, submit a report immediately and include all relevant context.
            </p>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14, color: '#065f46', fontWeight: 700 }}>Need direct assistance now?</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/contact-us" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', textDecoration: 'none', padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>Contact Support</Link>
            <Link to="/faq" style={{ background: '#0f766e', color: '#fff', textDecoration: 'none', padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>Read FAQ</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpDeskPage;
