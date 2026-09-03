/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { RegisteredUser, Student, Professor, Subject, Classroom, TimetableSlot } from '../types';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Clock, 
  ArrowUpRight, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  GraduationCap, 
  UserCheck, 
  MapPin, 
  Layers, 
  Flame,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface QuickStatsProps {
  registeredUsers?: RegisteredUser[];
  students?: Student[];
  professors?: Professor[];
  subjects?: Subject[];
  classrooms?: Classroom[];
  timetables?: TimetableSlot[];
  onSelectModule?: (module: 'overview' | 'users' | 'students' | 'professors' | 'subjects' | 'classrooms' | 'timetable' | 'notifications' | 'reports') => void;
  onRefresh?: () => void;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  registeredUsers = [],
  students = [],
  professors = [],
  subjects = [],
  classrooms = [],
  timetables = [],
  onSelectModule,
  onRefresh
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update current time every 30 seconds for live upcoming lecture calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setCurrentTime(new Date());
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // 1. TOTAL USERS CALCULATION
  const userStats = useMemo(() => {
    // Total registered accounts
    const totalRegistered = registeredUsers.length;
    
    // Count active status
    const activeUsers = registeredUsers.filter(u => u.status === 'Active').length;
    const activePercent = totalRegistered > 0 ? Math.round((activeUsers / totalRegistered) * 100) : 100;

    // Role breakdown
    const studentCount = registeredUsers.filter(u => u.role === 'student').length || students.length;
    const professorCount = registeredUsers.filter(u => u.role === 'professor').length || professors.length;
    const adminCount = registeredUsers.filter(u => u.role === 'admin').length || 1;

    // Combined unique count
    const totalUsersCount = Math.max(totalRegistered, studentCount + professorCount + adminCount);

    return {
      total: totalUsersCount,
      active: activeUsers || totalUsersCount,
      activePercent,
      students: studentCount,
      professors: professorCount,
      admins: adminCount
    };
  }, [registeredUsers, students, professors]);

  // 2. ACTIVE SUBJECTS CALCULATION
  const subjectStats = useMemo(() => {
    const total = subjects.length;
    const theoryCount = subjects.filter(s => s.type === 'Theory').length;
    const practicalCount = subjects.filter(s => s.type === 'Practical').length;
    
    // Distinct semesters covered
    const semestersCovered = Array.from(new Set(subjects.map(s => s.semester))).filter(Boolean).length;
    
    // Total credit load
    const totalCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);

    return {
      total,
      theory: theoryCount,
      practical: practicalCount,
      semesters: semestersCovered || 8,
      totalCredits
    };
  }, [subjects]);

  // 3. TODAY'S UPCOMING LECTURES CALCULATION
  const lectureStats = useMemo(() => {
    const dayNames: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
    const currentDayName = dayNames[currentTime.getDay()];
    
    // If it's Sunday, default to showing Monday's schedule for upcoming reference
    const effectiveDay = currentDayName === 'Sunday' ? 'Monday' : currentDayName;
    const isTodaySunday = currentDayName === 'Sunday';

    // Slots for the active day
    const todaysAllSlots = timetables.filter(t => t.day === effectiveDay);

    // Current hour & minute in 24h format for comparison
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentMinutesFromMidnight = currentHour * 60 + currentMinute;

    // Helper to parse start time string (e.g. "10.45 AM", "01.15 PM")
    const parseSlotMinutes = (slotStr: string): number => {
      try {
        const startPart = slotStr.split(' to ')[0].trim();
        const parts = startPart.split(' ');
        const timePart = parts[0]; // "10.45" or "01.15" or "10:45"
        const modifier = parts[1]?.toUpperCase() || 'AM'; // "AM" or "PM"
        
        let [hrsStr, minsStr] = timePart.includes('.') ? timePart.split('.') : timePart.split(':');
        let hrs = parseInt(hrsStr, 10);
        let mins = parseInt(minsStr || '0', 10);

        if (modifier === 'PM' && hrs < 12) hrs += 12;
        if (modifier === 'AM' && hrs === 12) hrs = 0;

        return hrs * 60 + mins;
      } catch (e) {
        return 0;
      }
    };

    // Calculate upcoming vs completed
    const upcomingSlots = todaysAllSlots.filter(slot => {
      if (isTodaySunday) return true; // on weekend, all slots are upcoming for the next week
      const slotStartMins = parseSlotMinutes(slot.time_slot);
      return slotStartMins >= currentMinutesFromMidnight - 30; // buffer 30 mins for active lectures
    });

    // Next immediate lecture
    const sortedUpcoming = [...upcomingSlots].sort((a, b) => {
      return parseSlotMinutes(a.time_slot) - parseSlotMinutes(b.time_slot);
    });
    const nextLecture = sortedUpcoming.length > 0 ? sortedUpcoming[0] : null;

    // Active classrooms occupied today
    const roomsOccupiedToday = Array.from(new Set(todaysAllSlots.map(s => s.room_number))).length;

    return {
      dayName: effectiveDay,
      isWeekend: isTodaySunday,
      totalToday: todaysAllSlots.length,
      upcomingCount: upcomingSlots.length,
      roomsOccupied: roomsOccupiedToday,
      nextLecture
    };
  }, [timetables, currentTime]);

  return (
    <section 
      id="admin-quick-stats-panel" 
      aria-label="Real-time Department Quick Stats" 
      className="space-y-3"
    >
      {/* Top Header / Clock bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-sky-50 text-sky-700 border border-sky-200/80 px-2.5 py-1 rounded-lg text-xs font-semibold">
            <Activity className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            <span>Real-time Quick Stats</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Live Departmental Metrics
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <div className="flex items-center space-x-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-sky-700 font-semibold">{lectureStats.dayName}</span>
          </div>
          <button
            onClick={handleManualRefresh}
            title="Refresh Live Counts"
            className="p-1 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3 Main Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CARD 1: TOTAL USERS */}
        <div 
          id="stat-card-total-users"
          onClick={() => onSelectModule && onSelectModule('users')}
          className="bg-white border border-slate-200/90 hover:border-sky-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group cursor-pointer text-left flex flex-col justify-between"
        >
          {/* Subtle Background Accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors shadow-2xs">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{userStats.activePercent}% Active</span>
              </div>
            </div>

            <div className="space-y-1 relative z-10">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {userStats.total}
                </span>
                <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                  Users
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Total Registered Users
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">
                Synchronized across students, faculty, and administrators.
              </p>
            </div>
          </div>

          {/* Role Pill Breakdown */}
          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
            <div className="flex items-center space-x-3 text-slate-600">
              <span className="flex items-center space-x-1" title="Students">
                <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                <strong className="font-semibold text-slate-800">{userStats.students}</strong>
              </span>
              <span className="flex items-center space-x-1" title="Faculty Professors">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                <strong className="font-semibold text-slate-800">{userStats.professors}</strong>
              </span>
              <span className="flex items-center space-x-1" title="Admins">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <strong className="font-semibold text-slate-800">{userStats.admins}</strong>
              </span>
            </div>
            <span className="text-sky-600 font-semibold text-[11px] flex items-center group-hover:translate-x-0.5 transition-transform">
              <span>Directory</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>

        {/* CARD 2: ACTIVE SUBJECTS */}
        <div 
          id="stat-card-active-subjects"
          onClick={() => onSelectModule && onSelectModule('subjects')}
          className="bg-white border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group cursor-pointer text-left flex flex-col justify-between"
        >
          {/* Subtle Background Accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-2xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex items-center space-x-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                <Layers className="w-3 h-3 text-indigo-600" />
                <span>Semesters 1–8</span>
              </div>
            </div>

            <div className="space-y-1 relative z-10">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {subjectStats.total}
                </span>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  Courses
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Active Subjects Curriculum
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">
                Accredited academic syllabus with theory and practical labs.
              </p>
            </div>
          </div>

          {/* Curriculum Breakdown */}
          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
            <div className="flex items-center space-x-3 text-slate-600">
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                Theory: <strong className="text-slate-900">{subjectStats.theory}</strong>
              </span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                Labs: <strong className="text-slate-900">{subjectStats.practical}</strong>
              </span>
            </div>
            <span className="text-indigo-600 font-semibold text-[11px] flex items-center group-hover:translate-x-0.5 transition-transform">
              <span>Curriculum</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>

        {/* CARD 3: TODAY'S UPCOMING LECTURES */}
        <div 
          id="stat-card-upcoming-lectures"
          onClick={() => onSelectModule && onSelectModule('timetable')}
          className="bg-white border border-slate-200/90 hover:border-purple-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group cursor-pointer text-left flex flex-col justify-between"
        >
          {/* Subtle Background Accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-2xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex items-center space-x-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></span>
                <span>{lectureStats.dayName}</span>
              </div>
            </div>

            <div className="space-y-1 relative z-10">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {lectureStats.upcomingCount}
                </span>
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                  {lectureStats.isWeekend ? 'Next Scheduled' : 'Upcoming Today'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Today&apos;s Upcoming Lectures
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">
                {lectureStats.totalToday} total slots scheduled across {lectureStats.roomsOccupied} classrooms.
              </p>
            </div>
          </div>

          {/* Next Lecture Spotlight / Summary */}
          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
            {lectureStats.nextLecture ? (
              <div className="flex items-center space-x-1.5 text-slate-700 truncate max-w-[200px]" title={`${lectureStats.nextLecture.subject} in ${lectureStats.nextLecture.room_number}`}>
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                <span className="font-semibold truncate text-[11px]">
                  {lectureStats.nextLecture.subject}
                </span>
                <span className="text-[10px] text-slate-400">({lectureStats.nextLecture.room_number})</span>
              </div>
            ) : (
              <span className="text-slate-500 text-[11px] font-medium">
                {lectureStats.totalToday > 0 ? 'All lectures completed' : 'No slots today'}
              </span>
            )}
            <span className="text-purple-600 font-semibold text-[11px] flex items-center group-hover:translate-x-0.5 transition-transform shrink-0">
              <span>Timetable</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
