import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { Calendar, Search, MapPin, UserCheck, BookOpen, Clock, X, ExternalLink, GraduationCap, Filter } from 'lucide-react';

interface LiveTimetablePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToPortal: () => void;
}

export const LiveTimetablePreviewModal: React.FC<LiveTimetablePreviewModalProps> = ({
  isOpen,
  onClose,
  onSwitchToPortal
}) => {
  const [selectedSem, setSelectedSem] = useState<number>(6);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const timetables = StorageService.getTimetables();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const filteredSlots = timetables.filter(t => {
    const matchSem = selectedSem === 0 || t.semester === selectedSem;
    const matchDay = selectedDay === 'All' || t.day === selectedDay;
    const matchQuery =
      searchQuery === '' ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.professor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.room_number.toLowerCase().includes(searchQuery.toLowerCase());

    return matchSem && matchDay && matchQuery;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-white p-5 px-6 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-2xl text-sky-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-900">Live Timetable Portal Simulation</h3>
                <span className="bg-sky-100 text-sky-700 border border-sky-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  STUDENT & FACULTY VIEW
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Preview how the published schedule is rendered for students and professors in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onSwitchToPortal();
              }}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <span>Open Timetable Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all border border-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* Semester Filter */}
            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-slate-500 font-semibold">Semester:</span>
              <select
                value={selectedSem}
                onChange={(e) => setSelectedSem(Number(e.target.value))}
                className="bg-transparent text-slate-800 font-bold border-none text-xs focus:ring-0 cursor-pointer"
              >
                <option value={0}>All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            {/* Day Filter */}
            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-semibold">Day:</span>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="bg-transparent text-slate-800 font-bold border-none text-xs focus:ring-0 cursor-pointer"
              >
                <option value="All">All Days</option>
                {days.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search subject, professor, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Timetable Slots Display */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {filteredSlots.length === 0 ? (
            <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No Timetable Slots Found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {timetables.length === 0
                  ? 'No timetable slots have been created yet. Add slots using the Timetable Scheduler in the Admin Panel.'
                  : 'No slots match the current filter or search criteria.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSlots.map(slot => (
                <div
                  key={slot.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-sky-300 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                      Sem {slot.semester} • {slot.day}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      slot.session_type === 'Lab'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {slot.session_type || 'Theory'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{slot.subject}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{slot.time_slot}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-700 font-semibold truncate max-w-[150px]">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{slot.professor}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-500 text-[11px] font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      <span>{slot.room_number}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 px-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{filteredSlots.length}</strong> active slots out of{' '}
            <strong className="text-slate-800">{timetables.length}</strong> in database
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-all"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
