import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapPin, ThumbsUp, ArrowLeft, Clock, CheckCircle2, AlertCircle, User, Calendar, Tag, Hash, ChevronRight } from 'lucide-react';

interface Complaint {
  id: number;
  complaint_id: string;
  type: string;
  location: string;
  ward: string;
  description: string;
  status: string;
  photo_url: string | null;
  resolved_photo_url: string | null;
  user_id: string;
  reporter_name: string;
  reporter_phone: string;
  reporter_email: string;
  assigned_to: string;
  admin_notes: string;
  upvotes: number;
  upvoted_by: string;
  created_at: string;
  updated_at: string;
}

const STATUS_FLOW = [
  { key: 'submitted', label: 'Submitted', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
  { key: 'under_review', label: 'Under Review', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'assigned', label: 'Assigned', icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-sky-500', bg: 'bg-sky-50' },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
  { key: 'closed', label: 'Closed', icon: CheckCircle2, color: 'text-stone-400', bg: 'bg-stone-50' },
];

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/complaints/${id}`)
      .then(r => r.json())
      .then(data => {
        setComplaint(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch complaint', err);
        setLoading(false);
      });
  }, [id]);

  const handleUpvote = async () => {
    if (!complaint) return;
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'user_123' }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComplaint(updated);
      }
    } catch (err) {
      console.error('Upvote error:', err);
    }
  };

  const isUpvoted = () => {
    if (!complaint) return false;
    try {
      const upvotedBy = JSON.parse(complaint.upvoted_by || '[]');
      return upvotedBy.includes('user_123');
    } catch { return false; }
  };

  const getAdminNotes = () => {
    if (!complaint) return [];
    try {
      return JSON.parse(complaint.admin_notes || '[]');
    } catch { return []; }
  };

  const currentStatusIndex = complaint
    ? STATUS_FLOW.findIndex(s => s.key === complaint.status)
    : -1;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-stone-500 text-lg font-medium">Complaint not found</p>
        <Link to="/" className="text-emerald-600 hover:underline mt-2 inline-block text-sm">
          Go back home
        </Link>
      </div>
    );
  }

  const upvoted = isUpvoted();
  const adminNotes = getAdminNotes();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto pb-28 md:pb-8"
    >
      {/* Back button */}
      <Link
        to="/community"
        className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-700 text-sm font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Feed
      </Link>

      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        {/* Photo */}
        {complaint.photo_url && (
          <div className="w-full h-56 md:h-72 bg-stone-100">
            <img src={complaint.photo_url} alt="Issue evidence" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-2xl font-bold text-stone-900">{complaint.type}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider status-${complaint.status}`}>
                  {STATUS_FLOW.find(s => s.key === complaint.status)?.label || complaint.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-stone-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" /> {complaint.complaint_id}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(complaint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Upvote Button */}
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all shrink-0 ${
                upvoted
                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200'
                  : 'bg-stone-100 text-stone-600 border-2 border-transparent hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              <ThumbsUp className={`w-5 h-5 ${upvoted ? 'fill-current' : ''}`} />
              <span>{complaint.upvotes} Upvotes</span>
            </button>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-stone-50 rounded-xl p-4">
              <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-1">Location</p>
              <p className="text-sm font-medium text-stone-800 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-stone-400" /> {complaint.location}
              </p>
            </div>
            {complaint.ward && (
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-1">Ward</p>
                <p className="text-sm font-medium text-stone-800">{complaint.ward}</p>
              </div>
            )}
            <div className="bg-stone-50 rounded-xl p-4">
              <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-1">Reported By</p>
              <p className="text-sm font-medium text-stone-800 flex items-center gap-1">
                <User className="w-4 h-4 text-stone-400" /> {complaint.reporter_name}
              </p>
            </div>
            <div className="bg-stone-50 rounded-xl p-4">
              <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-1">Category</p>
              <p className="text-sm font-medium text-stone-800 flex items-center gap-1">
                <Tag className="w-4 h-4 text-stone-400" /> {complaint.type}
              </p>
            </div>
            {complaint.assigned_to && (
              <div className="bg-blue-50 rounded-xl p-4 sm:col-span-2">
                <p className="text-xs text-blue-400 uppercase tracking-wider font-medium mb-1">Assigned To</p>
                <p className="text-sm font-medium text-blue-800">{complaint.assigned_to}</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-stone-700 leading-relaxed">{complaint.description}</p>
          </div>

          {/* Status Timeline */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">Status Timeline</h3>
            <div className="space-y-0">
              {STATUS_FLOW.map((s, i) => {
                const isActive = i <= currentStatusIndex;
                const isCurrent = i === currentStatusIndex;
                const Icon = s.icon;
                return (
                  <div key={s.key} className="flex gap-4">
                    {/* Timeline dot and line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isCurrent
                          ? `${s.bg} ${s.color} ring-4 ring-opacity-20 ${s.color.replace('text-', 'ring-')}`
                          : isActive
                            ? `${s.bg} ${s.color}`
                            : 'bg-stone-100 text-stone-300'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {i < STATUS_FLOW.length - 1 && (
                        <div className={`w-0.5 h-8 ${isActive && i < currentStatusIndex ? 'bg-emerald-300' : 'bg-stone-200'}`} />
                      )}
                    </div>
                    {/* Label */}
                    <div className={`pb-8 ${isCurrent ? 'font-semibold' : ''}`}>
                      <p className={`text-sm ${isActive ? 'text-stone-900' : 'text-stone-400'}`}>
                        {s.label}
                        {isCurrent && <span className="ml-2 text-xs font-normal text-emerald-600">(Current)</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Admin Notes */}
          {adminNotes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Admin Notes</h3>
              <div className="space-y-3">
                {adminNotes.map((note: any, i: number) => (
                  <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-sm text-amber-800">{note.note}</p>
                    <p className="text-xs text-amber-500 mt-1">
                      {note.author} • {new Date(note.timestamp).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved Photo */}
          {complaint.resolved_photo_url && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Resolution Photo</h3>
              <img src={complaint.resolved_photo_url} alt="Resolved" className="w-full h-48 object-cover rounded-xl" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
