export type UserRole = 'student' | 'professor' | 'admin';

export interface Student {
  id: string;
  full_name: string;
  enrollment_no: string;
  semester: number;
  classroom: string;
  email: string;
  phone: string;
  password?: string;
  registered_at?: string;
  status?: 'Active' | 'Inactive' | 'Pending';
}

export interface Professor {
  id: string;
  full_name: string;
  professor_id: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
  password?: string;
  registered_at?: string;
  status?: 'Active' | 'Inactive' | 'Pending';
}

export interface RegisteredUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  identifier: string; // Enrollment No / Prof ID / Username
  semester?: number;
  classroom?: string;
  department?: string;
  designation?: string;
  phone?: string;
  status: 'Active' | 'Inactive' | 'Pending';
  registered_at: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  semester: number;
  credits: number;
  type: 'Theory' | 'Practical';
}

export interface Classroom {
  id: string;
  room_number: string;
  building: string;
  capacity: number;
  type: 'Lecture Hall' | 'Computer Lab' | 'Seminar Hall';
  status: 'Available' | 'Occupied' | 'Maintenance';
}

export interface TimetableSlot {
  id: string;
  semester: number;
  classroom: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  time_slot: string;
  subject: string;
  session_type?: 'Theory' | 'Lab';
  professor: string;
  professor_id?: string;
  room_number: string;
  academic_year: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  publish_date: string;
  status: 'Active' | 'Draft' | 'Inactive';
  target_role: 'All' | 'Student' | 'Professor';
  is_read?: boolean;
}

export interface AuthUser {
  role: UserRole;
  id: string;
  name: string;
  identifier: string; // Enrollment No / Prof ID / Username
  semester?: number;
  classroom?: string;
  department?: string;
}

export interface MongoAtlasConfig {
  mongo_uri: string;
  db_name: string;
  is_connected: boolean;
  cluster_name: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  title?: string;
  message: string;
  timestamp?: number;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  details?: string;
}

export interface ApiFetchResult<T> {
  success: boolean;
  data: T;
  error?: string;
  errorCode?: string;
  fromCache?: boolean;
  timestamp: string;
  latencyMs?: number;
}

export type ActivityActionType = 'CREATE' | 'DELETE' | 'UPDATE' | 'STATUS_CHANGE' | 'SYSTEM' | 'SECURITY';
export type ActivityCategory = 'USER' | 'STUDENT' | 'PROFESSOR' | 'SUBJECT' | 'CLASSROOM' | 'TIMETABLE' | 'NOTIFICATION' | 'DATABASE';

export interface ActivityLog {
  id: string;
  timestamp: string;
  action_type: ActivityActionType;
  target_category: ActivityCategory;
  target_name: string;
  target_id?: string;
  performed_by: string; // e.g. "SSEC.IT.ADMIN"
  details: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
}

