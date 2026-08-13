import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Job } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Reports() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
      } catch (error) {
        console.error("Error fetching jobs for reports", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  if (loading) return <div>Loading reports...</div>;

  // Process data for charts
  const statusCounts = { pending: 0, in_progress: 0, completed: 0 };
  const techStats: Record<string, { name: string, jobs: number, totalCost: number }> = {};
  
  let totalPartsCost = 0;

  jobs.forEach(job => {
    // Status
    statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;

    // Tech stats
    if (!techStats[job.technicianId]) {
      techStats[job.technicianId] = { name: job.technicianName, jobs: 0, totalCost: 0 };
    }
    techStats[job.technicianId].jobs += 1;

    // Costs
    const jobPartsCost = job.partsUsed.reduce((sum, part) => sum + (part.cost * part.quantity), 0);
    techStats[job.technicianId].totalCost += jobPartsCost;
    totalPartsCost += jobPartsCost;
  });

  const pieData = [
    { name: 'Pending', value: statusCounts.pending },
    { name: 'In Progress', value: statusCounts.in_progress },
    { name: 'Completed', value: statusCounts.completed },
  ];
  const COLORS = ['#F59E0B', '#3B82F6', '#10B981'];

  const barData = Object.values(techStats);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Admin Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded shadow-sm border border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Jobs</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{jobs.length}</p>
        </div>
        <div className="bg-white p-6 rounded shadow-sm border border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Parts Cost</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">${totalPartsCost.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded shadow-sm border border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Technicians</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{Object.keys(techStats).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Jobs by Status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Jobs per Technician</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="jobs" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
