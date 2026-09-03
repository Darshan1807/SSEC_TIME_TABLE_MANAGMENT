import React, { useState } from 'react';
import { AuthUser, TimetableSlot } from '../types';
import { StorageService } from '../services/storageService';
import { generatePDFReport } from '../utils/pdfExport';
import { UserCheck, Calendar, Clock, BookOpen, MapPin, Download, Search, User, ArrowRight, BarChart3, Layers, Sparkles } from 'lucide-react';

interface ProfessorDashboardProps {
  user: AuthUser;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const ProfessorDashboardView: React.FC<ProfessorDashboardProps> = ({
  user,
  onOpenSearch,
  onOpenProfile,
  onLogout
}) => {
  const allTimetables = StorageService.getTimetables();
  
  // Filter lectures assigned to this professor
  const assignedLectures = allTimetables.filter(
    t => t.professor.toLowerCase().includes(user.name.toLowerCase()) || 
         t.professor_id === user.identifier ||
         user.name.toLowerCase().includes(t.professor.toLowerCase())
  );

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const dayLectures = assignedLectures.filter(t => t.day === selectedDay);
  const nextLecture = assignedLectures[0] || null;

  // Workload metrics
  const totalWeeklyLectures = assignedLectures.length;
  const assignedSemesters = Array.from(new Set(assignedLectures.map(l => l.semester)));
  const assignedRooms = Array.from(new Set(assignedLectures.map(l => l.room_number)));

  const handleExportPDF = () => {
    generatePDFReport(
      `Faculty Teaching Schedule — ${user.name}`,
      assignedLectures,
      `Professor ID: ${user.identifier} | SSEC IT Department`
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Welcome Card */}
      <div className="bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-sky-500/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 rounded-full text-xs font-semibold text-white">
              <UserCheck className="w-4 h-4 text-white" />
              <span>SSEC IT Faculty Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome, <span className="font-extrabold text-sky-100">{user.name}</span>
            </h1>
            <p className="text-sky-100 text-xs sm:text-sm font-medium">
              Faculty ID: <span className="text-white font-mono font-bold">{user.identifier}</span> &bull; Department: <span className="text-white font-bold">Information Technology</span>
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md p-4 rounded-xl border border-white/20 flex items-center space-x-4">
            <div className="p-3 bg-white/20 text-white rounded-xl border border-white/30">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-sky-100 block font-medium">Today's Date</span>
              <span className="text-xs sm:text-sm font-bold text-white">{todayDateStr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={handleExportPDF}
          className="flex items-center justify-center space-x-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold p-3.5 rounded-xl shadow-md shadow-sky-500/20 transition-all text-xs sm:text-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Teaching PDF</span>
        </button>

        <button
          onClick={onOpenSearch}
          className="flex items-center justify-center space-x-2 bg-white hover:bg-sky-50/80 border border-slate-200 text-slate-700 font-medium p-3.5 rounded-xl transition-all text-xs sm:text-sm shadow-xs hover:border-sky-300"
        >
          <Search className="w-4 h-4 text-sky-500" />
          <span>Search Timetable</span>
        </button>

        <button
          onClick={onOpenProfile}
          className="flex items-center justify-center space-x-2 bg-white hover:bg-blue-50/80 border border-slate-200 text-slate-700 font-medium p-3.5 rounded-xl transition-all text-xs sm:text-sm shadow-xs hover:border-blue-300"
        >
          <User className="w-4 h-4 text-blue-600" />
          <span>My Profile</span>
        </button>

        <button
          onClick={onLogout}
          className="flex items-center justify-center space-x-2 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 text-slate-700 hover:text-red-600 font-medium p-3.5 rounded-xl transition-all text-xs sm:text-sm shadow-xs"
        >
          <ArrowRight className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* 3. Teaching Workload Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center space-x-4 shadow-xs">
          <div className="p-3 bg-sky-100 text-sky-700 rounded-xl border border-sky-200">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-3xl font-bold text-slate-900 block leading-none">{totalWeeklyLectures}</span>
            <span className="text-xs text-slate-500 block mt-1 font-semibold">Weekly Lectures</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center space-x-4 shadow-xs">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-3xl font-bold text-slate-900 block leading-none">{assignedSemesters.length}</span>
            <span className="text-xs text-slate-500 block mt-1 font-semibold">Semesters ({assignedSemesters.join(', ') || 'N/A'})</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center space-x-4 shadow-xs">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl border border-amber-200">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-3xl font-bold text-slate-900 block leading-none">{assignedRooms.length}</span>
            <span className="text-xs text-slate-500 block mt-1 font-semibold">Assigned Rooms</span>
          </div>
        </div>
      </div>

      {/* 4. Assigned Weekly Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Next Lecture Spotlight */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5">
              <span className="text-xs font-bold text-sky-600 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-500" />
                Next Teaching Slot
              </span>
              <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full font-semibold">
                Faculty Duty
              </span>
            </div>

            {nextLecture ? (
              <div className="space-y-3.5">
                <h3 className="text-xl font-bold text-slate-900 leading-tight">
                  {nextLecture.subject}
                </h3>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-2.5 bg-sky-50/60 p-2.5 rounded-lg border border-sky-100">
                    <Clock className="w-4 h-4 text-sky-600" />
                    <span className="font-mono text-slate-900 font-semibold text-xs">{nextLecture.time_slot} ({nextLecture.day})</span>
                  </div>
                  <div className="flex items-center space-x-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-slate-800">Sem {nextLecture.semester} &bull; Class: {nextLecture.classroom}</span>
                  </div>
                  <div className="flex items-center space-x-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span className="font-mono text-slate-900 font-semibold text-xs">{nextLecture.room_number}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center font-medium">No assigned lectures found.</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-right">
            <span className="text-xs text-slate-400 font-medium">SSEC IT Faculty Schedule</span>
          </div>
        </div>

        {/* Weekly Timetable Explorer */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-600" />
                Teaching Duties Schedule
              </h2>
              <p className="text-xs text-slate-500 font-medium">Filtered By Day</p>
            </div>

            {/* Day Selector Tabs */}
            <div className="flex overflow-x-auto gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {daysOfWeek.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedDay === day
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Timetable Slots List */}
          <div className="space-y-3">
            {dayLectures.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                <p className="text-slate-500 text-xs font-medium">No teaching duties assigned for {selectedDay}.</p>
              </div>
            ) : (
              dayLectures.map(slot => (
                <div
                  key={slot.id}
                  className="bg-slate-50/80 hover:bg-sky-50/50 border border-slate-200 hover:border-sky-200 rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl border border-sky-200 shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-sky-700 font-mono font-bold block">{slot.time_slot}</span>
                      <h4 className="font-bold text-sm text-slate-900 mt-0.5">{slot.subject}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Target: <strong className="text-slate-800 font-semibold">Sem {slot.semester} ({slot.classroom})</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    <span className="bg-white border border-slate-200 text-slate-800 text-xs px-3 py-1 rounded-full font-semibold font-mono shadow-xs">
                      📍 Room {slot.room_number}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
