import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, CheckCircle2, FileText, TrendingUp, Users } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const COLORS = ['#6425E8', '#3B82F6', '#16A34A', '#F59E0B', '#EC4899', '#EF4444'];

export const AnalyticsPage: React.FC = () => {
  const { jobs, applications, shortlisted, rankedCandidates, candidatePool } = useApp();

  const totalApps = applications.length;
  const resumesAnalyzed = Math.max(candidatePool.length, rankedCandidates.length);
  const shortlistedCount = shortlisted.length;
  const conversionRate =
    totalApps > 0 ? Math.round((shortlistedCount / totalApps) * 100) : 0;

  const jobDistribution = jobs.slice(0, 6).map((j) => ({
    name: j.title.length > 16 ? `${j.title.slice(0, 15)}…` : j.title,
    applicants: applications.filter((a) => a.jobId === j.id).length || 1,
  }));

  const scoreBuckets = [
    { range: '90–100%', count: rankedCandidates.filter((c) => c.matchScore >= 90).length },
    {
      range: '80–89%',
      count: rankedCandidates.filter((c) => c.matchScore >= 80 && c.matchScore < 90).length,
    },
    {
      range: '70–79%',
      count: rankedCandidates.filter((c) => c.matchScore >= 70 && c.matchScore < 80).length,
    },
    { range: '<70%', count: rankedCandidates.filter((c) => c.matchScore < 70).length },
  ];

  const statusCounts = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected']
    .map((st) => ({
      name: st,
      value: applications.filter((a) => a.status === st).length,
    }))
    .filter((s) => s.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Recruitment Analytics
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Track application volume, AI match score distribution, and hiring funnel conversion rates.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Job Applications',
            value: totalApps,
            icon: <Users className="w-5 h-5 text-[#6425E8]" />,
            bg: 'bg-indigo-50 dark:bg-indigo-950/60',
          },
          {
            label: 'Resumes Analyzed',
            value: resumesAnalyzed,
            icon: <FileText className="w-5 h-5 text-blue-600" />,
            bg: 'bg-blue-50 dark:bg-blue-950/60',
          },
          {
            label: 'Shortlisted Candidates',
            value: shortlistedCount,
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
            bg: 'bg-emerald-50 dark:bg-emerald-950/60',
          },
          {
            label: 'Shortlist Conversion Rate',
            value: `${conversionRate}%`,
            icon: <TrendingUp className="w-5 h-5 text-amber-500" />,
            bg: 'bg-amber-50 dark:bg-amber-950/60',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex items-center gap-3.5"
          >
            <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#6425E8]" />
            Job-wise Candidate Distribution
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jobDistribution} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="applicants" name="Candidates" fill="#6425E8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-white mb-4">
            Application Pipeline Breakdown
          </h2>
          <div className="h-64">
            {statusCounts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusCounts}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={4}
                  >
                    {statusCounts.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No application pipeline data yet.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-12 bg-white dark:bg-[#16122B] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-white mb-4">
            Candidate Match Score Distribution
          </h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreBuckets} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6425E8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6425E8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Candidates"
                  stroke="#6425E8"
                  strokeWidth={2.5}
                  fill="url(#scoreAreaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
