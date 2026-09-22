import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { apiGetBadges, apiCreateBadge, apiUpdateBadge, apiDeleteBadge } from '../../api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

const AdminBadges = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', icon: '🏅', color: '#f59e0b' });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await apiGetBadges();
      setBadges(res.data.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setForm({ title: '', description: '', icon: '🏅', color: '#f59e0b' }); setShowModal(true); };
  const openEdit = (badge) => { setEditing(badge); setForm({ title: badge.title, description: badge.description, icon: badge.icon, color: badge.color }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await apiUpdateBadge(editing._id, form);
        toast.success('Badge updated!');
      } else {
        await apiCreateBadge(form);
        toast.success('Badge created!');
      }
      setShowModal(false);
      await load();
    } catch { toast.error('Failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await apiDeleteBadge(id);
      toast.success('Badge deleted');
      await load();
    } catch { toast.error('Failed to delete badge'); }
    finally { setConfirmDelete(null); }
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader
        title="Badge Management"
        subtitle="Create badges to reward student achievements"
        action={<button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> New Badge</button>}
      />

      {badges.length === 0 ? (
        <div className="glass p-12 text-center">
          <div className="text-5xl mb-4">🏅</div>
          <h3 className="font-bold text-white mb-2">No badges yet</h3>
          <p className="text-slate-400 text-sm mb-4">Create your first badge to reward learners!</p>
          <button onClick={openCreate} className="btn-primary">Create Badge</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div key={badge._id} className="glass p-5 text-center relative group">
              <div className="text-4xl mb-2">{badge.icon}</div>
              <h3 className="font-bold text-white text-sm mb-1">{badge.title}</h3>
              <p className="text-xs text-slate-400">{badge.description}</p>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all flex gap-1">
                <button onClick={() => openEdit(badge)} className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300">
                  <Edit size={13} />
                </button>
                <button onClick={() => setConfirmDelete({ id: badge._id, title: badge.title })} className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-900/50 text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Badge' : 'Create Badge'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Badge Icon (emoji)</label>
              <input className="input-field" placeholder="🏅" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
              <input className="input-field" placeholder="Course Completer" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <input className="input-field" placeholder="Awarded for completing a course" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={submitting}>{submitting ? 'Saving...' : 'Save Badge'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {confirmDelete && (
        <Modal title="Delete Badge" onClose={() => setConfirmDelete(null)}>
          <div style={{ textAlign: 'center', padding: '10px 0 20px 0' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={30} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2e24', margin: '0 0 8px 0' }}>Are you sure?</h3>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              You are about to permanently delete the badge <strong>"{confirmDelete.title}"</strong>. This action cannot be undone.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '10px 0', border: '1px solid #d1d5db', background: '#fff', color: '#374151', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button type="button" onClick={() => handleDelete(confirmDelete.id)} style={{ flex: 1, padding: '10px 0', border: 'none', background: '#ef4444', color: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              Yes, Delete
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default AdminBadges;
