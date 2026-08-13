import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardList, LayoutDashboard, LogOut, Wrench, FileBarChart, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Jobs', path: '/jobs', icon: ClipboardList },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Reports', path: '/reports', icon: FileBarChart });
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <Wrench className="w-6 h-6" />
          <span>RepairLog Pro</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-500">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-200 transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="hidden md:flex items-center gap-3 p-6 border-b border-slate-800">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-white font-bold tracking-tight text-lg uppercase">RepairLog Pro</span>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 p-3 rounded text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white cursor-pointer'}
                  `}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'opacity-80' : 'opacity-60'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center justify-between p-2 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white uppercase">
                  {profile?.name?.substring(0, 2) || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{profile?.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">{profile?.role}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 w-full text-left rounded text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5 opacity-60" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
