import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { Search, X, Calendar, Clock, MapPin, User, BookOpen } from 'lucide-react';

interface TimetableSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimetableSearchModal: React.FC<TimetableSearchModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const timetables = StorageService.getTimetables();
  
  const [query, setQuery] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterSem, setFilterSem] = useState('');

  const filtered = timetables.filter(slot => {
    const matchesQuery = query === '' || 
      slot.subject.toLowerCase().includes(query.toLowerCase()) ||
      slot.professor.toLowerCase().includes(query.toLowerCase()) ||
      slot.room_number.toLowerCase().includes(query.toLowerCase()) ||
      slot.classroom.toLowerCase().includes(query.toLowerCase());

    const matchesDay = filterDay === '' || slot.day === filterDay;
    const matchesSem = filterSem === '' || slot.semester.toString() === filterSem;

    return matchesQuery && matchesDay && matchesSem;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-sky-50/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-500 text-white rounded-xl shadow-md shadow-sky-500/30">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Search SSEC IT Timetables</h3>
              <p className="text-xs font-semibold text-slate-500">Global Database Slot Lookup</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-5 bg-white border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            autoFocus
            placeholder="Search Subject, Professor, Room..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-400"
          />

          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 transition-all"
          >
            <option value="">All Days</option>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={filterSem}
            onChange={(e) => setFilterSem(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 transition-all"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        {/* Results List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
          <div className="text-xs font-semibold text-slate-500 flex justify-between items-center">
            <span>Found <strong className="text-sky-600 font-mono text-sm font-bold">{filtered.length}</strong> matching slots</span>
            {(query || filterDay || filterSem) && (
              <button
                onClick={() => { setQuery(''); setFilterDay(''); setFilterSem(''); }}
                className="text-sky-600 hover:text-sky-700 font-bold transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center text-xs font-medium text-slate-500 border border-dashed border-slate-300 rounded-2xl bg-white">
              No matching timetable slots found for your filter criteria.
            </div>
          ) : (
            filtered.map(slot => (
              <div
                key={slot.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-sky-300 shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
                      Sem {slot.semester} ({slot.classroom})
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {slot.day}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-2">{slot.subject}</h4>
                  <p className="text-xs text-slate-600 flex flex-wrap items-center gap-4 mt-1 font-medium">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {slot.professor}</span>
                    <span className="flex items-center gap-1.5 font-mono text-sky-700 font-semibold"><Clock className="w-3.5 h-3.5 text-sky-500" /> {slot.time_slot}</span>
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full text-slate-800 text-xs font-semibold font-mono tracking-wide shrink-0">
                  📍 Room {slot.room_number}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
