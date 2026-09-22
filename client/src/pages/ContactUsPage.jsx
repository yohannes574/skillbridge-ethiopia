import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ContactUsPage = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    reason: 'general',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Your message was received. We will respond within 24 hours.');
    setForm({ name: '', email: '', reason: 'general', message: '' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf9', color: '#1a2e24' }}>
      <div style={{ maxWidth: 1050, margin: '0 auto', padding: '40px 24px 80px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#2d6a4f', textDecoration: 'none', fontWeight: 700, marginBottom: 24 }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20 }}>
          <div style={{ background: 'linear-gradient(150deg, #1a2e24 0%, #24553d 100%)', borderRadius: 24, color: '#fff', padding: '34px 28px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.6px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Support</p>
            <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 10, letterSpacing: '-0.8px' }}>Contact Us</h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.82)', lineHeight: 1.7, marginBottom: 24 }}>
              Send us your question or issue. We usually reply within one business day.
            </p>

            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={16} />
                <span style={{ fontSize: 14 }}>support@skillbridge-et.com</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Phone size={16} />
                <span style={{ fontSize: 14 }}>+251 9XX XXX XXX</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <MessageCircle size={16} />
                <span style={{ fontSize: 14 }}>Mon-Fri, 8:30 AM to 6:00 PM</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 24, padding: 24, display: 'grid', gap: 14 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Full Name</span>
              <input required value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '11px 12px', fontSize: 14, outline: 'none' }} />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Email</span>
              <input type="email" required value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '11px 12px', fontSize: 14, outline: 'none' }} />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Reason</span>
              <select value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '11px 12px', fontSize: 14, outline: 'none', background: '#fff' }}>
                <option value="general">General Question</option>
                <option value="technical">Technical Issue</option>
                <option value="account">Account Problem</option>
                <option value="report">Safety / Report Follow-up</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Message</span>
              <textarea required rows={6} value={form.message} onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))} style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '11px 12px', fontSize: 14, outline: 'none', resize: 'vertical' }} />
            </label>

            <button type="submit" style={{ marginTop: 4, background: 'linear-gradient(135deg, #166534, #15803d)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 14px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
