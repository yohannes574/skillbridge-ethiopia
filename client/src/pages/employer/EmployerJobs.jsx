import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { apiGetEmployerJobs, apiCreateJob } from '../../api';
import { Briefcase, Plus, X, Loader2, Edit3, MapPin, DollarSign, Clock, CheckCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployerJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    type: 'remote',
    salary: '',
    experienceLevel: 'Entry Level',
    requiredSkills: '',
    description: ''
  });

  const fetchJobs = async () => {
    try {
      const res = await apiGetEmployerJobs();
      setJobs(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const skillsArray = formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      await apiCreateJob({ ...formData, requiredSkills: skillsArray });
      toast.success('Job posted successfully!');
      setShowModal(false);
      setFormData({ title: '', type: 'remote', salary: '', experienceLevel: 'Entry Level', requiredSkills: '', description: '' });
      fetchJobs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, gap: 16 }}>
        <PageHeader title="My Job Postings" subtitle={`You have ${jobs.length} active job listings`} />
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: 'linear-gradient(135deg, #0f172a, #334155)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(15,23,42,0.2)' }}
        >
          <Plus size={18} strokeWidth={3} /> Post New Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 24, padding: '80px 20px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
          <div style={{ width: 80, height: 80, background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Briefcase size={40} color="#94a3b8" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>No Jobs Posted</h3>
          <p style={{ color: '#64748b', fontSize: 15, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>Create your first job listing to start receiving applications from our certified talent pool.</p>
          <button 
            onClick={() => setShowModal(true)}
            style={{ background: '#fff', color: '#0f172a', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, border: '2px solid #e2e8f0', cursor: 'pointer' }}
          >
            Create Posting
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {jobs.map(job => (
            <div key={job._id} style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: 24, display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: '0 0 6px', lineHeight: 1.3 }}>{job.title}</h3>
                <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', background: job.status === 'open' ? '#ecfdf5' : '#f1f5f9', color: job.status === 'open' ? '#059669' : '#64748b' }}>
                  {job.status}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                  <MapPin size={14} /> <span style={{ textTransform: 'capitalize' }}>{job.type}</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                  <DollarSign size={14} /> {job.salary}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                  <Briefcase size={14} /> {job.experienceLevel}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {job.requiredSkills.map(s => (
                  <span key={s} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6 }}>
                    {s}
                  </span>
                ))}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={14} /> {job.pendingApplicationsCount || 0} Applications
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)} />
          <div style={{ background: '#fff', width: '100%', maxWidth: 600, borderRadius: 24, position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Edit3 size={24} color="#3b82f6" /> Post a New Job
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 32, overflowY: 'auto' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Job Title *</label>
                  <input required name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Senior React Developer" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Work Type *</label>
                    <select required name="type" value={formData.type} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#fff' }}>
                      <option value="remote">Remote</option>
                      <option value="in-person">In-Person</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Experience Level *</label>
                    <select required name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#fff' }}>
                      <option value="Entry Level">Entry Level</option>
                      <option value="Junior (1-3 yrs)">Junior (1-3 yrs)</option>
                      <option value="Mid-Level (3-5 yrs)">Mid-Level (3-5 yrs)</option>
                      <option value="Senior (5+ yrs)">Senior (5+ yrs)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Salary / Compensation *</label>
                  <input required name="salary" value={formData.salary} onChange={handleChange} placeholder="e.g. $80,000 - $100,000 or 'Negotiable'" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Required Skills * <span style={{ color: '#94a3b8', fontWeight: 500 }}>(Comma separated)</span></label>
                  <input required name="requiredSkills" value={formData.requiredSkills} onChange={handleChange} placeholder="React, Node.js, TypeScript" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Job Description *</label>
                  <textarea required name="description" value={formData.description} onChange={handleChange} placeholder="Describe the responsibilities and requirements..." rows={5} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical' }} />
                </div>

                <button type="submit" disabled={submitting} style={{ background: '#3b82f6', color: '#fff', padding: '14px 24px', borderRadius: 12, fontWeight: 800, fontSize: 15, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', marginTop: 10 }}>
                  {submitting ? 'Posting Job...' : 'Post Job to Board'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EmployerJobs;
