import React, { useState } from 'react';
import { AuthUser, TimetableSlot, NotificationItem } from '../types';
import { StorageService } from '../services/storageService';
import { generatePDFReport } from '../utils/pdfExport';
import { Calendar, Clock, BookOpen, MapPin, User, Download, Search, Bell, Sparkles, GraduationCap, ArrowRight } from 'lucide-react';

interface StudentDashboardProps {
  user: AuthUser;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const StudentDashboardView: React.FC<StudentDashboardProps> = ({
  user,
  onOpenSearch,
  onOpenProfile,
  onLogout
}) => {
  const timetables = StorageService.getTimetables().filter(
    t => t.semester === (user.semester || 6) && t.classroom === (user.classroom || 'IT-LH-101')
  );
  
  const notifications = StorageService.getNotifications().filter(
    n => n.target_role === 'All' || n.target_role === 'Student'
  );

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const dayLectures = timetables.filter(t => t.day === selectedDay);
  const nextLecture = timetables[0] || null;

  const handleExportPDF = () => {
    generatePDFReport(
      `Weekly Timetable (Semester ${user.semester || 6} | ${user.classroom || 'IT-LH-101'})`,
      timetables,
      `Student Schedule — ${user.name} (${user.identifier})`
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
              <GraduationCap className="w-4 h-4 text-white" />
              <span>SSEC IT Student Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, <span className="font-extrabold text-sky-100">{user.name}</span>
            </h1>
            <p className="text-sky-100 text-xs sm:text-sm font-medium">
              Enrollment: <span className="text-white font-mono font-bold">{user.identifier}</span> &bull; Semester: <span className="text-white font-bold">{user.semester || 6}</span> &bull; Classroom: <span className="text-white font-bold">{user.classroom || 'IT-LH-101'}</span>
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
          <span>Export Schedule PDF</span>
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
          className="flex items-center justify-center space-x-2 bg-white hover:bg-emerald-50/80 border border-slate-200 text-slate-700 font-medium p-3.5 rounded-xl transition-all text-xs sm:text-sm shadow-xs hover:border-emerald-300"
        >
          <User className="w-4 h-4 text-emerald-600" />
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

      {/* 3. Next Lecture Spotlight & Today's Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Next Lecture Banner */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5">
              <span className="text-xs font-bold text-sky-600 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-500" />
                Next Upcoming Lecture
              </span>
              <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full font-semibold">
                Confirmed
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
                    <span className="font-mono text-slate-900 font-semibold text-xs">{nextLecture.time_slot}</span>
                  </div>
                  <div className="flex items-center space-x-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-slate-800">{nextLecture.professor}</span>
                  </div>
                  <div className="flex items-center space-x-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span className="font-mono text-slate-900 font-semibold text-xs">{nextLecture.room_number} ({nextLecture.classroom})</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center font-medium">No upcoming lectures scheduled for today.</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-right">
            <span className="text-xs text-slate-400 font-medium">Semester {user.semester || 6} Standard Schedule</span>
          </div>
        </div>

        {/* Weekly Timetable Explorer */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-600" />
                Academic Timetable
              </h2>
              <p className="text-xs text-slate-500 font-medium">Classroom: {user.classroom || 'IT-LH-101'} | Semester {user.semester || 6}</p>
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
                <p className="text-slate-500 text-xs font-medium">No lectures scheduled for {selectedDay}.</p>
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
                      <p className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                        <span>Professor: <strong className="text-slate-800 font-semibold">{slot.professor}</strong></span>
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

      {/* 4. Latest Notifications Board */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500" />
          Department Announcements
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notifications.map(n => (
            <div key={n.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                  n.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-200' :
                  n.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                  'bg-sky-50 text-sky-600 border border-sky-200'
                }`}>
                  {n.priority} Priority
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{n.publish_date}</span>
              </div>
              <h4 className="font-bold text-xs text-slate-900">{n.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{n.description}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
