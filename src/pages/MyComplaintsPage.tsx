import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, MapPin, AlertCircle, Eye, ChevronDown, Search } from 'lucide-react';

interface Complaint {
  id: number;
  complaint_id: string;
  type: string;
  location: string;
  ward: string;
  description: string;
  status: string;
  created_at: string;
  photo_url: string | null;
  user_id: string;
  upvotes: number;
}

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

const statusLabel: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetch('/api/complaints?user_id=user_123')
      .then(res => res.json())
      .then(data => {
        setComplaints(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch complaints', err);
        setLoading(false);
      });
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'in_progress':
      case 'assigned':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filtered = activeFilter === 'all'
    ? complaints
    : complaints.filter(c => c.status === activeFilter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-28 md:pb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-stone-900">My Complaints</h2>
        <span className="text-sm text-stone-500 bg-stone-100 px-3 py-1 rounded-full font-medium">
          {filtered.length} {filtered.length === 1 ? 'complaint' : 'complaints'}
        </span>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === f.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-100 shadow-sm">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-stone-500 text-lg font-medium">No complaints found</p>
          <p className="text-stone-400 text-sm mt-1">
            {activeFilter !== 'all' ? 'Try a different filter' : "You haven't reported any issues yet."}
          </p>
          <Link
            to="/report"
            className="inline-block mt-4 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition text-sm"
          >
            Report an Issue
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((complaint, i) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <Link
                to={`/complaint/${complaint.id}`}
                className="block bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover-lift"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-stone-900">{complaint.type}</h3>
                          <span className="text-[10px] font-mono text-stone-400 bg-stone-50 px-2 py-0.5 rounded">
                            {complaint.complaint_id}
                          </span>
                        </div>
                        <p className="text-stone-500 text-sm flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {complaint.location}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 status-${complaint.status} shrink-0`}>
                        {getStatusIcon(complaint.status)}
                        {statusLabel[complaint.status] || complaint.status}
                      </span>
                    </div>
                    <p className="text-stone-600 text-sm line-clamp-2">{complaint.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-stone-400">
                        Reported on {new Date(complaint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-stone-400">▲ {complaint.upvotes}</span>
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <Eye className="w-3 h-3" /> View Details
                        </span>
                      </div>
                    </div>
                  </div>
                  {complaint.photo_url && (
                    <div className="w-full md:w-40 h-28 rounded-xl overflow-hidden shrink-0">
                      <img src={complaint.photo_url} alt="Evidence" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
