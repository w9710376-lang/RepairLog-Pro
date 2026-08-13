import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wrench } from 'lucide-react';

export default function Login() {
  const { user, login } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Wrench className="w-10 h-10" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-slate-900 uppercase tracking-tight">
          RepairLog Pro
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 uppercase tracking-widest">
          Technician repair job history
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          <button
            onClick={login}
            className="w-full flex justify-center py-3 px-4 rounded-lg shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
