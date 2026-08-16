import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Job } from '../types';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, CheckCircle, AlertCircle, ArrowRight, ChevronDown } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0 });
  const [topEquipments, setTopEquipments] = useState<{name: string, count: number, jobs: {id: string, title: string, status: string}[]}[]>([]);
  const [expandedEquip, setExpandedEquip] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile) return;
      
      try {
        const jobsRef = collection(db, 'jobs');
        const q = query(jobsRef, orderBy('createdAt', 'desc'), limit(5));
        
        const snapshot = await getDocs(q);
        const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Record<string, any>) } as unknown as Job));
        setRecentJobs(jobs);

        // Calculate simple stats
        const statsQuery = query(jobsRef);
        const statsSnap = await getDocs(statsQuery);
        let p = 0, i = 0, c = 0;
        const equipMap: Record<string, { count: number, jobs: {id: string, title: string, status: string}[] }> = {};
        
        statsSnap.forEach(doc => {
          const data = doc.data() as Job;
          const s = data.status;
          if (s === 'pending') p++;
          else if (s === 'in_progress') i++;
          else if (s === 'completed') c++;
          
          if (data.equipment) {
            if (!equipMap[data.equipment]) {
              equipMap[data.equipment] = { count: 0, jobs: [] };
            }
            equipMap[data.equipment].count++;
            equipMap[data.equipment].jobs.push({ id: doc.id, title: data.title, status: data.status });
          }
        });
        
        const sortedEquips = Object.entries(equipMap)
          .map(([name, val]) => ({ name, count: val.count, jobs: val.jobs }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
          
        setStats({ pending: p, inProgress: i, completed: c });
        setTopEquipments(sortedEquips);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile]);

  if (loading) return <div>Loading dashboard...</div>;

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded shadow-sm border border-slate-200 flex items-center gap-4">
      <div className={`p-3 rounded ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      <div className="shrink-0 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {profile?.name?.split(' ')[0]}
        </h1>
        <Link 
          to="/jobs/new" 
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors uppercase tracking-wide"
        >
          New Job
        </Link>
      </div>

      <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Pending Jobs" 
          value={stats.pending} 
          icon={AlertCircle} 
          colorClass="bg-amber-100 text-amber-700" 
        />
        <StatCard 
          title="In Progress" 
          value={stats.inProgress} 
          icon={Clock} 
          colorClass="bg-blue-100 text-blue-700" 
        />
        <StatCard 
          title="Completed" 
          value={stats.completed} 
          icon={CheckCircle} 
          colorClass="bg-emerald-100 text-emerald-700" 
        />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 pt-2">
        <section className="flex-[2] flex flex-col min-h-0 gap-4">
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Recent Jobs</h2>
            <Link to="/jobs" className="text-xs text-blue-600 font-bold hover:underline uppercase">
              View all
            </Link>
          </div>
          
          {recentJobs.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-white rounded border border-slate-200 shrink-0">
              No recent jobs found.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 custom-scrollbar">
              {recentJobs.map(job => (
                <Link key={job.id} to={`/jobs/${job.id}`} className={`block p-4 bg-white border-l-4 shadow-sm rounded flex flex-col gap-2 hover:bg-slate-50 transition-colors
                  ${job.status === 'completed' ? 'border-emerald-500 opacity-70' : 
                    job.status === 'in_progress' ? 'border-blue-500' : 
                    'border-amber-500'}
                `}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">{job.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase
                      ${job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                        job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                        'bg-amber-100 text-amber-700'}
                    `}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Location: {job.location} • Equipment: {job.equipment}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="flex-1 flex flex-col min-h-0 gap-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 shrink-0">Top 5 Equipment</h2>
          {topEquipments.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-white rounded border border-slate-200 shrink-0">
              No equipment data found.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 custom-scrollbar">
              {topEquipments.map((item, index) => {
                const isExpanded = expandedEquip === item.name;
                return (
                <div key={item.name} className="bg-white rounded border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                  <button 
                    onClick={() => setExpandedEquip(isExpanded ? null : item.name)}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors w-full text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                        #{index + 1}
                      </div>
                      <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {item.count} {item.count === 1 ? 'Job' : 'Jobs'}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      {item.jobs.map(job => (
                        <Link 
                          key={job.id} 
                          to={`/jobs/${job.id}`}
                          className={`text-xs px-2.5 py-1.5 rounded border hover:shadow-sm transition-all flex items-center gap-1.5
                            ${job.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 
                              job.status === 'in_progress' ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' : 
                              'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'}
                          `}
                          title={job.title}
                        >
                          <span className="font-medium">{job.title.length > 20 ? job.title.slice(0, 20) + '...' : job.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )})}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
