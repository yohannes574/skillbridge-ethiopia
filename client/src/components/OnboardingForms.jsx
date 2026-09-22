import { useState } from 'react';
import { apiSubmitProfile } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowRight, ArrowLeft, CheckCircle, Upload, Plus, X } from 'lucide-react';

const fieldLabel = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #eef1f4', fontSize: 14, color: '#1a2e24', background: '#fafbfc', fontFamily: "'Inter', sans-serif", outline: 'none', transition: 'border 0.2s' };
const onFocus = (e) => (e.target.style.borderColor = '#2d6a4f');
const onBlur = (e) => (e.target.style.borderColor = '#eef1f4');

// ─── Step Indicator ───────────────────────────────────────────────
const StepBar = ({ steps, current }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
    {steps.map((s, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700,
            background: i < current ? '#2d6a4f' : i === current ? '#1a2e24' : '#f1f5f9',
            color: i <= current ? '#fff' : '#9ca3af',
            transition: 'all 0.3s',
          }}>
            {i < current ? <CheckCircle size={16} /> : i + 1}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: i <= current ? '#1a2e24' : '#9ca3af' }}>{s}</span>
        </div>
        {i < steps.length - 1 && (
          <div style={{ flex: 1, height: 2, background: i < current ? '#2d6a4f' : '#eef1f4', margin: '0 12px', transition: 'background 0.3s' }} />
        )}
      </div>
    ))}
  </div>
);

// ─── Skill Tag Input ──────────────────────────────────────────────
const SkillTagInput = ({ skills, setSkills }) => {
  const [val, setVal] = useState('');
  const add = () => {
    const trimmed = val.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills([...skills, trimmed]);
    setVal('');
  };
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          placeholder="e.g. React, Python, Figma"
          value={val}
          onChange={e => setVal(e.target.value)}
          onFocus={onFocus} onBlur={onBlur}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
        />
        <button type="button" onClick={add} style={{ padding: '11px 16px', borderRadius: 10, background: '#1a2e24', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13 }}>
          <Plus size={15} />
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {skills.map(s => (
          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 50, background: '#e8f5e9', color: '#2d6a4f', fontSize: 13, fontWeight: 600 }}>
            {s}
            <button type="button" onClick={() => setSkills(skills.filter(x => x !== s))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2d6a4f', display: 'flex', padding: 0 }}><X size={13} /></button>
          </span>
        ))}
        {skills.length === 0 && <p style={{ fontSize: 12, color: '#9ca3af' }}>No skills added yet. Press Enter or comma to add.</p>}
      </div>
    </div>
  );
};

// ─── File Upload Field ────────────────────────────────────────────
const FileUploader = ({ label, value, onChange, accept, hint }) => {
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange({ name: file.name, type: file.type, data: ev.target.result });
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <label style={fieldLabel}>{label}</label>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        borderRadius: 12, border: `2px dashed ${value ? '#2d6a4f' : '#d1d5db'}`,
        background: value ? '#f0faf3' : '#fafbfc', cursor: 'pointer', transition: 'all 0.2s',
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: value ? '#e8f5e9' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {value ? <CheckCircle size={20} color="#2d6a4f" /> : <Upload size={20} color="#9ca3af" />}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: value ? '#2d6a4f' : '#374151' }}>
            {value ? value.name : 'Click to upload file'}
          </p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{hint || 'PDF, DOC, JPG up to 5MB'}</p>
        </div>
        <input type="file" accept={accept || '.pdf,.doc,.docx,.jpg,.png'} style={{ display: 'none' }} onChange={handleFile} />
      </label>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MENTOR ONBOARDING FORM
