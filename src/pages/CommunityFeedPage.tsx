import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ThumbsUp, MapPin, Filter, ArrowUpDown, Eye } from 'lucide-react';

interface Complaint {
  id: number;
  complaint_id: string;
  type: string;
  location: string;
  ward: string;
  description: string;
  status: string;
  upvotes: number;
  upvoted_by: string;
  reporter_name: string;
  created_at: string;
  photo_url: string | null;
}

const statusLabel: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function CommunityFeedPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchComplaints = async () => {
    try {
      let url = '/api/complaints?';
      if (sortBy === 'upvotes') url += 'sort=upvotes&';
      else if (sortBy === 'oldest') url += 'sort=oldest&';
      if (filterType !== 'all') url += `type=${filterType}&`;
      if (filterStatus !== 'all') url += `status=${filterStatus}&`;

      const res = await fetch(url);
      const data = await res.json();
      setComplaints(data);
    } catch (err) {
      console.error('Failed to fetch complaints', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchComplaints();
  }, [sortBy, filterType, filterStatus]);

  const handleUpvote = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/complaints/${id}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'user_123' }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComplaints(prev => prev.map(c => c.id === id ? updated : c));
      }
    } catch (err) {
      console.error('Upvote error:', err);
    }
  };

  const isUpvoted = (complaint: Complaint) => {
    try {
      const upvotedBy = JSON.parse(complaint.upvoted_by || '[]');
      return upvotedBy.includes('user_123');
    } catch { return false; }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-28 md:pb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-stone-900">Community Feed</h2>
          <p className="text-stone-500 text-sm mt-1">All civic issues reported by Bengaluru residents</p>
        </div>
        <span className="text-sm text-stone-500 bg-stone-100 px-3 py-1 rounded-full font-medium">
          {complaints.length} issues
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Sort */}
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2">
          <ArrowUpDown className="w-4 h-4 text-stone-400" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-sm text-stone-700 bg-transparent focus:outline-none font-medium"
          >
            <option value="newest">Newest First</option>
            <option value="upvotes">Most Upvoted</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-sm text-stone-700 bg-transparent focus:outline-none font-medium"
          >
            <option value="all">All Categories</option>
            <option value="Pothole">Pothole</option>
            <option value="Garbage">Garbage</option>
            <option value="Water">Water</option>
            <option value="Streetlight">Streetlight</option>
            <option value="Drainage">Drainage</option>
            <option value="Traffic">Traffic</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-sm text-stone-700 bg-transparent focus:outline-none font-medium"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-100 shadow-sm">
          <div className="text-5xl mb-4">🏙️</div>
          <p className="text-stone-500 text-lg font-medium">No issues found</p>
          <p className="text-stone-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((complaint, i) => {
            const upvoted = isUpvoted(complaint);
            return (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i }}
              >
                <Link
                  to={`/complaint/${complaint.id}`}
                  className="block bg-white rounded-2xl shadow-sm border border-stone-100 hover-lift overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex gap-4">
                      {/* Upvote Column */}
                      <div className="flex flex-col items-center shrink-0">
                        <button
                          onClick={(e) => handleUpvote(e, complaint.id)}
                          className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
                            upvoted
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-stone-50 text-stone-400 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                        >
                          <ThumbsUp className={`w-4 h-4 ${upvoted ? 'fill-current' : ''}`} />
                          <span className="text-xs font-bold mt-0.5">{complaint.upvotes}</span>
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-stone-900">{complaint.type}</h3>
                              <span className="text-[10px] font-mono text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded">
                                {complaint.complaint_id}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" /> {complaint.location}
                            </p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider status-${complaint.status} shrink-0`}>
                            {statusLabel[complaint.status] || complaint.status}
                          </span>
                        </div>
                        <p className="text-sm text-stone-600 line-clamp-2 mb-2">{complaint.description}</p>
                        <div className="flex items-center justify-between text-xs text-stone-400">
                          <span>
                            by {complaint.reporter_name} • {new Date(complaint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Details
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
