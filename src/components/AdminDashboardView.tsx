import React, { useState, useEffect, useCallback } from 'react';
import { AuthUser, Student, Professor, Subject, Classroom, TimetableSlot, NotificationItem, RegisteredUser, ToastNotification } from '../types';
import { StorageService } from '../services/storageService';
import { generatePDFReport, generateMultiSectionPDFReport } from '../utils/pdfExport';
import { RegisteredUsersView } from './RegisteredUsersView';
import { ToastNotificationStack } from './ToastNotificationStack';
import { QuickStats } from './QuickStats';
import { ShieldCheck, Users, UserCheck, BookOpen, MapPin, Calendar, Bell, Plus, Trash2, Edit3, Search, Download, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, X, Database, Code, FileText, CheckSquare, Square, Printer, FileSpreadsheet, Eye, Filter, ToggleLeft, ToggleRight, FileJson, RefreshCw, ArrowRight, GraduationCap } from 'lucide-react';

interface AdminDashboardProps {
  user: AuthUser;
  onOpenSearch: () => void;
  onOpenMongoConfig?: () => void;
  onOpenCodeViewer?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardProps> = ({
  user,
  onOpenSearch,
  onOpenMongoConfig,
  onOpenCodeViewer
}) => {
  const [activeModule, setActiveModule] = useState<
    'overview' | 'users' | 'students' | 'professors' | 'subjects' | 'classrooms' | 'timetable' | 'notifications' | 'reports'
  >('overview');

  // State
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(StorageService.getRegisteredUsers());
  const [students, setStudents] = useState<Student[]>(StorageService.getStudents());
  const [professors, setProfessors] = useState<Professor[]>(StorageService.getProfessors());
  const [subjects, setSubjects] = useState<Subject[]>(StorageService.getSubjects());
  const [classrooms, setClassrooms] = useState<Classroom[]>(StorageService.getClassrooms());
  const [timetables, setTimetables] = useState<TimetableSlot[]>(StorageService.getTimetables());
  const [notifications, setNotifications] = useState<NotificationItem[]>(StorageService.getNotifications());

  // Toasts and Async loading states
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersErrorState, setUsersErrorState] = useState<{
    hasError: boolean;
    message?: string;
    errorCode?: string;
    fromCache?: boolean;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [flashMsg, setFlashMsg] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: string; identifier?: string; role?: string } | null>(null);

  // Edit modals state
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [editingNotification, setEditingNotification] = useState<NotificationItem | null>(null);

  // Notification search & filter states
  const [notifSearchQuery, setNotifSearchQuery] = useState('');
  const [notifFilterPriority, setNotifFilterPriority] = useState<string>('All');
  const [notifFilterTarget, setNotifFilterTarget] = useState<string>('All');

  // Multi-Section Report Generator state
  const [reportTitle, setReportTitle] = useState('SSEC IT Department Academic Master Report');
  const [reportSemFilter, setReportSemFilter] = useState<number>(0);
  const [reportSelectedSections, setReportSelectedSections] = useState({
    timetable: true,
    students: true,
    professors: true,
    subjects: true,
    classrooms: true,
    notifications: true
  });

  // Additional filter states
  const [subFilterSem, setSubFilterSem] = useState<number | 0>(0);
  const [subFilterType, setSubFilterType] = useState<string>('All');
  const [crFilterType, setCrFilterType] = useState<string>('All');
  const [crFilterStatus, setCrFilterStatus] = useState<string>('All');

