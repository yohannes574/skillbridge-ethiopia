import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import { apiGetReports, apiUpdateReport } from '../../api';
import toast from 'react-hot-toast';
import { FileText, Check, ShieldAlert, ShieldOff, UserX } from 'lucide-react';

const categoryLabel = {
  harassment: 'Harassment',
  spam: 'Spam',
  abuse: 'Abuse',
  inappropriate_content: 'Inappropriate Content',
  cheating: 'Cheating',
  fake_information: 'Fake Information',
  other: 'Other',
};

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [notes, setNotes] = useState({});
  const [actioning, setActioning] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await apiGetReports();
      setReports(res.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleAction = async (id, action, note = '') => {
    setActioning(id);
    try {
      await apiUpdateReport(id, { status: 'reviewed', adminNote: note, action });
      toast.success(action === 'block' ? 'User restricted' : action === 'warn' ? 'Warning sent' : 'Report marked as reviewed');
      await load();
    } catch { toast.error('Failed'); }
    finally { setActioning(null); }
  };

  const filtered = reports.filter((r) => filter === 'all' || r.status === filter);

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title="Reports" subtitle="Student-submitted content reports" />

      {/* Filter */}
      <div className="flex gap-1 p-1 rounded-lg bg-slate-800/50 mb-6 w-fit">
        {['all', 'pending', 'reviewed'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${filter === s ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {s} {s !== 'all' && <span className="ml-1 text-xs opacity-70">({reports.filter((r) => r.status === s).length})</span>}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((report) => (
          <div key={report._id} className="glass p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-white">{report.studentId?.name}</p>
                  <span className={`badge ${report.status === 'pending' ? 'badge-amber' : 'badge-green'}`}>{report.status}</span>
                  <span className="badge badge-slate">{report.contentType}</span>
                  <span className="badge badge-blue">{categoryLabel[report.category] || report.category}</span>
                </div>
                <p className="text-xs text-slate-400">Course: {report.courseId?.title}</p>
                <p className="text-xs text-slate-400">Reported user: {report.reportedUserId?.name || 'Unknown'} {report.reportedUserId?.isBlocked ? '(restricted)' : ''}</p>
                <p className="text-xs text-slate-400">Total reports on this user: {report.reportedUserReportCount || 0}</p>
                <p className="text-sm text-slate-300 mt-2 p-3 bg-slate-800/50 rounded-lg">"{report.message}"</p>
                {report.adminNote && (
                  <p className="text-xs text-emerald-400 mt-2">Note: {report.adminNote}</p>
                )}
                <p className="text-xs text-slate-600 mt-2">{new Date(report.createdAt).toLocaleString()}</p>
              </div>
              {report.status === 'pending' && (
                <div className="flex flex-col gap-2 flex-shrink-0 min-w-48">
                  <input
                    className="input-field text-xs py-1.5 w-48"
                    placeholder="Admin note (optional)"
                    value={notes[report._id] || ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [report._id]: e.target.value }))}
                  />
                  <button
                    onClick={() => handleAction(report._id, 'warn', notes[report._id] || '')}
                    disabled={actioning === report._id}
                    className="btn-amber text-xs flex items-center gap-1 justify-center"
                  >
                    <ShieldAlert size={13} /> Warn User
                  </button>
                  <button
                    onClick={() => handleAction(report._id, 'block', notes[report._id] || '')}
                    disabled={actioning === report._id}
                    className="btn-danger text-xs flex items-center gap-1 justify-center"
                  >
                    <UserX size={13} /> Restrict User
                  </button>
                  <button
                    onClick={() => handleAction(report._id, 'reviewed', notes[report._id] || '')}
                    disabled={actioning === report._id}
                    className="btn-primary text-xs flex items-center gap-1 justify-center"
                  >
                    <Check size={13} /> Mark Reviewed
                  </button>
                </div>
              )}
            </div>
            {report.reportedUserReportCount >= 3 && (
              <div className="mt-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm flex items-center gap-2">
                <ShieldAlert size={16} /> This user has reached the warning threshold. Review immediately.
              </div>
            )}
            {report.reportedUserReportCount >= 4 && (
              <div className="mt-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
                <ShieldOff size={16} /> Escalated review needed. Consider restriction from the system.
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="glass p-10 text-center">
            <FileText size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No reports found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
