import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowRight, AlertTriangle, Trash2, Droplets, Lightbulb, Construction, Car, MoreHorizontal, TrendingUp, CheckCircle2, Clock, MapPin, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface Complaint {
  id: number;
  complaint_id: string;
  type: string;
  location: string;
  ward: string;
  description: string;
  status: string;
  upvotes: number;
  reporter_name: string;
  created_at: string;
}

interface Analytics {
  summary: {
    total: number;
    resolved: number;
    pending: number;
    inProgress: number;
  };
}

const categoryIcons: Record<string, { icon: any; bg: string; color: string }> = {
  Pothole: { icon: AlertTriangle, bg: 'bg-orange-100', color: 'text-orange-600' },
  Garbage: { icon: Trash2, bg: 'bg-stone-100', color: 'text-stone-600' },
  Water: { icon: Droplets, bg: 'bg-blue-100', color: 'text-blue-600' },
  Streetlight: { icon: Lightbulb, bg: 'bg-yellow-100', color: 'text-yellow-600' },
  Drainage: { icon: Construction, bg: 'bg-purple-100', color: 'text-purple-600' },
  Traffic: { icon: Car, bg: 'bg-red-100', color: 'text-red-600' },
  Other: { icon: MoreHorizontal, bg: 'bg-teal-100', color: 'text-teal-600' },
};

const statusLabel: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function HomePage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(setAnalytics).catch(console.error);
    fetch('/api/complaints').then(r => r.json()).then((data: Complaint[]) => setRecentComplaints(data.slice(0, 5))).catch(console.error);
  }, []);

  const stats = analytics?.summary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-24 md:pb-0"
    >
      {/* Hero Section */}
      <section className="hero-gradient rounded-3xl p-8 md:p-14 text-center space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-stone-900 leading-tight"
          >
            Report Civic Issues <br className="hidden md:block" />
            <span className="gradient-text">Fast & Transparently</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto mt-4"
          >
            Smart Civic System helps you report potholes, garbage, water issues, and more.
            Track resolution in real-time. Make your city better.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-3 mt-6"
          >
            <Link
              to="/report"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3.5 rounded-2xl font-semibold hover:shadow-lg hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2"
            >
              Report an Issue <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/community"
              className="bg-white text-stone-700 px-8 py-3.5 rounded-2xl font-semibold border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all flex items-center justify-center gap-2"
            >
              View Community Feed
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      {stats && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-stone-500">Total Issues</span>
            </div>
            <p className="text-3xl font-bold text-stone-900 animate-count">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-stone-500">Resolved</span>
            </div>
            <p className="text-3xl font-bold text-green-600 animate-count">{stats.resolved}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-stone-500">Pending</span>
            </div>
            <p className="text-3xl font-bold text-orange-600 animate-count">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Construction className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-stone-500">In Progress</span>
            </div>
            <p className="text-3xl font-bold text-blue-600 animate-count">{stats.inProgress}</p>
          </div>
        </motion.section>
      )}

      {/* Category Cards */}
      <section>
        <h2 className="text-xl font-bold text-stone-900 mb-4">Report by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(categoryIcons).map(([name, { icon: Icon, bg, color }]) => (
            <Link
              key={name}
              to={`/report?type=${name}`}
              className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex flex-col items-center text-center gap-3 hover-lift cursor-pointer"
            >
              <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-sm text-stone-800">{name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Complaints */}
      {recentComplaints.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-stone-900">Recent Complaints</h2>
            <Link to="/community" className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentComplaints.map((c, i) => {
              const catIcon = categoryIcons[c.type] || categoryIcons.Other;
              const CatIcon = catIcon.icon;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <Link
                    to={`/complaint/${c.id}`}
                    className="block bg-white rounded-2xl p-4 shadow-sm border border-stone-100 hover-lift"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 ${catIcon.bg} ${catIcon.color} rounded-xl flex items-center justify-center shrink-0`}>
                        <CatIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-stone-900 text-sm">{c.type}</h3>
                          <span className="text-[10px] font-mono text-stone-400">{c.complaint_id}</span>
                        </div>
                        <p className="text-xs text-stone-500 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" /> {c.location}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider status-${c.status}`}>
                          {statusLabel[c.status] || c.status}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          ▲ {c.upvotes}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-100">
        <h2 className="text-2xl font-bold text-stone-900 mb-8 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Report', desc: 'Take a photo, drop a pin, and describe the issue in under 60 seconds.', emoji: '📝' },
            { step: '2', title: 'Track', desc: 'Get a unique complaint ID. Follow status updates from submission to resolution.', emoji: '📊' },
            { step: '3', title: 'Resolve', desc: 'City officials fix the issue. You confirm and close — or the community upvotes for priority.', emoji: '✅' },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.5 }}
              className="text-center space-y-3"
            >
              <div className="text-4xl mb-2">{item.emoji}</div>
              <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold mx-auto">
                {item.step}
              </div>
              <h3 className="text-lg font-bold text-stone-900">{item.title}</h3>
              <p className="text-stone-600 text-sm max-w-xs mx-auto">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Assistant CTA */}
      <section className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-8 md:p-12 text-center space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-900">Need Help? Ask our AI Assistant</h2>
        <p className="text-emerald-700 max-w-xl mx-auto">
          Use the chat button in the bottom right to ask questions about city services, track your complaints, or report an issue via voice.
        </p>
      </section>
    </motion.div>
  );
}