  // SMTP Diagnostics state
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testingMongo, setTestingMongo] = useState(false);
  const [mongoStatus, setMongoStatus] = useState<{
    connected?: boolean;
    latencyMs?: number;
    cluster?: string;
    database?: string;
    counts?: Record<string, number>;
    message?: string;
    error?: string;
  } | null>(null);

  const handleTestMongo = async (notify: boolean = false) => {
    setTestingMongo(true);
    try {
      const res = await StorageService.testMongoLiveConnection();
      setMongoStatus(res);
      if (notify) {
        if (res.connected) {
          showFlash(`MongoDB Atlas Connected! Cluster: ${res.cluster || 'Cluster0'} (${res.latencyMs || 0}ms)`);
        } else {
          showFlash(`MongoDB Atlas: ${res.error || 'Failed to connect'}`, 'danger');
        }
      }
    } catch (err: any) {
      setMongoStatus({
        connected: false,
        error: err.message || 'Connection test failed'
      });
      if (notify) showFlash('Failed to check MongoDB connection', 'danger');
    } finally {
      setTestingMongo(false);
    }
  };
  const [smtpDiagnosticReport, setSmtpDiagnosticReport] = useState<{
    success: boolean;
    status: string;
    summary: string;
    diagnostics?: {
      environment?: {
        server: string;
        port: number;
        encryption: string;
        maskedUsername: string;
        maskedSender: string;
        passwordConfigured: boolean;
        passwordLength: number;
        hasWhitespaceInPassword: boolean;
        isPlaceholderPassword: boolean;
      };
      network?: {
        reachable: boolean;
        latencyMs: number;
        error?: string;
      };
      authentication?: {
        verified: boolean;
        smtpCode?: number | null;
        details?: string;
      };
    };
    recommendations?: string[];
  } | null>(null);

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpDiagnosticReport(null);
    try {
      const res = await fetch('/api/smtp/diagnostics');
      const json = await res.json();
      setSmtpDiagnosticReport(json);
    } catch (err: any) {
      setSmtpDiagnosticReport({
        success: false,
        status: 'NETWORK_ERROR',
        summary: err.message || 'Failed to connect to backend SMTP diagnostic endpoint.',
        recommendations: ['Ensure the backend server is running and accessible.']
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  // Toast Notification Helpers
  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    setToasts(prev => [
      ...prev.slice(-3),
      { ...toast, id }
    ]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showFlash = (text: string, type: 'success' | 'danger' = 'success') => {
    setFlashMsg({ text, type });
    setTimeout(() => setFlashMsg(null), 4000);
  };

  // Async User List Fetch with graceful error handling & toast notifications
  const fetchUsersAsync = useCallback(async (options?: {
    forceMode?: 'none' | 'network_error' | 'db_timeout' | 'server_error';
    silent?: boolean;
  }) => {
    setIsLoadingUsers(true);
    try {
      const result = await StorageService.fetchRegisteredUsersAsync(options);
      
      if (!result.success) {
        setUsersErrorState({
          hasError: true,
          message: result.error,
          errorCode: result.errorCode,
          fromCache: result.fromCache
        });

        // Determine clear title based on error type
        const title = result.errorCode === 'ERR_NETWORK_DISCONNECTED' 
          ? 'Network Connection Failure' 
          : result.errorCode === 'ERR_DB_TIMEOUT' 
          ? 'MongoDB Connection Timeout' 
          : 'User Directory API Error';

        // Display rich danger toast notification
        addToast({
          type: 'danger',
          title,
          message: result.error || 'Failed to fetch registered user list from MongoDB Atlas.',
          details: result.errorCode,
          actionLabel: 'Retry API Call',
          onAction: () => fetchUsersAsync({ forceMode: 'none' })
        });

        // Fallback: Populate cached user data gracefully so UI doesn't crash
        if (result.data) {
          setRegisteredUsers(result.data);
        }
      } else {
        setUsersErrorState(null);
        setRegisteredUsers(result.data);
        if (!options?.silent) {
          addToast({
            type: 'success',
            title: 'Database Synchronized',
            message: `Successfully loaded ${result.data.length} registered user records from live MongoDB Atlas database (${result.latencyMs || 25}ms).`
          });
        }
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'An unexpected network error occurred while loading the user list.';
      setUsersErrorState({
        hasError: true,
        message: errorMsg,
        errorCode: 'ERR_UNEXPECTED',
        fromCache: true
      });
      addToast({
        type: 'danger',
        title: 'API Request Error',
        message: errorMsg,
        details: 'ERR_NETWORK',
        actionLabel: 'Retry',
        onAction: () => fetchUsersAsync({ forceMode: 'none' })
      });
    } finally {
      setIsLoadingUsers(false);
    }
  }, [addToast]);

  // Initial mount load
  useEffect(() => {
    fetchUsersAsync({ silent: true });
    handleTestMongo(false);
  }, [fetchUsersAsync]);

  // Refresh helper for all data
  const refreshData = () => {
    fetchUsersAsync({ forceMode: 'none' });
    setStudents(StorageService.getStudents());
    setProfessors(StorageService.getProfessors());
    setSubjects(StorageService.getSubjects());
    setClassrooms(StorageService.getClassrooms());
    setTimetables(StorageService.getTimetables());
    setNotifications(StorageService.getNotifications());
  };

  const handleToggleUserStatus = (u: RegisteredUser) => {
    try {
      const nextStatus = u.status === 'Active' ? 'Inactive' : 'Active';
      const updated = StorageService.updateUserStatus(u.id, nextStatus);
      if (updated) {
        addToast({
          type: 'success',
          title: 'Account Status Updated',
          message: `${u.full_name}'s account status is now ${nextStatus}.`
        });
        refreshData();
      } else {
        addToast({
          type: 'danger',
          title: 'Update Failed',
          message: `Unable to update account status for ${u.full_name}. User record not found in database.`
        });
      }
    } catch (e: any) {
      addToast({
        type: 'danger',
        title: 'Database Write Error',
        message: e?.message || 'Failed to update user status due to a database exception.'
      });
    }
  };

  const handleDeleteRegisteredUser = (u: RegisteredUser) => {
    setDeleteTarget({
      id: u.id,
      name: `${u.full_name} (${u.identifier})`,
      type: 'user',
      identifier: u.identifier,
      role: u.role
    });
  };


  // --- FORM STATES FOR CREATION ---
  // Student
  const [stName, setStName] = useState('');
  const [stEnroll, setStEnroll] = useState('');
  const [stSem, setStSem] = useState(6);
  const [stClassroom, setStClassroom] = useState('IT-LH-101');

  // Professor
  const [pfName, setPfName] = useState('');
  const [pfId, setPfId] = useState('');
  const [pfDesig, setPfDesig] = useState('Assistant Professor');

  // Subject
  const [subCode, setSubCode] = useState('');
  const [subName, setSubName] = useState('');
  const [subSem, setSubSem] = useState(6);
  const [subCredits, setSubCredits] = useState(4);
  const [subType, setSubType] = useState<'Theory' | 'Practical'>('Theory');

  // Classroom
  const [crRoomNo, setCrRoomNo] = useState('');
  const [crCap, setCrCap] = useState(70);
  const [crType, setCrType] = useState<'Lecture Hall' | 'Computer Lab' | 'Seminar Hall'>('Lecture Hall');

  // Timetable Slot
  const THEORY_TIME_SLOTS = [
    '10.45 AM to 11.45 AM',
    '11.45 AM to 12.45 PM',
    '01.15 PM to 02.15 PM',
    '02.15 PM to 03.15 PM',
    '03.30 PM to 04.30 PM',
    '04.30 PM to 05.30 PM'
  ];

  const LAB_TIME_SLOTS = [
    '10.45 AM to 12.45 PM',
    '01.15 PM to 03.15 PM',
    '03.30 PM to 05.30 PM'
  ];

  const [ttSem, setTtSem] = useState(6);
  const [ttClassroom, setTtClassroom] = useState('IT-LH-101');
  const [ttDay, setTtDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'>('Monday');
  const [ttSessionType, setTtSessionType] = useState<'Theory' | 'Lab'>('Theory');
  const [ttTimeSlot, setTtTimeSlot] = useState('10.45 AM to 11.45 AM');
  const [ttIsManualTime, setTtIsManualTime] = useState(false);
  const [ttCustomTime, setTtCustomTime] = useState('');
  const [ttSubject, setTtSubject] = useState('');
  const [ttProfessor, setTtProfessor] = useState('');
  const [ttRoomNo, setTtRoomNo] = useState('IT-LH-101');

  // Notification
  const [notifTitle, setNotifTitle] = useState('');
  const [notifDesc, setNotifDesc] = useState('');
  const [notifPriority, setNotifPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [notifTarget, setNotifTarget] = useState<'All' | 'Student' | 'Professor'>('All');

  // --- CREATION HANDLERS ---
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const res = StorageService.addStudent({
      full_name: stName,
      enrollment_no: stEnroll,
      semester: stSem,
      classroom: stClassroom,
      email: `${stEnroll.toLowerCase()}@ssec.ac.in`,
      phone: '+91 9800000000'
    });
    if (res.error) {
      showFlash(res.error, 'danger');
    } else {
      showFlash(`Student ${stName} registered successfully!`);
      setStName(''); setStEnroll('');
      refreshData();
    }
  };

  const handleCreateProfessor = (e: React.FormEvent) => {
    e.preventDefault();
    const res = StorageService.addProfessor({
      full_name: pfName,
      professor_id: pfId,
      department: 'Information Technology',
      designation: pfDesig,
      email: `${pfId.toLowerCase()}@ssec.ac.in`,
      phone: '+91 9800000000'
    });
    if (res.error) {
      showFlash(res.error, 'danger');
    } else {
      showFlash(`Professor ${pfName} created successfully!`);
      setPfName(''); setPfId('');
      refreshData();
    }
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const res = StorageService.addSubject({
      code: subCode,
      name: subName,
      semester: subSem,
      credits: subCredits,
      type: subType
    });
    if (res.error) {
      showFlash(res.error, 'danger');
    } else {
      showFlash(`Subject ${subName} added!`);
      setSubCode(''); setSubName('');
      refreshData();
    }
  };

  const handleCreateClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    const res = StorageService.addClassroom({
      room_number: crRoomNo,
      building: 'IT Building Block',
      capacity: crCap,
      type: crType,
      status: 'Available'
    });
    if (res.error) {
      showFlash(res.error, 'danger');
    } else {
      showFlash(`Classroom ${crRoomNo} added!`);
      setCrRoomNo('');
      refreshData();
    }
  };

  const handleUpdateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    const res = StorageService.updateSubject(editingSubject.id, {
      code: editingSubject.code,
      name: editingSubject.name,
      semester: editingSubject.semester,
      credits: editingSubject.credits,
      type: editingSubject.type
    });
    if (res.error) {
      showFlash(res.error, 'danger');
    } else {
      showFlash(`Subject ${editingSubject.name} (${editingSubject.code}) updated successfully!`);
      setEditingSubject(null);
      refreshData();
    }
  };

  const handleUpdateClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassroom) return;
    const res = StorageService.updateClassroom(editingClassroom.id, {
      room_number: editingClassroom.room_number,
      capacity: editingClassroom.capacity,
      type: editingClassroom.type,
      status: editingClassroom.status,
      building: editingClassroom.building
    });
    if (res.error) {
      showFlash(res.error, 'danger');
    } else {
      showFlash(`Classroom ${editingClassroom.room_number} updated successfully!`);
      setEditingClassroom(null);
      refreshData();
    }
  };

  const handleToggleClassroomStatus = (room: Classroom) => {
    const nextStatus: Record<Classroom['status'], Classroom['status']> = {
      'Available': 'Occupied',
      'Occupied': 'Maintenance',
      'Maintenance': 'Available'
    };
    const newStatus = nextStatus[room.status];
    StorageService.updateClassroom(room.id, { status: newStatus });
    showFlash(`Classroom ${room.room_number} status set to ${newStatus}`);
    refreshData();
  };

  const handleSessionTypeChange = (type: 'Theory' | 'Lab') => {
    setTtSessionType(type);
    setTtIsManualTime(false);
    if (type === 'Theory') {
      setTtTimeSlot(THEORY_TIME_SLOTS[0]);
    } else {
      setTtTimeSlot(LAB_TIME_SLOTS[0]);
    }
  };

  const handleCreateTimetableSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ttSubject || !ttProfessor) {
      showFlash('Please select both a Subject and a Professor.', 'danger');
      return;
    }

    const finalTimeSlot = ttIsManualTime ? ttCustomTime.trim() : ttTimeSlot;
    if (!finalTimeSlot) {
      showFlash('Please enter a valid time slot.', 'danger');
      return;
    }

    const res = StorageService.addTimetable({
      semester: ttSem,
      classroom: ttClassroom,
      day: ttDay,
      time_slot: finalTimeSlot,
      session_type: ttSessionType,
      subject: ttSubject,
      professor: ttProfessor,
      room_number: ttRoomNo,
      academic_year: '2025-2026'
    });
    if (res.error) {
      showFlash(res.error, 'danger');
    } else {
      showFlash(`Timetable slot allocated successfully (${ttSessionType}: ${finalTimeSlot})!`);
      if (ttIsManualTime) setTtCustomTime('');
      refreshData();
    }
  };

  const handleCreateNotification = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.addNotification({
      title: notifTitle,
      description: notifDesc,
      priority: notifPriority,
      publish_date: new Date().toISOString().split('T')[0],
      status: 'Active',
      target_role: notifTarget
    });
    showFlash(`Notification published!`);
    setNotifTitle(''); setNotifDesc('');
    refreshData();
  };

  const handleUpdateNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotification) return;
    const res = StorageService.updateNotification(editingNotification.id, {
      title: editingNotification.title,
      description: editingNotification.description,
      priority: editingNotification.priority,
      target_role: editingNotification.target_role,
      status: editingNotification.status
    });
    if (res.error) {
      showFlash(res.error, 'danger');
    } else {
      showFlash(`Notification "${editingNotification.title}" updated successfully!`);
      setEditingNotification(null);
      refreshData();
    }
  };

  const handleToggleNotificationStatus = (notif: NotificationItem) => {
    const nextStatus = notif.status === 'Active' ? 'Inactive' : 'Active';
    StorageService.updateNotification(notif.id, { status: nextStatus });
    showFlash(`Notification status set to ${nextStatus}`);
    refreshData();
  };

  const handleExportReportCSV = () => {
    let csvContent = `SHANTILAL SHAH ENGINEERING COLLEGE - DEPARTMENT OF IT\n`;
    csvContent += `REPORT TITLE: "${reportTitle.replace(/"/g, '""')}"\n`;
    csvContent += `SCOPE: ${reportSemFilter > 0 ? 'Semester ' + reportSemFilter : 'All Semesters'}\n`;
    csvContent += `GENERATED ON: ${new Date().toLocaleString()}\n\n`;

    if (reportSelectedSections.timetable) {
      csvContent += `--- 1. TIMETABLE SCHEDULE SLOTS ---\nDay,Time Slot,Type,Semester,Subject,Professor,Room\n`;
      let slots = timetables;
      if (reportSemFilter > 0) slots = slots.filter(s => s.semester === reportSemFilter);
      slots.forEach(s => {
        csvContent += `"${s.day}","${s.time_slot}","${s.session_type || 'Theory'}","Sem ${s.semester}","${s.subject}","${s.professor}","${s.room_number}"\n`;
      });
      csvContent += `\n`;
    }

    if (reportSelectedSections.students) {
      csvContent += `--- 2. STUDENTS ROSTER ---\nEnrollment No,Student Name,Semester,Classroom,Email\n`;
      let list = students;
      if (reportSemFilter > 0) list = list.filter(s => s.semester === reportSemFilter);
      list.forEach(s => {
        csvContent += `"${s.enrollment_no}","${s.full_name}","Sem ${s.semester}","${s.classroom || 'IT-LH-101'}","${s.email}"\n`;
      });
      csvContent += `\n`;
    }

    if (reportSelectedSections.professors) {
      csvContent += `--- 3. FACULTY & PROFESSORS DIRECTORY ---\nProf ID,Full Name,Designation,Department,Email\n`;
      professors.forEach(p => {
        csvContent += `"${p.professor_id}","${p.full_name}","${p.designation}","${p.department}","${p.email}"\n`;
      });
      csvContent += `\n`;
    }

    if (reportSelectedSections.subjects) {
      csvContent += `--- 4. COURSE SUBJECTS CURRICULUM ---\nSubject Code,Subject Name,Semester,Type,Credits\n`;
      let list = subjects;
      if (reportSemFilter > 0) list = list.filter(s => s.semester === reportSemFilter);
      list.forEach(s => {
        csvContent += `"${s.code}","${s.name}","Sem ${s.semester}","${s.type}","${s.credits}"\n`;
      });
      csvContent += `\n`;
    }

    if (reportSelectedSections.classrooms) {
      csvContent += `--- 5. INFRASTRUCTURE & CLASSROOMS ---\nRoom Number,Building Block,Type,Capacity,Status\n`;
      classrooms.forEach(c => {
        csvContent += `"${c.room_number}","${c.building}","${c.type}","${c.capacity}","${c.status}"\n`;
      });
      csvContent += `\n`;
    }

    if (reportSelectedSections.notifications) {
      csvContent += `--- 6. DEPARTMENT ANNOUNCEMENTS & NOTIFICATIONS ---\nTitle,Priority,Target Role,Publish Date,Status\n`;
      notifications.forEach(n => {
        csvContent += `"${n.title}","${n.priority}","${n.target_role}","${n.publish_date}","${n.status}"\n`;
      });
      csvContent += `\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${(reportTitle || 'SSEC_Report').replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFlash(`Report CSV exported successfully!`);
  };

  const handleExportReportJSON = () => {
    const reportData: any = {
      title: reportTitle,
      college: 'Shantilal Shah Engineering College, Bhavnagar',
      department: 'Department of Information Technology',
      generated_at: new Date().toISOString(),
      scope_semester: reportSemFilter > 0 ? reportSemFilter : 'All',
      selected_sections: reportSelectedSections,
      records: {}
    };

    if (reportSelectedSections.timetable) {
      reportData.records.timetables = reportSemFilter > 0 ? timetables.filter(t => t.semester === reportSemFilter) : timetables;
    }
    if (reportSelectedSections.students) {
      reportData.records.students = reportSemFilter > 0 ? students.filter(s => s.semester === reportSemFilter) : students;
    }
    if (reportSelectedSections.professors) {
      reportData.records.professors = professors;
    }
    if (reportSelectedSections.subjects) {
      reportData.records.subjects = reportSemFilter > 0 ? subjects.filter(s => s.semester === reportSemFilter) : subjects;
    }
    if (reportSelectedSections.classrooms) {
      reportData.records.classrooms = classrooms;
    }
    if (reportSelectedSections.notifications) {
      reportData.records.notifications = notifications;
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${(reportTitle || 'SSEC_Report').replace(/[^a-zA-Z0-9]/g, '_')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFlash(`Report JSON exported successfully!`);
  };

  const handleGenerateMultiReportPDF = () => {
    generateMultiSectionPDFReport({
      title: reportTitle,
      semesterFilter: reportSemFilter,
      sections: reportSelectedSections,
      data: {
        timetables,
        students,
        professors,
        subjects,
        classrooms,
        notifications
      }
    });
    showFlash(`Multi-section PDF Report generated successfully!`);
  };

  // --- CONFIRM DELETE HANDLER ---
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, type, name, identifier, role } = deleteTarget;
    try {
      if (type === 'user') {
        const deleted = await StorageService.deleteRegisteredUser(id, identifier, role);
        if (deleted) {
          addToast({
            type: 'success',
            title: 'User Account Deleted',
            message: `User record "${name}" was permanently removed from the database.`
          });
        } else {
          addToast({
            type: 'danger',
            title: 'Delete Restricted',
            message: `Failed to remove user "${name}". Root super administrator account is protected by security policy.`
          });
        }
      } else if (type === 'student') {
        await StorageService.deleteStudent(id, identifier);
        addToast({ type: 'success', title: 'Student Deleted', message: `Student ${name} deleted successfully.` });
      } else if (type === 'professor') {
        await StorageService.deleteProfessor(id, identifier);
        addToast({ type: 'success', title: 'Professor Deleted', message: `Faculty record ${name} deleted successfully.` });
      } else if (type === 'subject') {
        StorageService.deleteSubject(id, identifier);
        addToast({ type: 'success', title: 'Subject Deleted', message: `Subject ${name} deleted successfully.` });
      } else if (type === 'classroom') {
        StorageService.deleteClassroom(id, identifier);
        addToast({ type: 'success', title: 'Classroom Deleted', message: `Classroom ${name} deleted successfully.` });
      } else if (type === 'timetable') {
        StorageService.deleteTimetable(id);
        addToast({ type: 'success', title: 'Timetable Slot Deleted', message: `Slot deleted successfully.` });
      } else if (type === 'notification') {
        StorageService.deleteNotification(id);
        addToast({ type: 'success', title: 'Notification Deleted', message: `Notification deleted successfully.` });
      }
    } catch (err: any) {
      addToast({
        type: 'danger',
        title: 'Delete Failed',
        message: err?.message || 'Database error occurred while deleting record.'
      });
    }

    setDeleteTarget(null);
    refreshData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Welcome & Header */}
      <div className="bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-sky-500/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 rounded-full text-xs font-semibold text-white">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>SSEC IT Admin Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Admin <span className="font-extrabold text-sky-100">Control Panel</span>
          </h1>
          <p className="text-sky-100 text-xs sm:text-sm font-medium">
            Logged in as: <span className="text-white font-mono font-bold">SSEC.IT.ADMIN</span> &bull; System Role: <span className="text-white font-bold">Superuser</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={refreshData}
            className="bg-white/20 hover:bg-white/30 text-white font-semibold px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all border border-white/30 shadow-xs"
            title="Synchronize all data from database"
          >
            <RefreshCw className="w-4 h-4 text-white" />
            <span>Sync Data</span>
          </button>
          {onOpenMongoConfig && (
            <button
              onClick={onOpenMongoConfig}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md text-xs flex items-center space-x-1.5 transition-all"
            >
              <Database className="w-4 h-4" />
              <span>Atlas DB Settings</span>
            </button>
          )}
          {onOpenCodeViewer && (
            <button
              onClick={onOpenCodeViewer}
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md text-xs flex items-center space-x-1.5 transition-all"
            >
              <Code className="w-4 h-4" />
              <span>Flask Source Code</span>
            </button>
          )}
          <button
            onClick={onOpenSearch}
            className="bg-white hover:bg-sky-50 text-sky-700 font-semibold px-4 py-2.5 rounded-xl shadow-md text-xs flex items-center space-x-1.5 transition-all border border-sky-100"
          >
            <Search className="w-4 h-4 text-sky-600" />
            <span>Search Timetable</span>
          </button>
        </div>
      </div>

      {/* Flash Banner */}
      {flashMsg && (
        <div className={`p-4 rounded-xl border flex items-center space-x-3 text-xs sm:text-sm font-medium ${
          flashMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {flashMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{flashMsg.text}</span>
        </div>
      )}

      {/* Real-time Quick Stats Component */}
      <QuickStats
        registeredUsers={registeredUsers}
        students={students}
        professors={professors}
        subjects={subjects}
        classrooms={classrooms}
        timetables={timetables}
        onSelectModule={(mod) => {
          setActiveModule(mod);
          setCurrentPage(1);
          setSearchQuery('');
        }}
        onRefresh={refreshData}
      />

      {/* Core Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <button
          onClick={() => setActiveModule('users')}
          className="bg-gradient-to-br from-sky-50 to-blue-50/50 border border-sky-200 hover:border-sky-400 rounded-2xl p-4 text-center shadow-xs transition-all text-left group cursor-pointer"
        >
          <Users className="w-5 h-5 text-sky-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-bold text-slate-900 block leading-none text-center">{registeredUsers.length}</span>
          <span className="text-[11px] text-sky-700 block font-bold mt-1 text-center">Reg. Users</span>
        </button>

        <button
          onClick={() => setActiveModule('students')}
          className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 text-center shadow-xs transition-all cursor-pointer"
        >
          <GraduationCap className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
          <span className="text-2xl font-bold text-slate-900 block leading-none">{students.length}</span>
          <span className="text-xs text-slate-500 block font-semibold mt-1">Students</span>
        </button>

        <button
          onClick={() => setActiveModule('professors')}
          className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 text-center shadow-xs transition-all cursor-pointer"
        >
          <UserCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
          <span className="text-2xl font-bold text-slate-900 block leading-none">{professors.length}</span>
          <span className="text-xs text-slate-500 block font-semibold mt-1">Professors</span>
        </button>

        <button
          onClick={() => setActiveModule('subjects')}
          className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 text-center shadow-xs transition-all cursor-pointer"
        >
          <BookOpen className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />
          <span className="text-2xl font-bold text-slate-900 block leading-none">{subjects.length}</span>
          <span className="text-xs text-slate-500 block font-semibold mt-1">Subjects</span>
        </button>

        <button
          onClick={() => setActiveModule('classrooms')}
          className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 text-center shadow-xs transition-all cursor-pointer"
        >
          <MapPin className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
          <span className="text-2xl font-bold text-slate-900 block leading-none">{classrooms.length}</span>
          <span className="text-xs text-slate-500 block font-semibold mt-1">Rooms</span>
        </button>

        <button
          onClick={() => setActiveModule('timetable')}
          className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 text-center shadow-xs transition-all cursor-pointer"
        >
          <Calendar className="w-5 h-5 text-purple-600 mx-auto mb-1.5" />
          <span className="text-2xl font-bold text-slate-900 block leading-none">{timetables.length}</span>
          <span className="text-xs text-slate-500 block font-semibold mt-1">Slots</span>
        </button>

        <button
          onClick={() => setActiveModule('notifications')}
          className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 text-center shadow-xs transition-all cursor-pointer col-span-2 sm:col-span-1"
        >
          <Bell className="w-5 h-5 text-pink-600 mx-auto mb-1.5" />
          <span className="text-2xl font-bold text-slate-900 block leading-none">{notifications.length}</span>
          <span className="text-xs text-slate-500 block font-semibold mt-1">Announce</span>
        </button>
      </div>

      {/* Admin Module Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-3 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: ShieldCheck },
          { id: 'users', label: `Registered Users (${registeredUsers.length})`, icon: Users },
          { id: 'students', label: 'Students', icon: GraduationCap },
          { id: 'professors', label: 'Professors', icon: UserCheck },
          { id: 'subjects', label: 'Subjects', icon: BookOpen },
          { id: 'classrooms', label: 'Classrooms', icon: MapPin },
          { id: 'timetable', label: 'Timetable', icon: Calendar },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'reports', label: 'Reports', icon: Download }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveModule(tab.id as any); setCurrentPage(1); setSearchQuery(''); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeModule === tab.id
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MODULE 1: OVERVIEW */}
      {activeModule === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">System Overview & Database Controls</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Registered Users Quick Widget */}
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-sky-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-600" />
                    Registered Users Directory ({registeredUsers.length})
                  </h3>
                  <span className="bg-sky-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {registeredUsers.filter(u => u.status === 'Active').length} Active
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  All newly registered students, professors, and administrators are synchronized in real-time with the database.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => setActiveModule('users')}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-all"
                  >
                    <span>View All Registered Users</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Real Gmail SMTP & OTP Service Info */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Real Gmail SMTP OTP Service
                  </h3>
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    Gmail SMTP Active
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Dual-flow email verification for new Student & Faculty registrations and self-service Password Reset OTPs with 5-minute security expiration. Delivered directly to real email inboxes via <code className="bg-white/80 px-1 py-0.5 rounded text-amber-800 font-mono text-[11px] border border-amber-200">smtp.gmail.com:587 (TLS)</code>.
                </p>
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Direct Inbox Delivery • No Internal Simulation • Zero Plaintext Exposure</span>
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={testingSmtp}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg shadow-2xs transition-colors self-start disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingSmtp ? 'animate-spin' : ''}`} />
                    <span>{testingSmtp ? 'Running Live Diagnostics...' : 'Run SMTP Connection Diagnostics'}</span>
                  </button>

                  {smtpDiagnosticReport && (
                    <div className={`p-4 rounded-xl text-xs border space-y-3 ${
                      smtpDiagnosticReport.success 
                        ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950' 
                        : 'bg-rose-50/90 border-rose-200 text-rose-950'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${smtpDiagnosticReport.success ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`}></span>
                          Status: {smtpDiagnosticReport.status}
                        </span>
                        {smtpDiagnosticReport.diagnostics?.network?.latencyMs !== undefined && (
                          <span className="text-[11px] font-mono text-slate-500 bg-white/70 px-2 py-0.5 rounded border border-slate-200">
                            Latency: {smtpDiagnosticReport.diagnostics.network.latencyMs}ms
                          </span>
                        )}
                      </div>

                      <p className="font-medium text-slate-800 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-slate-200/80">
                        {smtpDiagnosticReport.summary}
                      </p>

                      {smtpDiagnosticReport.diagnostics && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/80 space-y-1">
                            <span className="text-slate-500 font-medium block">Environment Configuration:</span>
                            <div className="text-slate-700">Host: <span className="font-mono font-semibold">{smtpDiagnosticReport.diagnostics.environment?.server}:{smtpDiagnosticReport.diagnostics.environment?.port}</span></div>
                            <div className="text-slate-700">Account: <span className="font-mono font-semibold">{smtpDiagnosticReport.diagnostics.environment?.maskedUsername}</span></div>
                            <div className="text-slate-700">Password: <span className="font-semibold">{smtpDiagnosticReport.diagnostics.environment?.passwordConfigured ? `Configured (${smtpDiagnosticReport.diagnostics.environment?.passwordLength} chars)` : 'Not Configured'}</span></div>
                          </div>

                          <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200/80 space-y-1">
                            <span className="text-slate-500 font-medium block">Connection & Security:</span>
                            <div className="text-slate-700">TCP Socket: <span className={`font-semibold ${smtpDiagnosticReport.diagnostics.network?.reachable ? 'text-emerald-700' : 'text-rose-700'}`}>{smtpDiagnosticReport.diagnostics.network?.reachable ? 'Open & Reachable' : 'Unreachable'}</span></div>
                            <div className="text-slate-700">Authentication: <span className={`font-semibold ${smtpDiagnosticReport.diagnostics.authentication?.verified ? 'text-emerald-700' : 'text-rose-700'}`}>{smtpDiagnosticReport.diagnostics.authentication?.verified ? 'Verified (250 OK)' : 'Failed / Incomplete'}</span></div>
                            <div className="text-slate-700">Security: <span className="font-semibold text-sky-700">Zero Credential Exposure</span></div>
                          </div>
                        </div>
                      )}

                      {smtpDiagnosticReport.recommendations && smtpDiagnosticReport.recommendations.length > 0 && (
                        <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-3 space-y-1.5 text-amber-950">
                          <span className="font-bold text-[11px] uppercase tracking-wider text-amber-900 block">Diagnostic Recommendations:</span>
                          <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900/90 leading-relaxed">
                            {smtpDiagnosticReport.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Database Connection Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-emerald-800 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-600" />
                    MongoDB Atlas Database Connection
                  </h3>
                  {mongoStatus?.connected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Atlas Connected ({mongoStatus.latencyMs || 0}ms)
                    </span>
                  ) : mongoStatus?.connected === false ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      Offline
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Checking...
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Connected to MongoDB Atlas database <code className="bg-white border border-slate-200 px-2 py-0.5 rounded text-emerald-700 font-mono font-semibold">ssec_timetable</code> on cluster <code className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700 font-mono text-[11px]">cluster0.lhna7yh.mongodb.net</code>.
                </p>
                {mongoStatus?.counts && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="bg-white border border-slate-200 rounded-lg p-2 text-center">
                      <span className="block text-slate-400 font-medium">Students</span>
                      <span className="font-bold text-slate-800">{mongoStatus.counts.students ?? 0}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-2 text-center">
                      <span className="block text-slate-400 font-medium">Professors</span>
                      <span className="font-bold text-slate-800">{mongoStatus.counts.professors ?? 0}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-2 text-center">
                      <span className="block text-slate-400 font-medium">Classrooms</span>
                      <span className="font-bold text-slate-800">{mongoStatus.counts.classrooms ?? 0}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-2 text-center">
                      <span className="block text-slate-400 font-medium">Timetables</span>
                      <span className="font-bold text-slate-800">{mongoStatus.counts.timetables ?? 0}</span>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleTestMongo(true)}
                    disabled={testingMongo}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs px-3.5 py-2 rounded-xl font-semibold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingMongo ? 'animate-spin' : ''}`} />
                    <span>{testingMongo ? 'Checking Connection...' : 'Test Atlas Connection'}</span>
                  </button>
                  <button
                    onClick={() => {
                      StorageService.resetToSampleData();
                      refreshData();
                      showFlash('Database restored to SSEC IT sample data.');
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs px-3.5 py-2 rounded-xl font-semibold transition-all shadow-xs"
                  >
                    Reset Local Cache
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 md:col-span-2">
                <h3 className="font-bold text-sm text-sky-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-600" />
                  Department Master PDF Export
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Instantly export complete master department timetables with faculty assignments.
                </p>
                <button
                  onClick={() => generatePDFReport('Master SSEC IT Department Timetable', timetables)}
                  className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Master Timetable PDF</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODULE: REGISTERED USERS */}
      {activeModule === 'users' && (
        <RegisteredUsersView
          users={registeredUsers}
          isLoading={isLoadingUsers}
          errorState={usersErrorState}
          currentSimulationMode={StorageService.getSimulationMode()}
          onRefresh={fetchUsersAsync}
          onToggleStatus={handleToggleUserStatus}
          onDeleteUser={handleDeleteRegisteredUser}
          onShowFlash={showFlash}
          onAddToast={addToast}
        />
      )}

      {/* MODULE 2: STUDENTS CRUD */}
      {activeModule === 'students' && (
        <div className="space-y-6">
          {/* Create Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-600" />
              Add New Student
            </h3>
            <form onSubmit={handleCreateStudent} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={stName}
                onChange={(e) => setStName(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
              />
              <input
                type="text"
                required
                placeholder="Enrollment Number (e.g. 200010116005)"
                value={stEnroll}
                onChange={(e) => setStEnroll(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-mono focus:border-sky-500 focus:outline-none"
              />
              <select
                value={stSem}
                onChange={(e) => setStSem(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 rounded-xl text-xs shadow-xs"
              >
                Add Student
              </button>
            </form>
          </div>

          {/* List & Search */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-base font-bold text-slate-900">Registered Students ({students.length})</h3>
              <input
                type="text"
                placeholder="Search by name or enrollment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-xs w-full sm:w-64 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Enrollment No</th>
                    <th className="p-3">Semester</th>
                    <th className="p-3">Classroom</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {students
                    .filter(s => s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.enrollment_no.includes(searchQuery))
                    .map(st => (
                      <tr key={st.id} className="hover:bg-sky-50/50">
                        <td className="p-3 font-semibold text-slate-900">{st.full_name}</td>
                        <td className="p-3 text-sky-600 font-mono font-bold">{st.enrollment_no}</td>
                        <td className="p-3">Sem {st.semester}</td>
                        <td className="p-3">{st.classroom}</td>
                        <td className="p-3">
                          <button
                            onClick={() => setDeleteTarget({ id: st.id, name: st.full_name, type: 'student', identifier: st.enrollment_no, role: 'student' })}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200"
                            title="Delete Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: PROFESSORS CRUD */}
      {activeModule === 'professors' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              Add New Professor
            </h3>
            <form onSubmit={handleCreateProfessor} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                required
                placeholder="Professor Full Name"
                value={pfName}
                onChange={(e) => setPfName(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
              />
              <input
                type="text"
                required
                placeholder="Professor ID (e.g. PROF_IT_04)"
                value={pfId}
                onChange={(e) => setPfId(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-mono focus:border-sky-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Designation"
                value={pfDesig}
                onChange={(e) => setPfDesig(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-xl text-xs shadow-xs"
              >
                Add Professor
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Department Professors ({professors.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Faculty Name</th>
                    <th className="p-3">Professor ID</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {professors.map(pf => (
                    <tr key={pf.id} className="hover:bg-sky-50/50">
                      <td className="p-3 font-semibold text-slate-900">{pf.full_name}</td>
                      <td className="p-3 text-emerald-600 font-mono font-bold">{pf.professor_id}</td>
                      <td className="p-3">{pf.designation}</td>
                      <td className="p-3">{pf.department}</td>
                      <td className="p-3">
                        <button
                          onClick={() => setDeleteTarget({ id: pf.id, name: pf.full_name, type: 'professor', identifier: pf.professor_id, role: 'professor' })}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODULE: SUBJECTS CRUD */}
      {activeModule === 'subjects' && (
        <div className="space-y-6">
          {/* Create Subject Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Add New Subject (With Subject Code)
            </h3>
            <form onSubmit={handleCreateSubject} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3161605"
                  value={subCode}
                  onChange={(e) => setSubCode(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-mono font-semibold focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Engineering"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Semester</label>
                <select
                  value={subSem}
                  onChange={(e) => setSubSem(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Credits</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  required
                  value={subCredits}
                  onChange={(e) => setSubCredits(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Type</label>
                <select
                  value={subType}
                  onChange={(e) => setSubType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                >
                  <option value="Theory">Theory</option>
                  <option value="Practical">Practical</option>
                </select>
              </div>

              <div className="sm:col-span-4 flex items-end">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl text-xs shadow-xs transition-all"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>

          {/* Subjects Table & Search */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Manage Subjects ({subjects.length})</h3>
                <p className="text-xs text-slate-500 font-medium">Department curriculum catalog with GTU / SSEC Subject Codes</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Search code or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-xs w-full sm:w-48 focus:border-sky-500 focus:outline-none"
                />
                <select
                  value={subFilterSem}
                  onChange={(e) => setSubFilterSem(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                >
                  <option value={0}>All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
                <select
                  value={subFilterType}
                  onChange={(e) => setSubFilterType(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                >
                  <option value="All">All Types</option>
                  <option value="Theory">Theory</option>
                  <option value="Practical">Practical</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Subject Code</th>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3">Semester</th>
                    <th className="p-3">Credits</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {subjects
                    .filter(s => {
                      const matchQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.code.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchSem = subFilterSem === 0 || s.semester === subFilterSem;
                      const matchType = subFilterType === 'All' || s.type === subFilterType;
                      return matchQuery && matchSem && matchType;
                    })
                    .map(sub => (
                      <tr key={sub.id} className="hover:bg-sky-50/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-indigo-700">
                          <span className="bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                            {sub.code}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-900">{sub.name}</td>
                        <td className="p-3 font-medium text-slate-600">Semester {sub.semester}</td>
                        <td className="p-3 font-semibold text-slate-800">{sub.credits} Credits</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.type === 'Theory' ? 'bg-sky-100 text-sky-800 border border-sky-200' : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}>
                            {sub.type}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              onClick={() => setEditingSubject(sub)}
                              className="p-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors"
                              title="Edit Subject"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: sub.id, name: `${sub.name} (${sub.code})`, type: 'subject' })}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                              title="Delete Subject"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODULE: CLASSROOMS CRUD */}
      {activeModule === 'classrooms' && (
        <div className="space-y-6">
          {/* Create Classroom Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-600" />
              Add New Classroom / Laboratory
            </h3>
            <form onSubmit={handleCreateClassroom} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Room Number / ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IT-LH-103 or IT-LAB-203"
                  value={crRoomNo}
                  onChange={(e) => setCrRoomNo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-mono font-semibold focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Room Type</label>
                <select
                  value={crType}
                  onChange={(e) => setCrType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                >
                  <option value="Lecture Hall">Lecture Hall</option>
                  <option value="Computer Lab">Computer Lab</option>
                  <option value="Seminar Hall">Seminar Hall</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Seating Capacity</label>
                <input
                  type="number"
                  min={10}
                  max={300}
                  required
                  value={crCap}
                  onChange={(e) => setCrCap(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-6 flex justify-end">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-2 rounded-xl text-xs shadow-xs transition-all"
                >
                  Create Classroom Record
                </button>
              </div>
            </form>
          </div>

          {/* Classrooms List & Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Department Classrooms & Labs ({classrooms.length})</h3>
                <p className="text-xs text-slate-500 font-medium">Manage infrastructure allocation, room status & capacities</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Search room number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-xs w-full sm:w-48 focus:border-sky-500 focus:outline-none"
                />
                <select
                  value={crFilterType}
                  onChange={(e) => setCrFilterType(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                >
                  <option value="All">All Room Types</option>
                  <option value="Lecture Hall">Lecture Hall</option>
                  <option value="Computer Lab">Computer Lab</option>
                  <option value="Seminar Hall">Seminar Hall</option>
                </select>
                <select
                  value={crFilterStatus}
                  onChange={(e) => setCrFilterStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Room Number</th>
                    <th className="p-3">Building</th>
                    <th className="p-3">Room Type</th>
                    <th className="p-3">Capacity</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {classrooms
                    .filter(c => {
                      const matchQuery = c.room_number.toLowerCase().includes(searchQuery.toLowerCase()) || c.building.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchType = crFilterType === 'All' || c.type === crFilterType;
                      const matchStatus = crFilterStatus === 'All' || c.status === crFilterStatus;
                      return matchQuery && matchType && matchStatus;
                    })
                    .map(room => (
                      <tr key={room.id} className="hover:bg-sky-50/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-800">
                          <span className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                            📍 {room.room_number}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-600">{room.building}</td>
                        <td className="p-3 font-semibold text-slate-800">{room.type}</td>
                        <td className="p-3 font-medium text-slate-700">{room.capacity} Seats</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleClassroomStatus(room)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-transform hover:scale-105 ${
                              room.status === 'Available' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              room.status === 'Occupied' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              'bg-red-100 text-red-800 border border-red-300'
                            }`}
                            title="Click to toggle status"
                          >
                            &bull; {room.status}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              onClick={() => setEditingClassroom(room)}
                              className="p-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors"
                              title="Edit Room"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: room.id, name: `Room ${room.room_number}`, type: 'classroom' })}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                              title="Delete Room"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 4: TIMETABLE CRUD WITH CLASH DETECTION */}
      {activeModule === 'timetable' && (
        <div className="space-y-6">
          {/* SSEC College Timing Banner */}
          <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-blue-50 border border-sky-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-sky-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-sm">College Operating Schedule: 10:45 AM to 05:30 PM</h4>
                  <span className="bg-sky-100 text-sky-800 border border-sky-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    Official SSEC Timings
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  <strong>Theory Slots (1 hr):</strong> 10.45-11.45 AM, 11.45-12.45 PM, 01.15-02.15 PM, 02.15-03.15 PM, 03.30-04.30 PM, 04.30-05.30 PM
                  <br />
                  <strong>Lab Slots (2 hrs):</strong> 10.45 AM - 12.45 PM, 01.15 PM - 03.15 PM, 03.30 PM - 05.30 PM
                  <span className="text-amber-700 ml-1 font-semibold">&bull; Recess: 12.45-01.15 PM &amp; 03.15-03.30 PM</span>
                </p>
              </div>
            </div>
          </div>

          {/* Create Timetable Slot */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" />
                Allocate Academic Timetable Slot
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Session Type:</span>
                <button
                  type="button"
                  onClick={() => handleSessionTypeChange('Theory')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    ttSessionType === 'Theory'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📘 Theory (1 Hr)
                </button>
                <button
                  type="button"
                  onClick={() => handleSessionTypeChange('Lab')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    ttSessionType === 'Lab'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🧪 Lab (2 Hrs)
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateTimetableSlot} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Session Type</label>
                <select
                  value={ttSessionType}
                  onChange={(e) => handleSessionTypeChange(e.target.value as 'Theory' | 'Lab')}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:border-sky-500 focus:outline-none"
                >
                  <option value="Theory">Theory Session (1 Hour)</option>
                  <option value="Lab">Lab / Practical Session (2 Hours)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Semester</label>
                <select
                  value={ttSem}
                  onChange={(e) => setTtSem(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Day</label>
                <select
                  value={ttDay}
                  onChange={(e) => setTtDay(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1 flex items-center justify-between">
                  <span>Time Slot ({ttSessionType})</span>
                  {ttIsManualTime && <span className="text-[10px] text-amber-600 font-bold">Manual Mode</span>}
                </label>
                <select
                  value={ttIsManualTime ? 'MANUAL' : ttTimeSlot}
                  onChange={(e) => {
                    if (e.target.value === 'MANUAL') {
                      setTtIsManualTime(true);
                    } else {
                      setTtIsManualTime(false);
                      setTtTimeSlot(e.target.value);
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-mono font-semibold focus:border-sky-500 focus:outline-none"
                >
                  {(ttSessionType === 'Lab' ? LAB_TIME_SLOTS : THEORY_TIME_SLOTS).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="MANUAL">✏️ Enter Custom Time Manually...</option>
                </select>
              </div>

              {/* Manual Time Input if selected */}
              {ttIsManualTime && (
                <div className="sm:col-span-4 bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] text-amber-800 font-bold uppercase tracking-wide mb-1">
                      Custom Time Slot (College Hours: 10:45 AM to 05:30 PM)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 10.45 AM to 11.45 AM or 01.15 PM to 03.15 PM"
                      value={ttCustomTime}
                      onChange={(e) => setTtCustomTime(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTtIsManualTime(false);
                      setTtTimeSlot(ttSessionType === 'Lab' ? LAB_TIME_SLOTS[0] : THEORY_TIME_SLOTS[0]);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2 shrink-0 self-end sm:self-center"
                  >
                    Reset to Presets
                  </button>
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Subject</label>
                <select
                  value={ttSubject}
                  onChange={(e) => setTtSubject(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                >
                  <option value="">Select Subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.name}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Assigned Professor</label>
                <select
                  value={ttProfessor}
                  onChange={(e) => setTtProfessor(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                >
                  <option value="">Select Professor...</option>
                  {professors.map(p => <option key={p.id} value={p.full_name}>{p.full_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Room Number</label>
                <select
                  value={ttRoomNo}
                  onChange={(e) => setTtRoomNo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                >
                  {classrooms.map(c => <option key={c.id} value={c.room_number}>{c.room_number} ({c.type})</option>)}
                </select>
              </div>

              <div className="sm:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 rounded-xl text-xs shadow-xs transition-all"
                >
                  Allocate Timetable Slot
                </button>
              </div>
            </form>
          </div>

          {/* Timetables Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Master Department Timetable Slots ({timetables.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Day &amp; Time</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Semester</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Professor</th>
                    <th className="p-3">Room</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {timetables.map(slot => (
                    <tr key={slot.id} className="hover:bg-sky-50/50">
                      <td className="p-3 font-semibold text-slate-900">
                        <div>{slot.day}</div>
                        <div className="text-[10px] text-sky-600 font-mono font-bold">{slot.time_slot}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          slot.session_type === 'Lab' || slot.subject.toLowerCase().includes('lab')
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-sky-100 text-sky-800 border border-sky-200'
                        }`}>
                          {slot.session_type || (slot.subject.toLowerCase().includes('lab') ? 'Lab' : 'Theory')}
                        </span>
                      </td>
                      <td className="p-3">Sem {slot.semester}</td>
                      <td className="p-3 text-sky-700 font-semibold">{slot.subject}</td>
                      <td className="p-3 text-emerald-700 font-semibold">{slot.professor}</td>
                      <td className="p-3 font-mono font-bold">{slot.room_number}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setDeleteTarget({ id: slot.id, name: `${slot.subject} (${slot.day})`, type: 'timetable' })}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200"
                          title="Delete Slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 5: NOTIFICATIONS CRUD */}
      {activeModule === 'notifications' && (
        <div className="space-y-6">
          {/* Create Notification Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-600" />
              Publish Department Notification
            </h3>
            <form onSubmit={handleCreateNotification} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Notification Title (e.g., Mid-Sem Examination Schedule Released)"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:border-sky-500 focus:outline-none"
              />
              <textarea
                required
                placeholder="Notification Description & Details..."
                value={notifDesc}
                onChange={(e) => setNotifDesc(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs h-20 focus:border-sky-500 focus:outline-none"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={notifPriority}
                  onChange={(e) => setNotifPriority(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                >
                  <option value="High">🔴 High Priority</option>
                  <option value="Medium">🟡 Medium Priority</option>
                  <option value="Low">🔵 Low Priority</option>
                </select>
                <select
                  value={notifTarget}
                  onChange={(e) => setNotifTarget(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:border-sky-500 focus:outline-none"
                >
                  <option value="All">Target: All Users (Students & Faculty)</option>
                  <option value="Student">Target: Students Only</option>
                  <option value="Professor">Target: Professors Only</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" /> Publish Department Notification
              </button>
            </form>
          </div>

          {/* Manage Live Notifications Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-sky-600" />
                  Live Department Announcements &amp; Notifications ({notifications.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Admin CRUD panel: Edit, Delete, filter, or toggle status of published announcements.</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search notice..."
                    value={notifSearchQuery}
                    onChange={(e) => setNotifSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 w-36 sm:w-48"
                  />
                </div>
                <select
                  value={notifFilterPriority}
                  onChange={(e) => setNotifFilterPriority(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
                >
                  <option value="All">All Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
                <select
                  value={notifFilterTarget}
                  onChange={(e) => setNotifFilterTarget(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
                >
                  <option value="All">All Targets</option>
                  <option value="Student">Students Only</option>
                  <option value="Professor">Professors Only</option>
                </select>
              </div>
            </div>

            {/* Notifications Table */}
            <div className="overflow-x-auto">
              {(() => {
                const filtered = notifications.filter(n => {
                  const matchSearch = notifSearchQuery === '' ||
                    n.title.toLowerCase().includes(notifSearchQuery.toLowerCase()) ||
                    n.description.toLowerCase().includes(notifSearchQuery.toLowerCase());
                  const matchPriority = notifFilterPriority === 'All' || n.priority === notifFilterPriority;
                  const matchTarget = notifFilterTarget === 'All' || n.target_role === notifFilterTarget;
                  return matchSearch && matchPriority && matchTarget;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                      No notifications found matching your search filter.
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-3">Title &amp; Description</th>
                        <th className="p-3">Target</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filtered.map(n => (
                        <tr key={n.id} className="hover:bg-slate-50">
                          <td className="p-3 max-w-xs sm:max-w-md">
                            <div className="font-bold text-slate-900 text-xs">{n.title}</div>
                            <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.description}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              n.target_role === 'Student'
                                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                : n.target_role === 'Professor'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}>
                              {n.target_role === 'All' ? '👥 All Users' : n.target_role === 'Student' ? '🎓 Students' : '👨‍🏫 Professors'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              n.priority === 'High'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : n.priority === 'Medium'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {n.priority}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-600">{n.publish_date}</td>
                          <td className="p-3">
                            <button
                              onClick={() => handleToggleNotificationStatus(n)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 ${
                                n.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                  : 'bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300'
                              }`}
                              title="Click to toggle Active/Inactive"
                            >
                              {n.status === 'Active' ? <ToggleRight className="w-3.5 h-3.5 text-emerald-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />}
                              {n.status}
                            </button>
                          </td>
                          <td className="p-3 text-right space-x-1.5">
                            <button
                              onClick={() => setEditingNotification(n)}
                              className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg border border-amber-200 transition-all"
                              title="Edit Notification"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: n.id, name: `Notification: ${n.title}`, type: 'notification' })}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200 transition-all"
                              title="Delete Notification"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 6: MULTI-SECTION CUSTOM REPORT GENERATOR */}
      {activeModule === 'reports' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full text-xs font-semibold border border-sky-400/30">
                <FileText className="w-3.5 h-3.5" />
                <span>Multi-Section Choice Generator</span>
              </div>
              <h3 className="text-xl font-bold text-white">Academic Custom Report Builder</h3>
              <p className="text-xs text-slate-300 max-w-2xl">
                Select any single or multiple department sections to compile comprehensive PDF, CSV, or JSON academic reports on demand.
              </p>
            </div>
          </div>

          {/* Section Selector Card (Multiple Choice Checkboxes) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-sky-600" />
                  Select Sections to Include in Report (Multiple Choices Available)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Toggle checkboxes for individual sections to customize your output report.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReportSelectedSections({ timetable: true, students: true, professors: true, subjects: true, classrooms: true, notifications: true })}
                  className="text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 px-3 py-1 rounded-xl font-bold border border-sky-200 transition-all"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setReportSelectedSections({ timetable: false, students: false, professors: false, subjects: false, classrooms: false, notifications: false })}
                  className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-1 rounded-xl font-bold border border-slate-200 transition-all"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Checkboxes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: 'timetable', label: '1. Timetable Schedule Slots', desc: `${timetables.length} Timetable Slots`, icon: Calendar, color: 'text-sky-600 bg-sky-50 border-sky-200' },
                { key: 'students', label: '2. Students Roster', desc: `${students.length} Enrolled Students`, icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                { key: 'professors', label: '3. Faculty & Professors Directory', desc: `${professors.length} Faculty Members`, icon: UserCheck, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
                { key: 'subjects', label: '4. Course Subjects & Curriculum', desc: `${subjects.length} Subjects`, icon: BookOpen, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                { key: 'classrooms', label: '5. Infrastructure & Classrooms', desc: `${classrooms.length} Classrooms`, icon: MapPin, color: 'text-purple-600 bg-purple-50 border-purple-200' },
                { key: 'notifications', label: '6. Live Department Notifications', desc: `${notifications.length} Announcements`, icon: Bell, color: 'text-rose-600 bg-rose-50 border-rose-200' }
              ].map(sec => {
                const Icon = sec.icon;
                const isChecked = reportSelectedSections[sec.key as keyof typeof reportSelectedSections];
                return (
                  <label
                    key={sec.key}
                    onClick={() => setReportSelectedSections(prev => ({ ...prev, [sec.key]: !isChecked }))}
                    className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? `${sec.color} ring-2 ring-sky-500/30 shadow-xs`
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="mt-0.5 mr-3 shrink-0">
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-sky-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{sec.label}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{sec.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Scope Filters & Customization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Report Document Title</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                  placeholder="Enter document title..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Filter by Semester Scope</label>
                <select
                  value={reportSemFilter}
                  onChange={(e) => setReportSemFilter(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                >
                  <option value={0}>All Semesters (Sem 1 to 8)</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s} Only</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Export Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleGenerateMultiReportPDF}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-xs text-xs flex items-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Generate PDF Report</span>
              </button>
              <button
                onClick={handleExportReportCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-xs text-xs flex items-center gap-2 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV Spreadsheet</span>
              </button>
              <button
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2.5 rounded-xl shadow-xs text-xs flex items-center gap-2 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
              <button
                onClick={handleExportReportJSON}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-xs text-xs flex items-center gap-2 transition-all"
              >
                <FileJson className="w-4 h-4" />
                <span>Export JSON Data</span>
              </button>
            </div>
          </div>

          {/* Report Interactive Document Preview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-sky-600 block">SSEC IT Department Official Document</span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{reportTitle || 'Custom Department Multi-Section Report'}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Scope: <strong className="text-slate-700">{reportSemFilter > 0 ? `Semester ${reportSemFilter}` : 'All Semesters'}</strong> &bull; Generated: {new Date().toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className="bg-slate-100 text-slate-700 font-mono text-[11px] font-bold px-3 py-1 rounded-full border border-slate-200 block">
                  REF: SSEC-IT-RPT-{Date.now().toString().slice(-6)}
                </span>
              </div>
            </div>

            {/* Selected Sections Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {reportSelectedSections.timetable && (
                <div className="bg-sky-50 border border-sky-200 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-sky-700 font-bold block">Timetable</span>
                  <span className="text-lg font-bold text-sky-900">
                    {reportSemFilter > 0 ? timetables.filter(t => t.semester === reportSemFilter).length : timetables.length} Slots
                  </span>
                </div>
              )}
              {reportSelectedSections.students && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-emerald-700 font-bold block">Students</span>
                  <span className="text-lg font-bold text-emerald-900">
                    {reportSemFilter > 0 ? students.filter(s => s.semester === reportSemFilter).length : students.length} Students
                  </span>
                </div>
              )}
              {reportSelectedSections.professors && (
                <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-indigo-700 font-bold block">Faculty</span>
                  <span className="text-lg font-bold text-indigo-900">{professors.length} Faculty</span>
                </div>
              )}
              {reportSelectedSections.subjects && (
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-amber-700 font-bold block">Subjects</span>
                  <span className="text-lg font-bold text-amber-900">
                    {reportSemFilter > 0 ? subjects.filter(s => s.semester === reportSemFilter).length : subjects.length} Courses
                  </span>
                </div>
              )}
              {reportSelectedSections.classrooms && (
                <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-purple-700 font-bold block">Classrooms</span>
                  <span className="text-lg font-bold text-purple-900">{classrooms.length} Rooms</span>
                </div>
              )}
              {reportSelectedSections.notifications && (
                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-rose-700 font-bold block">Notifications</span>
                  <span className="text-lg font-bold text-rose-900">{notifications.length} Notice</span>
                </div>
              )}
            </div>

            {/* Render selected sections tables */}
            {/* 1. Timetables */}
            {reportSelectedSections.timetable && (
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-sky-700 flex items-center gap-1.5 border-b pb-1">
                  <Calendar className="w-4 h-4" /> 1. Timetable Schedule Slots
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700 uppercase border-b">
                      <tr>
                        <th className="p-2">Day &amp; Time</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Sem</th>
                        <th className="p-2">Subject</th>
                        <th className="p-2">Faculty</th>
                        <th className="p-2">Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(reportSemFilter > 0 ? timetables.filter(t => t.semester === reportSemFilter) : timetables).map(t => (
                        <tr key={t.id}>
                          <td className="p-2 font-semibold text-slate-900">{t.day} ({t.time_slot})</td>
                          <td className="p-2 text-sky-700 font-bold">{t.session_type || 'Theory'}</td>
                          <td className="p-2">Sem {t.semester}</td>
                          <td className="p-2 font-medium">{t.subject}</td>
                          <td className="p-2 text-emerald-700 font-medium">{t.professor}</td>
                          <td className="p-2 font-mono font-bold">{t.room_number}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Students */}
            {reportSelectedSections.students && (
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 border-b pb-1">
                  <Users className="w-4 h-4" /> 2. Enrolled Students Roster
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700 uppercase border-b">
                      <tr>
                        <th className="p-2">Enrollment No</th>
                        <th className="p-2">Student Name</th>
                        <th className="p-2">Sem</th>
                        <th className="p-2">Classroom</th>
                        <th className="p-2">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(reportSemFilter > 0 ? students.filter(s => s.semester === reportSemFilter) : students).map(s => (
                        <tr key={s.id}>
                          <td className="p-2 font-mono font-bold text-slate-900">{s.enrollment_no}</td>
                          <td className="p-2 font-semibold text-sky-800">{s.full_name}</td>
                          <td className="p-2">Sem {s.semester}</td>
                          <td className="p-2">{s.classroom || 'IT-LH-101'}</td>
                          <td className="p-2 text-slate-500 font-mono text-[11px]">{s.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Professors */}
            {reportSelectedSections.professors && (
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 border-b pb-1">
                  <UserCheck className="w-4 h-4" /> 3. Faculty &amp; Professors Directory
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700 uppercase border-b">
                      <tr>
                        <th className="p-2">Prof ID</th>
                        <th className="p-2">Full Name</th>
                        <th className="p-2">Designation</th>
                        <th className="p-2">Department</th>
                        <th className="p-2">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {professors.map(p => (
                        <tr key={p.id}>
                          <td className="p-2 font-mono font-bold text-slate-900">{p.professor_id}</td>
                          <td className="p-2 font-semibold text-indigo-800">{p.full_name}</td>
                          <td className="p-2 text-slate-700">{p.designation}</td>
                          <td className="p-2 text-slate-600">{p.department}</td>
                          <td className="p-2 text-slate-500 font-mono text-[11px]">{p.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. Subjects */}
            {reportSelectedSections.subjects && (
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-amber-700 flex items-center gap-1.5 border-b pb-1">
                  <BookOpen className="w-4 h-4" /> 4. Course Subjects &amp; Curriculum
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700 uppercase border-b">
                      <tr>
                        <th className="p-2">Subject Code</th>
                        <th className="p-2">Subject Name</th>
                        <th className="p-2">Sem</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Credits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(reportSemFilter > 0 ? subjects.filter(s => s.semester === reportSemFilter) : subjects).map(s => (
                        <tr key={s.id}>
                          <td className="p-2 font-mono font-bold text-amber-800">{s.code}</td>
                          <td className="p-2 font-semibold text-slate-900">{s.name}</td>
                          <td className="p-2">Sem {s.semester}</td>
                          <td className="p-2 font-medium">{s.type}</td>
                          <td className="p-2 font-bold">{s.credits} Credits</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. Classrooms */}
            {reportSelectedSections.classrooms && (
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-purple-700 flex items-center gap-1.5 border-b pb-1">
                  <MapPin className="w-4 h-4" /> 5. Infrastructure &amp; Classrooms
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700 uppercase border-b">
                      <tr>
                        <th className="p-2">Room No</th>
                        <th className="p-2">Building Block</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Capacity</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classrooms.map(c => (
                        <tr key={c.id}>
                          <td className="p-2 font-mono font-bold text-slate-900">{c.room_number}</td>
                          <td className="p-2 text-slate-600">{c.building}</td>
                          <td className="p-2 font-medium">{c.type}</td>
                          <td className="p-2 font-bold">{c.capacity} Seats</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. Notifications */}
            {reportSelectedSections.notifications && (
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-rose-700 flex items-center gap-1.5 border-b pb-1">
                  <Bell className="w-4 h-4" /> 6. Live Department Notifications
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700 uppercase border-b">
                      <tr>
                        <th className="p-2">Title</th>
                        <th className="p-2">Priority</th>
                        <th className="p-2">Target</th>
                        <th className="p-2">Publish Date</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {notifications.map(n => (
                        <tr key={n.id}>
                          <td className="p-2 font-semibold text-slate-900">{n.title}</td>
                          <td className="p-2 font-bold">{n.priority}</td>
                          <td className="p-2">{n.target_role}</td>
                          <td className="p-2 font-mono text-[11px] text-slate-600">{n.publish_date}</td>
                          <td className="p-2 font-bold text-emerald-700">{n.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer Seal */}
            <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
              <div>
                <strong>Shantilal Shah Engineering College, Bhavnagar</strong>
                <div>Department of Information Technology</div>
              </div>
              <div className="text-right">
                <strong className="text-slate-800">Approved by HOD IT Admin</strong>
                <div>Official Department Seal</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl w-fit border border-red-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{deleteTarget.name}</strong>? This operation cannot be undone.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 py-2 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-xs font-semibold shadow-xs"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SUBJECT MODAL */}
      {editingSubject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-600" /> Edit Subject Record
              </h3>
              <button onClick={() => setEditingSubject(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  value={editingSubject.code}
                  onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Semester</label>
                  <select
                    value={editingSubject.semester}
                    onChange={(e) => setEditingSubject({ ...editingSubject, semester: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    required
                    value={editingSubject.credits}
                    onChange={(e) => setEditingSubject({ ...editingSubject, credits: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                <select
                  value={editingSubject.type}
                  onChange={(e) => setEditingSubject({ ...editingSubject, type: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Theory">Theory</option>
                  <option value="Practical">Practical</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-xl text-xs font-semibold shadow-xs"
                >
                  Save Subject Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLASSROOM MODAL */}
      {editingClassroom && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" /> Edit Classroom / Lab
              </h3>
              <button onClick={() => setEditingClassroom(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateClassroom} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Room Number / ID</label>
                <input
                  type="text"
                  required
                  value={editingClassroom.room_number}
                  onChange={(e) => setEditingClassroom({ ...editingClassroom, room_number: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Room Type</label>
                  <select
                    value={editingClassroom.type}
                    onChange={(e) => setEditingClassroom({ ...editingClassroom, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="Lecture Hall">Lecture Hall</option>
                    <option value="Computer Lab">Computer Lab</option>
                    <option value="Seminar Hall">Seminar Hall</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    min={10}
                    max={300}
                    required
                    value={editingClassroom.capacity}
                    onChange={(e) => setEditingClassroom({ ...editingClassroom, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Room Status</label>
                <select
                  value={editingClassroom.status}
                  onChange={(e) => setEditingClassroom({ ...editingClassroom, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingClassroom(null)}
                  className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow-xs"
                >
                  Save Room Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT NOTIFICATION MODAL */}
      {editingNotification && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-600" /> Edit Notification Record
              </h3>
              <button onClick={() => setEditingNotification(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateNotification} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notification Title</label>
                <input
                  type="text"
                  required
                  value={editingNotification.title}
                  onChange={(e) => setEditingNotification({ ...editingNotification, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description & Content</label>
                <textarea
                  required
                  rows={3}
                  value={editingNotification.description}
                  onChange={(e) => setEditingNotification({ ...editingNotification, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
                  <select
                    value={editingNotification.priority}
                    onChange={(e) => setEditingNotification({ ...editingNotification, priority: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Target Role</label>
                  <select
                    value={editingNotification.target_role}
                    onChange={(e) => setEditingNotification({ ...editingNotification, target_role: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="All">All Users</option>
                    <option value="Student">Students Only</option>
                    <option value="Professor">Professors Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select
                  value={editingNotification.status}
                  onChange={(e) => setEditingNotification({ ...editingNotification, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Active">Active (Visible)</option>
                  <option value="Inactive">Inactive (Hidden)</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingNotification(null)}
                  className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow-xs"
                >
                  Save Notification Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Stack */}
      <ToastNotificationStack toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
};
