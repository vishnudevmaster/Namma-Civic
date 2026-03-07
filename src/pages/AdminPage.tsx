import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CheckCircle2, Clock, AlertCircle, MapPin, Filter, Eye, UserCheck, TrendingUp, BarChart3, Users } from 'lucide-react';
import { useUser, useOrganization, useAuth } from '@clerk/clerk-react';

interface Complaint {
  id: number;
  complaint_id: string;
  type: string;
  location: string;
  ward: string;
  description: string;
  status: string;
  assigned_to: string;
  created_at: string;
  photo_url: string | null;
  upvotes: number;
}

interface Analytics {
  byType: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
  byWard: { name: string; value: number }[];
  summary: { total: number; resolved: number; pending: number; inProgress: number };
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#64748b', '#ec4899'];

const statusLabel: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_OPTIONS = ['submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'closed'];

export default function AdminPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { organization, memberships } = useOrganization({
    memberships: { pageSize: 100 }
  });

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState<'queue' | 'analytics'>('queue');

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterType]);

  const fetchData = async () => {
    try {
      let url = '/api/complaints?';
      if (filterStatus !== 'all') url += `status=${filterStatus}&`;
      if (filterType !== 'all') url += `type=${filterType}&`;

      const [compRes, statRes] = await Promise.all([
        fetch(url),
        fetch('/api/analytics'),
      ]);
      const compData = await compRes.json();
      const statData = await statRes.json();
      setComplaints(compData);
      setAnalytics(statData);
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/complaints/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      fetchData();
    } catch (error: any) {
      console.error('Failed to update status', error);
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const assignComplaint = async (id: number) => {
    // If the organization is loaded, we could potentially show a dropdown.
    // For now, let's keep it simple: Ask who to assign to, defaulting to the current user's name
    const defaultName = user?.fullName || user?.firstName || 'Admin';
    const name = window.prompt('Enter assignee name:', defaultName);

    if (!name) return;
    try {
      const token = await getToken();
      const response = await fetch(`/api/complaints/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'assigned', assigned_to: name }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      fetchData();
    } catch (error: any) {
      console.error('Failed to assign', error);
      alert(`Failed to assign complaint: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const stats = analytics?.summary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6 pb-28 md:pb-8"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-900">Admin Dashboard</h2>
          <p className="text-stone-500 text-sm mt-1">Manage complaints and view analytics</p>
        </div>
        {/* Tab Toggle */}
        <div className="flex bg-stone-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'queue' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'
              }`}
          >
            <span className="flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> Queue</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'
              }`}
          >
            <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Analytics</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <p className="text-xs text-stone-400 uppercase tracking-wider font-medium">Total</p>
            <p className="text-3xl font-bold text-stone-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <p className="text-xs text-stone-400 uppercase tracking-wider font-medium">Pending</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <p className="text-xs text-stone-400 uppercase tracking-wider font-medium">In Progress</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <p className="text-xs text-stone-400 uppercase tracking-wider font-medium">Resolved</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.resolved}</p>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Complaints by Type (Pie) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
              <h3 className="text-lg font-semibold text-stone-800 mb-4">Complaints by Type</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.byType} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {analytics.byType.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Complaints by Status (Bar) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
              <h3 className="text-lg font-semibold text-stone-800 mb-4">Complaints by Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.byStatus}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} />
                    <YAxis axisLine={false} tickLine={false} fontSize={11} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} cursor={{ fill: '#f9fafb' }} />
                    <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* By Ward */}
          {analytics.byWard.length > 0 && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
              <h3 className="text-lg font-semibold text-stone-800 mb-4">Top Wards by Complaints</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.byWard} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" axisLine={false} tickLine={false} fontSize={11} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={100} fontSize={11} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} cursor={{ fill: '#f9fafb' }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'queue' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2">
              <Filter className="w-4 h-4 text-stone-400" />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="text-sm text-stone-700 bg-transparent focus:outline-none font-medium"
              >
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{statusLabel[s]}</option>
                ))}
              </select>
            </div>
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
          </div>

          {/* Complaint Queue Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900">Complaint Queue</h3>
              <span className="text-sm text-stone-500">{complaints.length} complaints</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 font-medium">ID / Issue</th>
                    <th className="px-5 py-3 font-medium">Location</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Upvotes</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Assigned</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {complaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link to={`/complaint/${complaint.id}`} className="group">
                          <div className="font-medium text-stone-900 group-hover:text-emerald-600 transition-colors">{complaint.type}</div>
                          <div className="text-[10px] font-mono text-stone-400 mt-0.5">{complaint.complaint_id}</div>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-stone-600">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{complaint.location}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-stone-600 text-sm">
                        {new Date(complaint.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-stone-700">▲ {complaint.upvotes}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={complaint.status}
                          onChange={(e) => updateStatus(complaint.id, e.target.value)}
                          className={`text-xs font-semibold uppercase rounded-lg px-2.5 py-1.5 focus:ring-emerald-500 focus:ring-2 border-0 status-${complaint.status}`}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{statusLabel[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-stone-600">
                        {complaint.assigned_to || (
                          <span className="text-stone-400 italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => assignComplaint(complaint.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Assign
                          </button>
                          <Link
                            to={`/complaint/${complaint.id}`}
                            className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
