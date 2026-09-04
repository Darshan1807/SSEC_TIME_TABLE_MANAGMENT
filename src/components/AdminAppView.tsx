import React, { useState } from 'react';
import { AuthUser } from '../types';
import { StorageService } from '../services/storageService';
import { AdminDashboardView } from './AdminDashboardView';
import { LiveTimetablePreviewModal } from './LiveTimetablePreviewModal';
import {
  ShieldCheck,
  Calendar,
  Database,
  Code,
  Search,
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  RefreshCw,
  LogOut,
  Layers,
  KeyRound
} from 'lucide-react';

interface AdminAppViewProps {
  user: AuthUser | null;
  onLoginSuccess: (user: AuthUser) => void;
  onLogout: () => void;
  onSwitchToPortal: () => void;
  onOpenSearch: () => void;
  onOpenMongoConfig: () => void;
  onOpenCodeViewer: () => void;
}

export const AdminAppView: React.FC<AdminAppViewProps> = ({
  user,
  onLoginSuccess,
  onLogout,
  onSwitchToPortal,
  onOpenSearch,
  onOpenMongoConfig,
  onOpenCodeViewer
}) => {
  // Admin Login state when not authenticated as admin
  const [adminUsername, setAdminUsername] = useState('SSEC.IT.ADMIN');
  const [adminPassword, setAdminPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false);

  const isAdmin = user && user.role === 'admin';

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = adminUsername.trim();
    if (cleanUser === 'SSEC.IT.ADMIN' && adminPassword === 'Admin@ssecit') {
      const adminUser: AuthUser = {
        role: 'admin',
        id: 'admin_root',
        name: 'SSEC IT Administrator',
        identifier: 'SSEC.IT.ADMIN',
        department: 'Information Technology'
      };
      StorageService.setAuth(adminUser);
      onLoginSuccess(adminUser);
    } else {
      setErrorMessage('Invalid Administrator credentials! Please verify username and secret passkey.');
    }
  };

  const handleFillTestCreds = () => {
    setAdminUsername('SSEC.IT.ADMIN');
    setAdminPassword('Admin@ssecit');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Top Admin App Header Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Left Brand with Admin Badge */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-sky-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20 border border-sky-400/30">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-base sm:text-lg font-bold leading-tight tracking-tight text-slate-900 flex items-center gap-1.5">
                    SSEC <span className="text-sky-600 font-extrabold">Admin Central</span>
                  </h1>
                  <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                    WebApp Mode
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Departmental Administration & Scheduler Suite
                </p>
              </div>
            </div>

            {/* Middle Quick App Switcher Navigation */}
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
              <button
                onClick={onSwitchToPortal}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-all"
                title="Switch to Student & Faculty Timetable Portal"
              >
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>Timetable Portal</span>
              </button>
              <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-sky-800 bg-white shadow-xs border border-slate-200/80">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Admin Panel (Active)</span>
              </div>
            </div>

            {/* Right Tools & Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Return to Timetable Portal Button */}
              <button
                onClick={onSwitchToPortal}
                className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold transition-all shadow-xs"
                title="Switch to Student / Faculty Timetable Portal Webapp"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden sm:inline">Timetable Portal</span>
                <span className="sm:hidden">Portal</span>
              </button>

              {isAdmin && (
                <>
                  {/* Live Timetable Preview Button */}
                  <button
                    onClick={() => setIsLivePreviewOpen(true)}
                    className="flex items-center space-x-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs"
                    title="Simulate live student and faculty view"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-600" />
                    <span className="hidden md:inline">Live Portal Preview</span>
                  </button>

                  {/* Search */}
                  <button
                    onClick={onOpenSearch}
                    className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all shadow-xs"
                    title="Global Timetable Search"
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  {/* Admin User Badge & Logout */}
                  <div className="flex items-center space-x-2 pl-1">
                    <div className="hidden md:flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
                      <div className="w-6 h-6 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                        AD
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-800 block leading-tight">Root Admin</span>
                        <span className="text-[10px] text-sky-600 block font-mono">SSEC.IT.ADMIN</span>
                      </div>
                    </div>
                    <button
                      onClick={onLogout}
                      className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all shadow-xs"
                      title="Sign Out of Admin Console"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-50 text-slate-900">
        {isAdmin ? (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Quick Connection Bar */}
            <div className="bg-white text-slate-800 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <div className="text-xs">
                  <span className="font-bold text-slate-900">Live Interconnect Active:</span>{' '}
                  <span className="text-slate-600">
                    Changes made here sync instantly with the Student & Faculty Timetable Portal.
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsLivePreviewOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border border-slate-200"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-600" />
                  <span>Preview Portal</span>
                </button>
                <button
                  onClick={onSwitchToPortal}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
                >
                  <span>Open Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Dedicated Admin Dashboard View */}
            <AdminDashboardView
              user={user}
              onOpenSearch={onOpenSearch}
              onOpenMongoConfig={onOpenMongoConfig}
              onOpenCodeViewer={onOpenCodeViewer}
            />
          </div>
        ) : (
          /* Admin Security & Authentication Gate */
          <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6 animate-fadeIn">
              
              {/* Header Icon */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-700 text-white mx-auto flex items-center justify-center shadow-lg shadow-sky-500/25">
                  <KeyRound className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Admin Console Access Gate
                </h2>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Sign in with IT department administrator credentials to access the timetable management suite.
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Admin Sign-in Form */}
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admin Username</label>
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="SSEC.IT.ADMIN"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Master Password</label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Quick Autofill Helper */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Authorized Super Admin</span>
                  <button
                    type="button"
                    onClick={handleFillTestCreds}
                    className="text-sky-600 hover:text-sky-700 font-bold hover:underline"
                  >
                    Quick Fill Root Creds
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-sky-500/25 transition-all flex items-center justify-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Unlock Admin Control Suite</span>
                </button>
              </form>

              {/* Back to Timetable Portal link */}
              <div className="pt-4 border-t border-slate-100 text-center">
                <button
                  onClick={onSwitchToPortal}
                  className="text-xs font-semibold text-slate-500 hover:text-sky-600 flex items-center justify-center space-x-1.5 mx-auto transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Student & Faculty Timetable Portal</span>
                </button>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Admin WebApp Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 py-6 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">SSEC Information Technology Department</span>
            <span>•</span>
            <span className="text-slate-500">Admin Control Center</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-500">
            <button onClick={onSwitchToPortal} className="hover:text-sky-600 transition-colors font-medium">
              Return to Timetable Portal
            </button>
            <span>•</span>
            <span>Academic Scheduler Control Suite</span>
          </div>
        </div>
      </footer>

      {/* Live Timetable Preview Modal */}
      <LiveTimetablePreviewModal
        isOpen={isLivePreviewOpen}
        onClose={() => setIsLivePreviewOpen(false)}
        onSwitchToPortal={onSwitchToPortal}
      />
    </div>
  );
};
