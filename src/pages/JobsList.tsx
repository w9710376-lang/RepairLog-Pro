import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Job } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Search, Plus, Filter } from 'lucide-react';

export default function JobsList() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchJobs = async () => {
      if (!profile) return;
      try {
        const jobsRef = collection(db, 'jobs');
        let q = query(jobsRef, orderBy('createdAt', 'desc'));
        
        if (profile.role !== 'admin') {
          q = query(jobsRef, where('technicianId', '==', profile.id), orderBy('createdAt', 'desc'));
        }
        
        const snapshot = await getDocs(q);
        const fetchedJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
        setJobs(fetchedJobs);
      } catch (error) {
        console.error("Error fetching jobs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [profile]);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.technicianName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div>Loading jobs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Repair Jobs</h1>
        <Link 
          to="/jobs/new" 
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors uppercase tracking-wide"
        >
          <Plus className="w-5 h-5" />
          New Job
        </Link>
      </div>

      <div className="bg-white p-4 rounded shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by title, equipment, or technician..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-600"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="p-4 font-bold">Job details</th>
                <th className="p-4 hidden md:table-cell font-bold">Equipment</th>
                <th className="p-4 hidden sm:table-cell font-bold">Date</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No jobs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredJobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <Link to={`/jobs/${job.id}`} className="block">
                        <p className="font-bold text-slate-800 text-sm">{job.title}</p>
                        <p className="text-xs font-mono text-slate-400 mt-1">#{job.id.slice(0, 8).toUpperCase()}</p>
                        {profile?.role === 'admin' && (
                          <p className="text-xs text-slate-500 mt-1">Tech: {job.technicianName}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-1 md:hidden">{job.equipment}</p>
                      </Link>
                    </td>
                    <td className="p-4 hidden md:table-cell text-sm text-slate-600">
                      {job.equipment}
                    </td>
                    <td className="p-4 hidden sm:table-cell text-sm text-slate-600">
                      {format(job.date, 'MMM d, yyyy')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap
                        ${job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                          job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                          'bg-amber-100 text-amber-700'}
                      `}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
