import { Student, Professor, Subject, Classroom, TimetableSlot, NotificationItem } from '../types';

export const initialStudents: Student[] = [
  {
    id: 'st_01',
    full_name: 'Rohan Sharma',
    enrollment_no: '200010116001',
    semester: 6,
    classroom: 'IT-LH-101',
    email: 'rohan.sharma@ssec.ac.in',
    phone: '+91 9876543210'
  },
  {
    id: 'st_02',
    full_name: 'Priya Patel',
    enrollment_no: '200010116002',
    semester: 4,
    classroom: 'IT-LH-102',
    email: 'priya.patel@ssec.ac.in',
    phone: '+91 9876543211'
  },
  {
    id: 'st_03',
    full_name: 'Amit Parmar',
    enrollment_no: '200010116003',
    semester: 6,
    classroom: 'IT-LH-101',
    email: 'amit.parmar@ssec.ac.in',
    phone: '+91 9876543212'
  },
  {
    id: 'st_04',
    full_name: 'Neha Joshi',
    enrollment_no: '200010116004',
    semester: 6,
    classroom: 'IT-LH-101',
    email: 'neha.joshi@ssec.ac.in',
    phone: '+91 9876543213'
  }
];

export const initialProfessors: Professor[] = [
  {
    id: 'pf_01',
    full_name: 'Dr. A. K. Patel',
    professor_id: 'PROF_IT_01',
    department: 'Information Technology',
    designation: 'Head of Department (HOD)',
    email: 'akpatel@ssec.ac.in',
    phone: '+91 9825012345'
  },
  {
    id: 'pf_02',
    full_name: 'Prof. R. M. Shah',
    professor_id: 'PROF_IT_02',
    department: 'Information Technology',
    designation: 'Assistant Professor',
    email: 'rmshah@ssec.ac.in',
    phone: '+91 9825054321'
  },
  {
    id: 'pf_03',
    full_name: 'Prof. S. V. Mehta',
    professor_id: 'PROF_IT_03',
    department: 'Information Technology',
    designation: 'Associate Professor',
    email: 'svmehta@ssec.ac.in',
    phone: '+91 9825099887'
  }
];

export const initialSubjects: Subject[] = [
  { id: 'sub_01', code: '3160704', name: 'Data Mining & Business Intelligence', semester: 6, credits: 4, type: 'Theory' },
  { id: 'sub_02', code: '3160707', name: 'Advanced Java Programming Lab', semester: 6, credits: 4, type: 'Practical' },
  { id: 'sub_03', code: '3160712', name: 'Cloud Computing & Services', semester: 6, credits: 3, type: 'Theory' },
  { id: 'sub_04', code: '3140705', name: 'Object Oriented Programming (OOP)', semester: 4, credits: 4, type: 'Theory' },
  { id: 'sub_05', code: '3140708', name: 'Database Management Systems (DBMS)', semester: 4, credits: 4, type: 'Theory' },
  { id: 'sub_06', code: '3140709', name: 'Web Technology & Frameworks Lab', semester: 4, credits: 3, type: 'Practical' }
];

export const initialClassrooms: Classroom[] = [
  { id: 'cr_01', room_number: 'IT-LH-101', building: 'IT Block Ground Floor', capacity: 70, type: 'Lecture Hall', status: 'Available' },
  { id: 'cr_02', room_number: 'IT-LH-102', building: 'IT Block Ground Floor', capacity: 70, type: 'Lecture Hall', status: 'Available' },
  { id: 'cr_03', room_number: 'IT-Lab-1', building: 'IT Block First Floor', capacity: 35, type: 'Computer Lab', status: 'Available' },
  { id: 'cr_04', room_number: 'IT-Lab-2', building: 'IT Block First Floor', capacity: 35, type: 'Computer Lab', status: 'Available' }
];

