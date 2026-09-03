import React, { useState, useMemo } from 'react';
import { ActivityLog, ActivityActionType, ActivityCategory } from '../types';
import { StorageService } from '../services/storageService';
import {
  History,
  Search,
  Filter,
  Trash2,
  Download,
  FileSpreadsheet,
  FileJson,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  MapPin,
  Calendar,
  Bell,
  Database,
  ShieldCheck,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

interface ActivityLogViewProps {
  logs: ActivityLog[];
  onRefresh: () => void;
  onClearLogs?: () => void;
  onShowFlash?: (msg: string, type?: 'success' | 'danger') => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({
  logs,
  onRefresh,
  onClearLogs,
  onShowFlash
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const itemsPerPage = 12;

  // Filtered & Sorted logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch =
          searchTerm === '' ||
          log.target_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.performed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.target_category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesAction = selectedAction === 'ALL' || log.action_type === selectedAction;
        const matchesCategory = selectedCategory === 'ALL' || log.target_category === selectedCategory;
        const matchesStatus = selectedStatus === 'ALL' || log.status === selectedStatus;

        return matchesSearch && matchesAction && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [logs, searchTerm, selectedAction, selectedCategory, selectedStatus, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = logs.length;
    const creates = logs.filter(l => l.action_type === 'CREATE').length;
    const deletes = logs.filter(l => l.action_type === 'DELETE').length;
    const statusChanges = logs.filter(l => l.action_type === 'STATUS_CHANGE').length;
    const systemEvents = logs.filter(l => l.action_type === 'SYSTEM' || l.action_type === 'SECURITY').length;
    const userEvents = logs.filter(l => l.target_category === 'USER' || l.target_category === 'STUDENT' || l.target_category === 'PROFESSOR').length;

    return { total, creates, deletes, statusChanges, systemEvents, userEvents };
  }, [logs]);

  // Formatting helpers
  const formatTimeAgo = (isoString: string) => {
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffMs = now.getTime() - past.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return past.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch {
      return 'Recent';
    }
  };

  const formatExactDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const getActionBadge = (action: ActivityActionType) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            CREATE
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            DELETE
          </span>
        );
      case 'STATUS_CHANGE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            STATUS
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            UPDATE
          </span>
        );
      case 'SECURITY':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            SECURITY
          </span>
        );
      case 'SYSTEM':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            SYSTEM
          </span>
        );
    }
  };

  const getCategoryIcon = (category: ActivityCategory) => {
    switch (category) {
      case 'USER':
        return <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />;
      case 'STUDENT':
        return <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'PROFESSOR':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'SUBJECT':
        return <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
      case 'CLASSROOM':
        return <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'TIMETABLE':
        return <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'NOTIFICATION':
        return <Bell className="w-3.5 h-3.5 text-pink-600 shrink-0" />;
      case 'DATABASE':
      default:
        return <Database className="w-3.5 h-3.5 text-slate-600 shrink-0" />;
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    let csv = 'Timestamp,Action,Category,Target Name,Performed By,Status,Details\n';
    filteredLogs.forEach(l => {
      csv += `"${l.timestamp}","${l.action_type}","${l.target_category}","${l.target_name.replace(/"/g, '""')}","${l.performed_by}","${l.status}","${l.details.replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SSEC_Admin_Activity_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    if (onShowFlash) onShowFlash('Activity logs exported to CSV successfully.', 'success');
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SSEC_Admin_Activity_Log_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    if (onShowFlash) onShowFlash('Activity logs exported to JSON successfully.', 'success');
  };

  const handleConfirmClear = () => {
    StorageService.clearActivityLogs();
    setShowClearConfirm(false);
    onRefresh();
    if (onShowFlash) onShowFlash('Activity logs cleared successfully.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white rounded-2xl p-6 shadow-sm border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-sky-500/20 rounded-xl border border-sky-400/30 text-sky-400">
                <History className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Admin Activity <span className="text-sky-400">Audit Trail</span>
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl font-normal leading-relaxed">
              Transparent, immutable record tracking critical administrative operations including user registrations, deletions, role updates, and timetable changes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onRefresh}
              className="bg-slate-700/80 hover:bg-slate-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border border-slate-600 shadow-xs"
              title="Refresh logs from database"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
              title="Export as CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
              title="Export as JSON audit log"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 border border-rose-700/50 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
              title="Clear all activity logs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Logs</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5 pt-5 border-t border-slate-700/60">
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-semibold block">Total Events</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{stats.total}</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-3">
            <span className="text-[11px] text-emerald-400 font-semibold block">Created Records</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{stats.creates}</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-3">
            <span className="text-[11px] text-rose-400 font-semibold block">Deleted Records</span>
            <span className="text-xl font-bold text-rose-400 mt-0.5 block">{stats.deletes}</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-3">
            <span className="text-[11px] text-amber-400 font-semibold block">Status Updates</span>
            <span className="text-xl font-bold text-amber-400 mt-0.5 block">{stats.statusChanges}</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-3">
            <span className="text-[11px] text-sky-400 font-semibold block">User Operations</span>
            <span className="text-xl font-bold text-sky-400 mt-0.5 block">{stats.userEvents}</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-3">
            <span className="text-[11px] text-purple-400 font-semibold block">System / Security</span>
            <span className="text-xl font-bold text-purple-400 mt-0.5 block">{stats.systemEvents}</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by target, admin, or details..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5"
            >
              &times;
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Action Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-semibold">Action:</span>
            <select
              value={selectedAction}
              onChange={e => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-800 font-semibold text-xs border-none focus:ring-0 cursor-pointer"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="DELETE">Delete</option>
              <option value="STATUS_CHANGE">Status Change</option>
              <option value="UPDATE">Update</option>
              <option value="SYSTEM">System</option>
              <option value="SECURITY">Security</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-500 font-semibold">Target:</span>
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-800 font-semibold text-xs border-none focus:ring-0 cursor-pointer"
            >
              <option value="ALL">All Entities</option>
              <option value="USER">User</option>
              <option value="STUDENT">Student</option>
              <option value="PROFESSOR">Professor</option>
              <option value="TIMETABLE">Timetable</option>
              <option value="SUBJECT">Subject</option>
              <option value="CLASSROOM">Classroom</option>
              <option value="NOTIFICATION">Notification</option>
              <option value="DATABASE">Database</option>
            </select>
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all"
            title={`Sort ${sortOrder === 'desc' ? 'Oldest First' : 'Newest First'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* Main Activity Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Category & Target</th>
                <th className="py-3 px-4">Details / Description</th>
                <th className="py-3 px-4">Admin Performer</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-sky-50/40 transition-colors group"
                  >
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <span className="font-semibold text-slate-900 block leading-tight">
                            {formatTimeAgo(log.timestamp)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatExactDate(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getActionBadge(log.action_type)}
                    </td>

                    {/* Category & Target */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
                          {getCategoryIcon(log.target_category)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate max-w-[200px]" title={log.target_name}>
                            {log.target_name}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                            {log.target_category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Details */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <p className="text-slate-700 text-xs font-normal leading-relaxed break-words">
                        {log.details}
                      </p>
                    </td>

                    {/* Performer */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                        <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {log.performed_by}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {log.status === 'SUCCESS' && (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>SUCCESS</span>
                        </span>
                      )}
                      {log.status === 'FAILED' && (
                        <span className="inline-flex items-center space-x-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[11px] font-bold border border-rose-200">
                          <AlertCircle className="w-3 h-3" />
                          <span>FAILED</span>
                        </span>
                      )}
                      {log.status === 'WARNING' && (
                        <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[11px] font-bold border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>WARNING</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-slate-700">No activity logs recorded</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {searchTerm || selectedAction !== 'ALL' || selectedCategory !== 'ALL'
                        ? 'No logs matched the selected filter criteria. Try clearing the search or filters.'
                        : 'Administrative actions (like creating or deleting users) will appear here automatically.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredLogs.length > 0 && (
          <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
            <div>
              Showing <span className="font-bold text-slate-900">{Math.min(filteredLogs.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{' '}
              <span className="font-bold text-slate-900">{Math.min(filteredLogs.length, currentPage * itemsPerPage)}</span> of{' '}
              <span className="font-bold text-slate-900">{filteredLogs.length}</span> recorded log entries
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clear Logs Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Clear Activity Logs?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              This will permanently purge the current audit trail history ({logs.length} entries) from local database storage. A system audit entry noting this clearing action will be retained for security transparency.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all"
              >
                Yes, Clear All Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
