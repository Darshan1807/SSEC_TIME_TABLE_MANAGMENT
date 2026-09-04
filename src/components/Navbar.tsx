import React, { useState } from 'react';
import { AuthUser, NotificationItem } from '../types';
import { Bell, LogOut, Search, Calendar, ShieldCheck, Mail } from 'lucide-react';

interface NavbarProps {
  user: AuthUser | null;
  notifications: NotificationItem[];
  activeApp?: 'portal' | 'admin';
  onSwitchApp?: (app: 'portal' | 'admin') => void;
  onLogout: () => void;
  onOpenCodeViewer?: () => void;
  onOpenMongoConfig?: () => void;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  notifications,
  activeApp = 'portal',
  onSwitchApp,
  onLogout,
  onOpenCodeViewer,
  onOpenMongoConfig,
  onOpenSearch,
  onOpenProfile
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="bg-white/95 backdrop-blur-md text-slate-800 border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold leading-tight tracking-tight text-slate-900 flex items-center gap-1.5">
                SSEC <span className="text-sky-600 font-extrabold">IT Dept</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Smart Timetable Portal
              </p>
            </div>
          </div>

          {/* Center Search Trigger */}
          {user && (
            <div className="hidden md:flex items-center">
              <button
                id="navbar-search-btn"
                onClick={onOpenSearch}
                className="flex items-center space-x-3 bg-slate-100 hover:bg-sky-50/80 text-slate-600 hover:text-sky-700 px-4 py-2 rounded-full border border-slate-200 hover:border-sky-200 text-xs font-medium transition-all shadow-xs group"
              >
                <Search className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
                <span>Search timetable slots...</span>
                <kbd className="bg-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-mono">⌘K</kbd>
              </button>
            </div>
          )}

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Administrator Button (ONLY on Login & Register page) */}
            {onSwitchApp && activeApp === 'portal' && !user && (
              <button
                type="button"
                id="btn-nav-admin"
                onClick={() => onSwitchApp('admin')}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                title="Administrator Portal"
              >
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Administrator</span>
              </button>
            )}

            {/* Quick Return to Admin Panel (ONLY for Admin users viewing Portal) */}
            {onSwitchApp && activeApp === 'portal' && user?.role === 'admin' && (
              <button
                type="button"
                id="btn-nav-admin-return"
                onClick={() => onSwitchApp('admin')}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                title="Return to Administrator Control Panel"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Admin Panel</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}

            {user && (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    id="navbar-notif-bell"
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    className="p-2 rounded-full text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 border border-slate-200 relative transition-all"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showNotifMenu && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="font-semibold text-xs text-slate-800">Announcements</span>
                        <span className="text-xs bg-sky-100 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full font-medium">
                          {notifications.length} Active
                        </span>
                      </div>
                      <div className="max-h-72 overflow-y-auto space-y-2">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500 font-medium">
                            No active notifications.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                              <div className="flex justify-between items-center">
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                                  n.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-200' :
                                  n.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                  'bg-sky-50 text-sky-600 border border-sky-200'
                                }`}>
                                  {n.priority}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">{n.publish_date}</span>
                              </div>
                              <h5 className="font-semibold text-xs text-slate-900 mt-1">{n.title}</h5>
                              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{n.description}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Role Badge & Profile Trigger */}
                <button
                  id="navbar-profile-btn"
                  onClick={onOpenProfile}
                  className="flex items-center space-x-2.5 bg-slate-100 hover:bg-sky-50 text-slate-800 p-1.5 pr-3 rounded-full border border-slate-200 hover:border-sky-300 transition-all shadow-xs"
                >
                  <div className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center font-bold text-xs text-white shadow-xs">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-semibold leading-none text-slate-900">{user.name}</p>
                    <p className="text-[10px] font-medium text-sky-600 capitalize">{user.role}</p>
                  </div>
                </button>

                {/* Logout Button */}
                <button
                  id="navbar-logout-btn"
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 rounded-full text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};