export const initialTimetables: TimetableSlot[] = [
  {
    id: 'tt_01',
    semester: 6,
    classroom: 'IT-LH-101',
    day: 'Monday',
    time_slot: '10.45 AM to 11.45 AM',
    session_type: 'Theory',
    subject: 'Data Mining & Business Intelligence',
    professor: 'Dr. A. K. Patel',
    professor_id: 'PROF_IT_01',
    room_number: 'IT-LH-101',
    academic_year: '2025-2026'
  },
  {
    id: 'tt_02',
    semester: 6,
    classroom: 'IT-LH-101',
    day: 'Monday',
    time_slot: '11.45 AM to 12.45 PM',
    session_type: 'Theory',
    subject: 'Cloud Computing & Services',
    professor: 'Prof. S. V. Mehta',
    professor_id: 'PROF_IT_03',
    room_number: 'IT-LH-101',
    academic_year: '2025-2026'
  },
  {
    id: 'tt_03',
    semester: 6,
    classroom: 'IT-LH-101',
    day: 'Monday',
    time_slot: '01.15 PM to 03.15 PM',
    session_type: 'Lab',
    subject: 'Advanced Java Programming Lab',
    professor: 'Prof. R. M. Shah',
    professor_id: 'PROF_IT_02',
    room_number: 'IT-Lab-1',
    academic_year: '2025-2026'
  },
  {
    id: 'tt_04',
    semester: 6,
    classroom: 'IT-LH-101',
    day: 'Tuesday',
    time_slot: '10.45 AM to 11.45 AM',
    session_type: 'Theory',
    subject: 'Cloud Computing & Services',
    professor: 'Prof. S. V. Mehta',
    professor_id: 'PROF_IT_03',
    room_number: 'IT-LH-101',
    academic_year: '2025-2026'
  },
  {
    id: 'tt_05',
    semester: 6,
    classroom: 'IT-LH-101',
    day: 'Tuesday',
    time_slot: '11.45 AM to 12.45 PM',
    session_type: 'Theory',
    subject: 'Data Mining & Business Intelligence',
    professor: 'Dr. A. K. Patel',
    professor_id: 'PROF_IT_01',
    room_number: 'IT-LH-101',
    academic_year: '2025-2026'
  },
  {
    id: 'tt_06',
    semester: 6,
    classroom: 'IT-LH-101',
    day: 'Wednesday',
    time_slot: '01.15 PM to 03.15 PM',
    session_type: 'Lab',
    subject: 'Advanced Java Programming Lab',
    professor: 'Prof. R. M. Shah',
    professor_id: 'PROF_IT_02',
    room_number: 'IT-Lab-2',
    academic_year: '2025-2026'
  },
  {
    id: 'tt_07',
    semester: 4,
    classroom: 'IT-LH-102',
    day: 'Monday',
    time_slot: '10.45 AM to 11.45 AM',
    session_type: 'Theory',
    subject: 'Database Management Systems (DBMS)',
    professor: 'Prof. R. M. Shah',
    professor_id: 'PROF_IT_02',
    room_number: 'IT-LH-102',
    academic_year: '2025-2026'
  },
  {
    id: 'tt_08',
    semester: 4,
    classroom: 'IT-LH-102',
    day: 'Monday',
    time_slot: '11.45 AM to 12.45 PM',
    session_type: 'Theory',
    subject: 'Object Oriented Programming (OOP)',
    professor: 'Prof. S. V. Mehta',
    professor_id: 'PROF_IT_03',
    room_number: 'IT-LH-102',
    academic_year: '2025-2026'
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif_01',
    title: 'Mid-Semester Examination Schedule Announced',
    description: 'Mid-sem examinations for Semester 4 & 6 IT students start from March 15, 2026. Hall tickets released.',
    priority: 'High',
    publish_date: '2026-03-01',
    status: 'Active',
    target_role: 'All',
    is_read: false
  },
  {
    id: 'notif_02',
    title: 'Faculty Department Meeting on Timetable Revision',
    description: 'All IT department professors are requested to attend the academic committee meeting in HOD Room.',
    priority: 'Medium',
    publish_date: '2026-03-02',
    status: 'Active',
    target_role: 'Professor',
    is_read: false
  },
  {
    id: 'notif_03',
    title: 'Cloud Computing Lab Rescheduled for Sem 6',
    description: 'Wednesday afternoon Cloud Lab shift has been updated to IT-Lab-2. Check updated schedule.',
    priority: 'Low',
    publish_date: '2026-03-03',
    status: 'Active',
    target_role: 'Student',
    is_read: false
  }
];

