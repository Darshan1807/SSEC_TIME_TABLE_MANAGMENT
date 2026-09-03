import React, { useState, useMemo } from 'react';
import { RegisteredUser } from '../types';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Filter, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Calendar, 
  GraduationCap, 
  Building2, 
  FileSpreadsheet, 
  FileJson,
  X,
  AlertCircle,
  Database,
  WifiOff,
  ServerCrash,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface RegisteredUsersViewProps {
  users: RegisteredUser[];
  isLoading?: boolean;
  errorState?: {
    hasError: boolean;
    message?: string;
    errorCode?: string;
    fromCache?: boolean;
  } | null;
  currentSimulationMode?: 'none' | 'network_error' | 'db_timeout' | 'server_error';
  onRefresh: (options?: { forceMode?: 'none' | 'network_error' | 'db_timeout' | 'server_error' }) => void;
  onToggleStatus: (user: RegisteredUser) => void;
  onDeleteUser: (user: RegisteredUser) => void;
  onShowFlash: (text: string, type?: 'success' | 'danger') => void;
  onAddToast?: (toast: {
    type: 'success' | 'danger' | 'warning' | 'info';
    title?: string;
    message: string;
    details?: string;
    actionLabel?: string;
    onAction?: () => void;
  }) => void;
}

export const RegisteredUsersView: React.FC<RegisteredUsersViewProps> = ({
  users,
  isLoading = false,
  errorState = null,
  currentSimulationMode = 'none',
  onRefresh,
  onToggleStatus,
  onDeleteUser,
  onShowFlash,
  onAddToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        user.full_name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.identifier.toLowerCase().includes(q) ||
        (user.department && user.department.toLowerCase().includes(q)) ||
        (user.classroom && user.classroom.toLowerCase().includes(q));

      const matchesRole = 
        roleFilter === 'All' || 
        user.role.toLowerCase() === roleFilter.toLowerCase();

      const matchesStatus = 
        statusFilter === 'All' || 
        user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Summary counts
  const totalCount = users.length;
  const studentCount = users.filter(u => u.role === 'student').length;
  const professorCount = users.filter(u => u.role === 'professor').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const activeCount = users.filter(u => u.status === 'Active').length;

  const handleManualRefresh = () => {
    onRefresh({ forceMode: 'none' });
  };

  const handleSimulateFailure = (mode: 'network_error' | 'db_timeout' | 'server_error' | 'none') => {
    onRefresh({ forceMode: mode });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const exportCSV = () => {
    const headers = ['Full Name', 'Role', 'Identifier / Enrollment', 'Email', 'Department / Semester', 'Status', 'Registration Date'];
    const rows = filteredUsers.map(u => [
      `"${u.full_name}"`,
      `"${u.role.toUpperCase()}"`,
      `"${u.identifier}"`,
      `"${u.email}"`,
      `"${u.role === 'student' ? `Sem ${u.semester || '-'} (${u.classroom || '-'})` : (u.department || 'IT')}"`,
      `"${u.status}"`,
      `"${formatDateTime(u.registered_at)}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SSEC_Registered_Users_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowFlash(`Exported ${filteredUsers.length} user records to CSV.`, 'success');
  };

  const exportJSON = () => {
    const cleanUsers = filteredUsers.map(({ ...rest }) => rest);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cleanUsers, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `SSEC_Registered_Users_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowFlash(`Exported ${filteredUsers.length} user records to JSON.`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Metrics */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">Registered Users Directory</h2>
              
              {/* Status Badge */}
              {errorState?.hasError ? (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Offline Cached State ({errorState.errorCode || 'DEGRADED'})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                  <Database className="w-3 h-3 text-emerald-600" />
                  Live MongoDB Atlas Sync
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Complete registry of all registered students, professors, and administrators stored in the system database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              id="btn-refresh-users"
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              title="Fetch latest registered users from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Fetching Users...' : 'Sync Database'}</span>
            </button>

            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className={`font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all border shadow-xs cursor-pointer ${
                showDiagnostics 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Toggle network & database error simulation controls"
            >
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span>Error Diagnostics</span>
            </button>

            <button
              onClick={exportCSV}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
              <span>CSV</span>
            </button>

            <button
              onClick={exportJSON}
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-purple-600" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Bar for Testing Network / DB Errors */}
        {showDiagnostics && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-700" />
                <span className="font-bold text-amber-950">API & Database Fault Tolerance Diagnostics</span>
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                Test how the Admin Panel handles network drops, database timeouts, and server errors gracefully with toasts.
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => handleSimulateFailure('network_error')}
                disabled={isLoading}
                className="bg-white hover:bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <WifiOff className="w-3.5 h-3.5 text-red-600" />
                <span>Simulate Network Failure</span>
              </button>

              <button
                onClick={() => handleSimulateFailure('db_timeout')}
                disabled={isLoading}
                className="bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Database className="w-3.5 h-3.5 text-amber-600" />
                <span>Simulate Database Timeout (504)</span>
              </button>

              <button
                onClick={() => handleSimulateFailure('server_error')}
                disabled={isLoading}
                className="bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <ServerCrash className="w-3.5 h-3.5 text-purple-600" />
                <span>Simulate Internal Error (500)</span>
              </button>

              <button
                onClick={() => handleSimulateFailure('none')}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Restore Normal API Mode</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Alert Banner (When User List Fails to Load) */}
        {errorState?.hasError && (
          <div className="bg-red-50/90 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-red-950">User List API Synchronization Failed</h4>
                  <span className="font-mono text-[10px] bg-red-200/70 text-red-900 px-1.5 py-0.2 rounded font-bold">
                    {errorState.errorCode || 'ERR_FETCH_FAILED'}
                  </span>
                </div>
                <p className="text-red-800 font-medium">
                  {errorState.message || 'Could not communicate with MongoDB server.'}
                </p>
                <p className="text-[11px] text-red-600 font-medium">
                  Displaying {users.length} cached user records from local storage. Actions will queue until connection is restored.
                </p>
              </div>
            </div>

            <button
              onClick={() => onRefresh({ forceMode: 'none' })}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-xs shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* 4 Quick Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 block leading-tight">{totalCount}</span>
              <span className="text-[11px] font-semibold text-slate-500">Total Users</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 block leading-tight">{studentCount}</span>
              <span className="text-[11px] font-semibold text-slate-500">Registered Students</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 block leading-tight">{professorCount}</span>
              <span className="text-[11px] font-semibold text-slate-500">Professors / Faculty</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 block leading-tight">{activeCount}</span>
              <span className="text-[11px] font-semibold text-slate-500">Active Accounts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-user-search"
              placeholder="Search by name, email, enrollment, or staff ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-slate-900 text-xs font-medium focus:border-sky-500 focus:bg-white focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-semibold text-slate-600">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Roles ({totalCount})</option>
                <option value="student">Students ({studentCount})</option>
                <option value="professor">Professors ({professorCount})</option>
                <option value="admin">Admins ({adminCount})</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-600">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {(searchQuery || roleFilter !== 'All' || statusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('All');
                  setStatusFilter('All');
                }}
                className="text-xs text-sky-600 hover:text-sky-800 font-semibold px-2 py-1 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Matching User Records ({filteredUsers.length})
            </h3>
            {isLoading && (
              <span className="inline-flex items-center gap-1 text-[11px] text-sky-600 font-semibold">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Synchronizing...
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {errorState?.hasError ? 'Cached Local Records' : 'Live Mongo Atlas Records'}
          </span>
        </div>

        {isLoading && users.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-700">Connecting to API and MongoDB database...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No registered users found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || roleFilter !== 'All' || statusFilter !== 'All' 
                ? 'No users match your active filter criteria. Try adjusting or clearing your search.'
                : 'No users have registered yet. Newly registered users from the portal will appear here automatically.'}
            </p>
            {(searchQuery || roleFilter !== 'All' || statusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('All');
                  setStatusFilter('All');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition-all mt-2 cursor-pointer"
              >
                Clear Search Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/75 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User / Full Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Identifier / ID</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Academic / Dept Info</th>
                  <th className="py-3 px-4">Registered Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((u) => {
                  const isStudent = u.role === 'student';
                  const isProfessor = u.role === 'professor';
                  const isAdmin = u.role === 'admin';

                  return (
                    <tr key={u.id} className="hover:bg-sky-50/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isStudent 
                              ? 'bg-sky-100 text-sky-700' 
                              : isProfessor 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isStudent && <GraduationCap className="w-4 h-4" />}
                            {isProfessor && <UserCheck className="w-4 h-4" />}
                            {isAdmin && <ShieldCheck className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">{u.full_name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {u.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        {isStudent && (
                          <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 font-bold px-2 py-0.5 rounded-md text-[11px]">
                            Student
                          </span>
                        )}
                        {isProfessor && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-md text-[11px]">
                            Professor
                          </span>
                        )}
                        {isAdmin && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded-md text-[11px]">
                            Admin
                          </span>
                        )}
                      </td>

                      {/* Identifier */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                          {u.identifier}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px] font-medium">{u.email}</span>
                        </div>
                      </td>

                      {/* Academic / Dept info */}
                      <td className="py-3 px-4">
                        {isStudent ? (
                          <div>
                            <span className="font-semibold text-slate-800">Sem {u.semester || 6}</span>
                            <span className="text-slate-500 text-[11px] block">{u.classroom || 'IT-LH-101'}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-slate-800">{u.designation || 'Faculty'}</span>
                            <span className="text-slate-500 text-[11px] block">{u.department || 'Information Technology'}</span>
                          </div>
                        )}
                      </td>

                      {/* Registered Date & Time */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-xs whitespace-nowrap">
                            {formatDateTime(u.registered_at)}
                          </span>
                        </div>
                      </td>

                      {/* Account Status Badge */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onToggleStatus(u)}
                          disabled={isAdmin}
                          title={isAdmin ? 'Super Admin cannot be deactivated' : `Click to toggle: currently ${u.status}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                            u.status === 'Active'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                          } ${isAdmin ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                          <span>{u.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Profile */}
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="p-1.5 bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="View Full Profile Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User */}
                          {!isAdmin && (
                            <button
                              onClick={() => onDeleteUser(u)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition-colors cursor-pointer"
                              title="Delete User Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* USER DETAIL PROFILE MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                  selectedUser.role === 'student'
                    ? 'bg-sky-100 text-sky-700'
                    : selectedUser.role === 'professor'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedUser.role === 'student' && <GraduationCap className="w-6 h-6" />}
                  {selectedUser.role === 'professor' && <UserCheck className="w-6 h-6" />}
                  {selectedUser.role === 'admin' && <ShieldCheck className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedUser.full_name}</h3>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {selectedUser.role} Account Profile
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">
                  {selectedUser.role === 'student' ? 'Enrollment Number' : selectedUser.role === 'professor' ? 'Professor ID' : 'Username'}
                </span>
                <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">{selectedUser.identifier}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Account Status</span>
                <span className={`inline-flex items-center gap-1 font-bold text-xs mt-0.5 ${
                  selectedUser.status === 'Active' ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {selectedUser.status}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl col-span-2">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Email Address</span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {selectedUser.email}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Phone Number</span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {selectedUser.phone || '+91 9800000000'}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Department</span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {selectedUser.department || 'Information Technology'}
                </span>
              </div>

              {selectedUser.role === 'student' && (
                <>
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <span className="text-slate-400 font-medium block text-[10px] uppercase">Enrolled Semester</span>
                    <span className="font-bold text-slate-900 text-xs mt-0.5 block">Semester {selectedUser.semester || 6}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <span className="text-slate-400 font-medium block text-[10px] uppercase">Assigned Classroom</span>
                    <span className="font-bold text-slate-900 text-xs mt-0.5 block">{selectedUser.classroom || 'IT-LH-101'}</span>
                  </div>
                </>
              )}

              {selectedUser.role === 'professor' && (
                <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl col-span-2">
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Academic Designation</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block">{selectedUser.designation || 'Assistant Professor'}</span>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl col-span-2">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Registration Timestamp</span>
                <span className="font-medium text-slate-800 text-xs mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDateTime(selectedUser.registered_at)}
                </span>
              </div>
            </div>

            {/* Security note */}
            <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-[11px] text-sky-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Password and credentials are encrypted securely and never exposed in the directory view.</span>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedUser(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