// ═══════════════════════════════════════════════════════════════════
export const MentorOnboardingForm = () => {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.name || '',
    professionalBackground: '',
    yearsOfExperience: '',
    currentRole: '',
    skills: [],
    cvFile: null,
    agreed: false,
  });

  const steps = ['Personal Info', 'Skills', 'Documents', 'Agreement'];

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const canNext = () => {
    if (step === 0) return form.fullName.trim().length > 0 && form.currentRole.trim().length > 0;
    if (step === 1) return form.skills.length >= 1;
    if (step === 2) return true; // CV is optional — can proceed without it
    if (step === 3) return form.agreed;
    return true;
  };

  // Helper: what does the user still need to fill on this step?
  const hint = () => {
    if (step === 0) {
      const missing = [];
      if (!form.fullName.trim()) missing.push('Full Name');
      if (!form.currentRole.trim()) missing.push('Current Role');
      return missing.length ? `Please fill in: ${missing.join(', ')}` : '';
    }
    if (step === 1 && form.skills.length === 0) return 'Add at least 1 skill to continue';
    if (step === 3 && !form.agreed) return 'Please check the agreement box to submit';
    return '';
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiSubmitProfile({
        type: 'mentor',
        fullName: form.fullName,
        professionalBackground: form.professionalBackground,
        yearsOfExperience: form.yearsOfExperience,
        currentRole: form.currentRole,
        skills: form.skills,
        cvFile: form.cvFile,
        agreedToTerms: form.agreed,
        submittedAt: new Date().toISOString(),
      });
      toast.success('Application submitted! We\'ll review it shortly.');
      updateUser({ submissionStatus: 'submitted' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #eef1f4', padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 50, padding: '5px 14px', marginBottom: 12 }}>
          <span style={{ fontSize: 12 }}>⏳</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>Account Pending — Complete Your Profile</span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e24', marginBottom: 6 }}>Mentor Application</h2>
        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>Fill in your professional details so our admin team can verify and approve your account.</p>
      </div>

      <StepBar steps={steps} current={step} />

      {/* Step 0 – Personal Info */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={fieldLabel}>Full Name *</label>
            <input style={inputStyle} value={form.fullName} onChange={e => set('fullName', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Your full name" />
          </div>
          <div>
            <label style={fieldLabel}>Current Role / Job Title *</label>
            <input style={inputStyle} value={form.currentRole} onChange={e => set('currentRole', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="e.g. Senior Software Engineer at Safaricom" />
          </div>
          <div>
            <label style={fieldLabel}>Years of Experience</label>
            <select style={inputStyle} value={form.yearsOfExperience} onChange={e => set('yearsOfExperience', e.target.value)} onFocus={onFocus} onBlur={onBlur}>
              <option value="">Select experience level (optional)</option>
              <option value="1-2 years">1–2 years</option>
              <option value="3-5 years">3–5 years</option>
              <option value="5-10 years">5–10 years</option>
              <option value="10+ years">10+ years</option>
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Professional Background <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional — help the admin understand you)</span></label>
            <textarea
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
              placeholder="Describe your professional background, education, and what makes you a great mentor..."
              value={form.professionalBackground}
              onChange={e => set('professionalBackground', e.target.value)}
              onFocus={onFocus} onBlur={onBlur}
            />
          </div>
        </div>
      )}

      {/* Step 1 – Skills */}
      {step === 1 && (
        <div>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>Add at least one skill you will teach on SkillBridge (e.g. React, Python, UI Design).</p>
          <SkillTagInput skills={form.skills} setSkills={s => set('skills', s)} />
        </div>
      )}

      {/* Step 2 – CV Upload */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Upload your CV or resume to help the admin verify your expertise. <span style={{ color: '#2d6a4f', fontWeight: 600 }}>This is optional — you can skip this step.</span></p>
          <FileUploader
            label="CV / Resume (Optional)"
            value={form.cvFile}
            onChange={v => set('cvFile', v)}
            accept=".pdf,.doc,.docx"
            hint="PDF or Word document, max 5MB — optional but recommended"
          />
          {!form.cvFile && (
            <div style={{ textAlign: 'center', padding: '10px', background: '#f0faf3', borderRadius: 10, border: '1px solid #d5e8da' }}>
              <p style={{ fontSize: 13, color: '#2d6a4f', fontWeight: 600 }}>✓ No file? No problem — you can still continue without uploading.</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3 – Agreement */}
      {step === 3 && (
        <div>
          <div style={{ background: '#f8faf9', borderRadius: 14, padding: 20, border: '1px solid #eef1f4', marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a2e24', marginBottom: 12 }}>Mentor Agreement</h3>
            {[
              'I will provide accurate and complete information in this application.',
              'I will create high-quality, original course content relevant to my listed skills.',
              'I will actively respond to student questions and enrollment requests.',
              'I agree to the SkillBridge platform\'s code of conduct and terms of service.',
              'I understand that false information may result in account termination.',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <CheckCircle size={16} color="#2d6a4f" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.agreed}
              onChange={e => set('agreed', e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, accentColor: '#2d6a4f', flexShrink: 0 }}
            />
            <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
              I have read and agree to all the terms above. I confirm that all information provided is accurate and complete.
            </span>
          </label>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid #eef1f4' }}>
        <button
          type="button"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 50, border: '1px solid #eef1f4', background: '#fafbfc', color: step === 0 ? '#d1d5db' : '#374151', fontWeight: 600, fontSize: 14, cursor: step === 0 ? 'not-allowed' : 'pointer' }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          {hint() && (
            <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 500 }}>⚠ {hint()}</p>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 50, background: canNext() ? 'linear-gradient(135deg, #2d6a4f, #1a4731)' : '#d1d5db', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: canNext() ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canNext() || loading}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 28px', borderRadius: 50, background: canNext() ? 'linear-gradient(135deg, #2d6a4f, #1a4731)' : '#d1d5db', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : <><CheckCircle size={16} /> Submit Application</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// EMPLOYER ONBOARDING FORM
// ═══════════════════════════════════════════════════════════════════
export const EmployerOnboardingForm = () => {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    companyDescription: '',
    website: '',
    industry: '',
    companySize: '',
    location: '',
    city: '',
    country: '',
    businessRegFile: null,
    taxId: '',
    agreed: false,
  });

  const steps = ['Company Info', 'Location', 'Verification', 'Agreement'];
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const canNext = () => {
    if (step === 0) return form.companyName.trim().length > 0 && form.industry.trim().length > 0;
    if (step === 1) return form.city.trim().length > 0 && form.country.trim().length > 0;
    if (step === 2) return form.businessRegFile !== null || form.taxId.trim().length > 0;
    if (step === 3) return form.agreed;
    return true;
  };

  const hint = () => {
    if (step === 0) {
      const missing = [];
      if (!form.companyName.trim()) missing.push('Company Name');
      if (!form.industry.trim()) missing.push('Industry');
      return missing.length ? `Please fill in: ${missing.join(', ')}` : '';
    }
    if (step === 1) {
      const missing = [];
      if (!form.city.trim()) missing.push('City');
      if (!form.country.trim()) missing.push('Country');
      return missing.length ? `Please fill in: ${missing.join(', ')}` : '';
    }
    if (step === 2 && !form.businessRegFile && !form.taxId.trim()) return 'Upload a document OR enter a Tax ID to continue';
    if (step === 3 && !form.agreed) return 'Please check the agreement box to submit';
    return '';
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiSubmitProfile({
        type: 'employer',
        companyName: form.companyName,
        companyDescription: form.companyDescription,
        website: form.website,
        industry: form.industry,
        companySize: form.companySize,
        location: { address: form.location, city: form.city, country: form.country },
        businessRegFile: form.businessRegFile,
        taxId: form.taxId,
        agreedToTerms: form.agreed,
        submittedAt: new Date().toISOString(),
      });
      toast.success('Application submitted! We\'ll review it shortly.');
      updateUser({ submissionStatus: 'submitted' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #eef1f4', padding: '32px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 50, padding: '5px 14px', marginBottom: 12 }}>
          <span style={{ fontSize: 12 }}>⏳</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>Account Pending — Complete Your Company Profile</span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e24', marginBottom: 6 }}>Employer Application</h2>
        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>Provide your company details so our admin team can verify and approve your account.</p>
      </div>

      <StepBar steps={steps} current={step} />

      {/* Step 0 – Company Info */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={fieldLabel}>Company / Organization Name *</label>
            <input style={inputStyle} value={form.companyName} onChange={e => set('companyName', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="e.g. Safaricom PLC" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={fieldLabel}>Industry *</label>
              <select style={inputStyle} value={form.industry} onChange={e => set('industry', e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                <option value="">Select industry</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance & Banking</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail & E-commerce</option>
                <option value="Consulting">Consulting</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={fieldLabel}>Company Size</label>
              <select style={inputStyle} value={form.companySize} onChange={e => set('companySize', e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                <option value="">Select size</option>
                <option value="1-10">1–10 employees</option>
                <option value="11-50">11–50 employees</option>
                <option value="51-200">51–200 employees</option>
                <option value="201-1000">201–1,000 employees</option>
                <option value="1000+">1,000+ employees</option>
              </select>
            </div>
          </div>
          <div>
            <label style={fieldLabel}>Website (optional)</label>
            <input style={inputStyle} value={form.website} onChange={e => set('website', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="https://www.yourcompany.com" />
          </div>
          <div>
            <label style={fieldLabel}>Company Description <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional — describe what your company does)</span></label>
            <textarea
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
              placeholder="Briefly describe what your company does and what kind of talent you're looking for..."
              value={form.companyDescription}
              onChange={e => set('companyDescription', e.target.value)}
              onFocus={onFocus} onBlur={onBlur}
            />
          </div>
        </div>
      )}

      {/* Step 1 – Location */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={fieldLabel}>Street Address <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
            <input style={inputStyle} value={form.location} onChange={e => set('location', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="e.g. Bole Road, Friendship Building" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={fieldLabel}>City *</label>
              <input style={inputStyle} value={form.city} onChange={e => set('city', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="e.g. Addis Ababa" />
            </div>
            <div>
              <label style={fieldLabel}>Country *</label>
              <input style={inputStyle} value={form.country} onChange={e => set('country', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="e.g. Ethiopia" />
            </div>
          </div>
        </div>
      )}

      {/* Step 2 – Verification */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Provide at least one form of business verification — either upload a registration certificate or enter your Tax ID.</p>
          <FileUploader
            label="Business Registration Certificate"
            value={form.businessRegFile}
            onChange={v => set('businessRegFile', v)}
            accept=".pdf,.jpg,.png"
            hint="Official business registration document, PDF or image"
          />
          <div>
            <label style={fieldLabel}>OR Tax ID / TIN Number</label>
            <input style={inputStyle} value={form.taxId} onChange={e => set('taxId', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="Your business Tax Identification Number" />
          </div>
        </div>
      )}

      {/* Step 3 – Agreement */}
      {step === 3 && (
        <div>
          <div style={{ background: '#f8faf9', borderRadius: 14, padding: 20, border: '1px solid #eef1f4', marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a2e24', marginBottom: 12 }}>Employer Agreement</h3>
            {[
              'I confirm that all company information provided is accurate and verifiable.',
              'I will use this platform only to connect with certified talent in good faith.',
              'I will not share or misuse any student personal data obtained through SkillBridge.',
              'I agree to the SkillBridge platform\'s terms of service and privacy policy.',
              'I understand that submitting false information will result in immediate account suspension.',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <CheckCircle size={16} color="#6a1b9a" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.agreed}
              onChange={e => set('agreed', e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, accentColor: '#6a1b9a', flexShrink: 0 }}
            />
            <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
              I have read and agree to all the terms above. I confirm all provided information is truthful and verifiable.
            </span>
          </label>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid #eef1f4' }}>
        <button
          type="button"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 50, border: '1px solid #eef1f4', background: '#fafbfc', color: step === 0 ? '#d1d5db' : '#374151', fontWeight: 600, fontSize: 14, cursor: step === 0 ? 'not-allowed' : 'pointer' }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          {hint() && (
            <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 500 }}>⚠ {hint()}</p>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 50, background: canNext() ? 'linear-gradient(135deg, #6a1b9a, #7b1fa2)' : '#d1d5db', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: canNext() ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canNext() || loading}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 28px', borderRadius: 50, background: canNext() ? 'linear-gradient(135deg, #6a1b9a, #7b1fa2)' : '#d1d5db', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : <><CheckCircle size={16} /> Submit Application</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
