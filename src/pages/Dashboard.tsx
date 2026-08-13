import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Job } from '../types';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile) return;
      
      try {
        const jobsRef = collection(db, 'jobs');
        let q;
        
        if (profile.role === 'admin') {
          q = query(jobsRef, orderBy('createdAt', 'desc'), limit(5));
        } else {
          q = query(jobsRef, where('technicianId', '==', profile.id), orderBy('createdAt', 'desc'), limit(5));
        }
        
        const snapshot = await getDocs(q);
        const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
        setRecentJobs(jobs);

        // Calculate simple stats (this would normally be an aggregation or separate queries)
        // For simplicity in this demo, we'll just count from a wider query if needed, 
        // but let's just do an actual query for the counts if possible, or just mock it from the 5 jobs if it's too much.
        // Let's do a simple full fetch for the user to get accurate stats
        let statsQuery;
        if (profile.role === 'admin') {
          statsQuery = query(jobsRef);
        } else {
          statsQuery = query(jobsRef, where('technicianId', '==', profile.id));
        }
        const statsSnap = await getDocs(statsQuery);
        let p = 0, i = 0, c = 0;
        statsSnap.forEach(doc => {
          const s = doc.data().status;
          if (s === 'pending') p++;
          else if (s === 'in_progress') i++;
          else if (s === 'completed') c++;
        });
        setStats({ pending: p, inProgress: i, completed: c });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <section className="flex flex-col gap-4 overflow-hidden pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Recent Jobs</h2>
          <Link to="/jobs" className="text-xs text-blue-600 font-bold hover:underline uppercase">
            View all
          </Link>
        </div>
        
        {recentJobs.length === 0 ? (
          <div className="p-6 text-center text-slate-500 bg-white rounded border border-slate-200">
            No recent jobs found.
          </div>
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto">
            {recentJobs.map(job => (
              <Link key={job.id} to={`/jobs/${job.id}`} className={`block p-4 bg-white border-l-4 shadow-sm rounded flex flex-col gap-2 hover:bg-slate-50 transition-colors
                ${job.status === 'completed' ? 'border-emerald-500 opacity-70' : 
                  job.status === 'in_progress' ? 'border-blue-500' : 
                  'border-amber-500'}
              `}>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono text-slate-400">#{job.id.slice(0, 8).toUpperCase()}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase
                    ${job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                      job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                      'bg-amber-100 text-amber-700'}
                  `}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm leading-tight">{job.title}</h3>
                <p className="text-xs text-slate-500">Location: {job.location} • Equipment: {job.equipment}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
