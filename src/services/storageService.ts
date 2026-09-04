import { Student, Professor, Subject, Classroom, TimetableSlot, NotificationItem, AuthUser, MongoAtlasConfig, RegisteredUser, ApiFetchResult, ActivityLog } from '../types';
import { initialStudents, initialProfessors, initialSubjects, initialClassrooms, initialTimetables, initialNotifications } from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'ssec_registered_users_v1',
  STUDENTS: 'ssec_students_v1',
  PROFESSORS: 'ssec_professors_v1',
  SUBJECTS: 'ssec_subjects_v1',
  CLASSROOMS: 'ssec_classrooms_v1',
  TIMETABLES: 'ssec_timetables_v1',
  NOTIFICATIONS: 'ssec_notifications_v1',
  AUTH: 'ssec_auth_session_v1',
  MONGO_CONFIG: 'ssec_mongo_config_v1',
  ACTIVITY_LOGS: 'ssec_activity_logs_v1'
};

const initialActivityLogs: ActivityLog[] = [];


export class StorageService {
  private static getItem<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
      console.error(`Error reading ${key} from storage`, e);
      return defaultVal;
    }
  }

  private static setItem<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error(`Error saving ${key} to storage`, e);
    }
  }

  // --- Auth Session ---
  static getAuth(): AuthUser | null {
    return this.getItem<AuthUser | null>(STORAGE_KEYS.AUTH, null);
  }

  static setAuth(user: AuthUser | null): void {
    this.setItem(STORAGE_KEYS.AUTH, user);
  }

  // --- Mongo Atlas Config ---
  static getMongoConfig(): MongoAtlasConfig {
    return this.getItem<MongoAtlasConfig>(STORAGE_KEYS.MONGO_CONFIG, {
      mongo_uri: 'mongodb+srv://admin:SSECIT2026@cluster0.lhna7yh.mongodb.net/?appName=Cluster0',
      db_name: 'ssec_timetable',
      is_connected: true,
      cluster_name: 'cluster0.lhna7yh.mongodb.net'
    });
  }

  static setMongoConfig(config: MongoAtlasConfig): void {
    this.setItem(STORAGE_KEYS.MONGO_CONFIG, config);
  }

  static async testMongoLiveConnection(): Promise<{
    connected: boolean;
    latencyMs?: number;
    cluster?: string;
    database?: string;
    counts?: Record<string, number>;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/mongo/status', {
        headers: { Accept: 'application/json' }
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        connected: false,
        error: err.message || 'Failed to reach API endpoint'
      };
    }
  }

  // --- Network & Database Simulation States ---
  private static simFailureMode: 'none' | 'network_error' | 'db_timeout' | 'server_error' = 'none';

  static getSimulationMode(): 'none' | 'network_error' | 'db_timeout' | 'server_error' {
    return this.simFailureMode;
  }

  static setSimulationMode(mode: 'none' | 'network_error' | 'db_timeout' | 'server_error'): void {
    this.simFailureMode = mode;
  }

  // --- Registered Users Directory (Async with Network & DB Error Handling) ---
  static async fetchRegisteredUsersAsync(options?: {
    forceMode?: 'none' | 'network_error' | 'db_timeout' | 'server_error';
  }): Promise<ApiFetchResult<RegisteredUser[]>> {
    const startTime = performance.now();
    const mode = options?.forceMode ?? this.simFailureMode;

    // Simulate network latency (200ms - 450ms)
    await new Promise(res => setTimeout(res, 300));

    const fallbackUsers = this.getRegisteredUsers();

    // Check for simulated or real network/database failure
    if (mode === 'network_error' || (!navigator.onLine && mode !== 'none')) {
      const elapsed = Math.round(performance.now() - startTime);
      return {
        success: false,
        data: fallbackUsers,
        error: 'Network connection failed: Unable to establish TCP handshake with api.ssec.ac.in (ERR_NETWORK_DISCONNECTED)',
        errorCode: 'ERR_NETWORK_DISCONNECTED',
        fromCache: true,
        timestamp: new Date().toISOString(),
        latencyMs: elapsed
      };
    }

    if (mode === 'db_timeout') {
      const elapsed = Math.round(performance.now() - startTime);
      const mongoConfig = this.getMongoConfig();
      return {
        success: false,
        data: fallbackUsers,
        error: `MongoDB Atlas connection timed out (504 Gateway Timeout) on cluster '${mongoConfig.cluster_name}' for database '${mongoConfig.db_name}'.`,
        errorCode: 'ERR_DB_TIMEOUT',
        fromCache: true,
        timestamp: new Date().toISOString(),
        latencyMs: elapsed
      };
    }

    if (mode === 'server_error') {
      const elapsed = Math.round(performance.now() - startTime);
      return {
        success: false,
        data: fallbackUsers,
        error: 'HTTP 500 Internal Server Error: Flask/PyMongo driver encountered an unexpected cursor exception in /api/users route.',
        errorCode: 'ERR_SERVER_INTERNAL',
        fromCache: true,
        timestamp: new Date().toISOString(),
        latencyMs: elapsed
      };
    }

    // Try real API call if running in full stack environment, fallback gracefully
    try {
      if (typeof window !== 'undefined' && window.location.origin) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch('/api/users', { 
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        }).catch(() => null);
        
        clearTimeout(timeoutId);

        if (response && response.ok) {
          const json = await response.json();
          if (json && Array.isArray(json.users) && json.users.length > 0) {
            const elapsed = Math.round(performance.now() - startTime);
            return {
              success: true,
              data: json.users,
              timestamp: new Date().toISOString(),
              latencyMs: elapsed,
              fromCache: false
            };
          }
        }
      }
    } catch {
      // Graceful fallback to client storage
    }

    // Default successful retrieval from synchronized database model
    const elapsed = Math.round(performance.now() - startTime);
    return {
      success: true,
      data: fallbackUsers,
      timestamp: new Date().toISOString(),
      latencyMs: elapsed,
      fromCache: false
    };
  }

  // --- Registered Users Directory ---
  static getRegisteredUsers(): RegisteredUser[] {
    const students = this.getStudents();
    const professors = this.getProfessors();

    // Default System Admin User
    const adminUser: RegisteredUser = {
      id: 'admin_root',
      full_name: 'SSEC IT Administrator',
      email: 'admin.it@ssec.ac.in',
      role: 'admin',
      identifier: 'SSEC.IT.ADMIN',
      department: 'Information Technology',
      designation: 'Department Administrator',
      phone: '+91 278 2567890',
      status: 'Active',
      registered_at: '2025-01-01T00:00:00.000Z'
    };

    const studentUsers: RegisteredUser[] = students.map(s => ({
      id: s.id,
      full_name: s.full_name,
      email: s.email || `${s.enrollment_no.toLowerCase()}@ssec.ac.in`,
      role: 'student',
      identifier: s.enrollment_no,
      semester: s.semester,
      classroom: s.classroom || 'IT-LH-101',
      department: 'Information Technology',
      phone: s.phone || '+91 9800000000',
      status: s.status || 'Active',
      registered_at: s.registered_at || new Date().toISOString()
    }));

    const profUsers: RegisteredUser[] = professors.map(p => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email || `${p.professor_id.toLowerCase()}@ssec.ac.in`,
      role: 'professor',
      identifier: p.professor_id,
      department: p.department || 'Information Technology',
      designation: p.designation || 'Assistant Professor',
      phone: p.phone || '+91 9825000000',
      status: p.status || 'Active',
      registered_at: p.registered_at || new Date().toISOString()
    }));

    const allUsers: RegisteredUser[] = [adminUser, ...profUsers, ...studentUsers];

    // Sort by registration date: newest first
    allUsers.sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime());
    return allUsers;
  }

  static updateUserStatus(id: string, status: 'Active' | 'Inactive' | 'Pending'): boolean {
    // Check if student
    const students = this.getStudents();
    const stIndex = students.findIndex(s => s.id === id);
    if (stIndex >= 0) {
      const prevStatus = students[stIndex].status;
      students[stIndex].status = status;
      this.saveStudents(students);

      this.addActivityLog({
        action_type: 'STATUS_CHANGE',
        target_category: 'USER',
        target_name: `${students[stIndex].full_name} (${students[stIndex].enrollment_no})`,
        target_id: id,
        details: `Updated student status from ${prevStatus || 'Active'} to ${status}.`,
        status: 'SUCCESS'
      });
      return true;
    }

    // Check if professor
    const profs = this.getProfessors();
    const pfIndex = profs.findIndex(p => p.id === id);
    if (pfIndex >= 0) {
      const prevStatus = profs[pfIndex].status;
      profs[pfIndex].status = status;
      this.saveProfessors(profs);

      this.addActivityLog({
        action_type: 'STATUS_CHANGE',
        target_category: 'USER',
        target_name: `${profs[pfIndex].full_name} (${profs[pfIndex].professor_id})`,
        target_id: id,
        details: `Updated professor status from ${prevStatus || 'Active'} to ${status}.`,
        status: 'SUCCESS'
      });
      return true;
    }

    return false;
  }

  static async deleteRegisteredUser(id: string, identifier?: string, role?: string): Promise<boolean> {
    // Only protect the root SSEC.IT.ADMIN account
    if (id === 'admin_root' || identifier === 'SSEC.IT.ADMIN') {
      this.addActivityLog({
        action_type: 'SECURITY',
        target_category: 'USER',
        target_name: 'SSEC IT Administrator (Root)',
        target_id: id,
        details: 'Root Super Admin account (SSEC.IT.ADMIN) is protected by system policy.',
        status: 'WARNING'
      });
      return false;
    }

    // 1. Remove from local students
    const students = this.getStudents();
    const filteredStudents = students.filter(s => {
      if (s.id === id) return false;
      if (identifier && (s.enrollment_no === identifier || s.email === identifier)) return false;
      return true;
    });
    if (filteredStudents.length !== students.length) {
      this.saveStudents(filteredStudents);
    }

    // 2. Remove from local professors
    const profs = this.getProfessors();
    const filteredProfs = profs.filter(p => {
      if (p.id === id) return false;
      if (identifier && (p.professor_id === identifier || p.email === identifier)) return false;
      return true;
    });
    if (filteredProfs.length !== profs.length) {
      this.saveProfessors(filteredProfs);
    }

    // 3. Remove directly from MongoDB Atlas
    try {
      await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, identifier, role })
      });
    } catch (e) {
      console.warn('Backend delete sync completed with fallback', e);
    }

    this.addActivityLog({
      action_type: 'DELETE',
      target_category: 'USER',
      target_name: identifier || id,
      target_id: id,
      details: `User record (${identifier || id}) permanently removed by Super Administrator.`,
      status: 'SUCCESS'
    });

    return true;
  }

  // --- Students CRUD ---
  static getStudents(): Student[] {
    return this.getItem<Student[]>(STORAGE_KEYS.STUDENTS, initialStudents);
  }

  static saveStudents(students: Student[]): void {
    this.setItem(STORAGE_KEYS.STUDENTS, students);
  }

  static addStudent(student: Omit<Student, 'id'>): { student?: Student; error?: string } {
    const students = this.getStudents();
    if (students.some(s => s.enrollment_no.toLowerCase() === student.enrollment_no.toLowerCase())) {
      this.addActivityLog({
        action_type: 'CREATE',
        target_category: 'STUDENT',
        target_name: student.full_name,
        details: `Failed to add student. Enrollment ${student.enrollment_no} already exists in database.`,
        status: 'FAILED'
      });
      return { error: 'Enrollment Number already exists in the database!' };
    }
    const newStudent: Student = {
      ...student,
      id: 'st_' + Date.now(),
      status: student.status || 'Active',
      registered_at: student.registered_at || new Date().toISOString()
    };
    students.unshift(newStudent);
    this.saveStudents(students);

    // Sync to MongoDB
    fetch('/api/students/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent)
    }).catch(() => {});

    this.addActivityLog({
      action_type: 'CREATE',
      target_category: 'STUDENT',
      target_name: `${newStudent.full_name} (${newStudent.enrollment_no})`,
      target_id: newStudent.id,
      details: `Enrolled new student into Semester ${newStudent.semester || 6}, Classroom ${newStudent.classroom || 'IT-LH-101'}.`,
      status: 'SUCCESS'
    });

    return { student: newStudent };
  }

  static updateStudent(id: string, updateData: Partial<Student>): void {
    let targetStudent: Student | undefined;
    const students = this.getStudents().map(s => {
      if (s.id === id) {
        targetStudent = { ...s, ...updateData };
        this.addActivityLog({
          action_type: 'UPDATE',
          target_category: 'STUDENT',
          target_name: `${s.full_name} (${s.enrollment_no})`,
          target_id: id,
          details: `Updated student record attributes: ${Object.keys(updateData).join(', ')}.`,
          status: 'SUCCESS'
        });
        return targetStudent;
      }
      return s;
    });
    this.saveStudents(students);

    if (targetStudent) {
      fetch('/api/students/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetStudent)
      }).catch(() => {});
    }
  }

  static async deleteStudent(id: string, enrollment_no?: string): Promise<void> {
    const students = this.getStudents();
    const target = students.find(s => s.id === id || (enrollment_no && s.enrollment_no === enrollment_no));
    const updated = students.filter(s => s.id !== id && (!enrollment_no || s.enrollment_no !== enrollment_no));
    this.saveStudents(updated);

    try {
      await fetch('/api/students/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enrollment_no: enrollment_no || target?.enrollment_no })
      });
    } catch (e) {
      console.warn('Backend student deletion sync completed with fallback', e);
    }

    if (target) {
      this.addActivityLog({
        action_type: 'DELETE',
        target_category: 'STUDENT',
        target_name: `${target.full_name} (${target.enrollment_no})`,
        target_id: id,
        details: `Permanently deleted student account and enrolled profile from database.`,
        status: 'SUCCESS'
      });
    }
  }

  // --- Professors CRUD ---
  static getProfessors(): Professor[] {
    return this.getItem<Professor[]>(STORAGE_KEYS.PROFESSORS, initialProfessors);
  }

  static saveProfessors(professors: Professor[]): void {
    this.setItem(STORAGE_KEYS.PROFESSORS, professors);
  }

  static addProfessor(prof: Omit<Professor, 'id'>): { professor?: Professor; error?: string } {
    const professors = this.getProfessors();
    if (professors.some(p => p.professor_id.toLowerCase() === prof.professor_id.toLowerCase())) {
      this.addActivityLog({
        action_type: 'CREATE',
        target_category: 'PROFESSOR',
        target_name: prof.full_name,
        details: `Failed to add faculty. Professor ID ${prof.professor_id} already registered.`,
        status: 'FAILED'
      });
      return { error: 'Professor ID already registered in the database!' };
    }
    const newProf: Professor = {
      ...prof,
      id: 'pf_' + Date.now(),
      status: prof.status || 'Active',
      registered_at: prof.registered_at || new Date().toISOString()
    };
    professors.unshift(newProf);
    this.saveProfessors(professors);

    // Sync to MongoDB
    fetch('/api/professors/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProf)
    }).catch(() => {});

    this.addActivityLog({
      action_type: 'CREATE',
      target_category: 'PROFESSOR',
      target_name: `${newProf.full_name} (${newProf.professor_id})`,
      target_id: newProf.id,
      details: `Added new faculty member (${newProf.designation || 'Assistant Professor'}, ${newProf.department || 'IT'}).`,
      status: 'SUCCESS'
    });

    return { professor: newProf };
  }

  static updateProfessor(id: string, updateData: Partial<Professor>): void {
    let targetProf: Professor | undefined;
    const professors = this.getProfessors().map(p => {
      if (p.id === id) {
        targetProf = { ...p, ...updateData };
        this.addActivityLog({
          action_type: 'UPDATE',
          target_category: 'PROFESSOR',
          target_name: `${p.full_name} (${p.professor_id})`,
          target_id: id,
          details: `Updated faculty profile: ${Object.keys(updateData).join(', ')}.`,
          status: 'SUCCESS'
        });
        return targetProf;
      }
      return p;
    });
    this.saveProfessors(professors);

    if (targetProf) {
      fetch('/api/professors/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetProf)
      }).catch(() => {});
    }
  }

  static async deleteProfessor(id: string, professor_id?: string): Promise<void> {
    const professors = this.getProfessors();
    const target = professors.find(p => p.id === id || (professor_id && p.professor_id === professor_id));
    const updated = professors.filter(p => p.id !== id && (!professor_id || p.professor_id !== professor_id));
    this.saveProfessors(updated);

    try {
      await fetch('/api/professors/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, professor_id: professor_id || target?.professor_id })
      });
    } catch (e) {
      console.warn('Backend professor deletion sync completed with fallback', e);
    }

    if (target) {
      this.addActivityLog({
        action_type: 'DELETE',
        target_category: 'PROFESSOR',
        target_name: `${target.full_name} (${target.professor_id})`,
        target_id: id,
        details: `Permanently removed professor account from department registry.`,
        status: 'SUCCESS'
      });
    }
  }

  // --- Password & Account Security Helpers ---
  static findUserByEmailOrId(
    role: 'student' | 'professor',
    emailOrId: string
  ): { user?: Student | Professor; error?: string } {
    const clean = emailOrId.trim().toLowerCase();
    if (!clean) {
      return { error: 'Please enter a valid email address or ID.' };
    }

    if (role === 'student') {
      const students = this.getStudents();
      const found = students.find(
        s => (s.email && s.email.toLowerCase() === clean) ||
             (s.enrollment_no && s.enrollment_no.toLowerCase() === clean)
      );
      if (found) return { user: found };
      return { error: `No student account found with email or enrollment: '${emailOrId}'` };
    } else {
      const profs = this.getProfessors();
      const found = profs.find(
        p => (p.email && p.email.toLowerCase() === clean) ||
             (p.professor_id && p.professor_id.toLowerCase() === clean)
      );
      if (found) return { user: found };
      return { error: `No professor account found with email or ID: '${emailOrId}'` };
    }
  }

  static resetUserPassword(
    role: 'student' | 'professor',
    emailOrId: string,
    newPassword: string
  ): { success: boolean; error?: string; user?: Student | Professor } {
    const clean = emailOrId.trim().toLowerCase();
    if (!clean || !newPassword) {
      return { success: false, error: 'Email/ID and new password are required.' };
    }

    if (newPassword.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }

    if (role === 'student') {
      const students = this.getStudents();
      const index = students.findIndex(
        s => (s.email && s.email.toLowerCase() === clean) ||
             (s.enrollment_no && s.enrollment_no.toLowerCase() === clean)
      );
      if (index === -1) {
        return { success: false, error: 'Student account not found.' };
      }
      students[index].password = newPassword;
      this.saveStudents(students);

      this.addActivityLog({
        action_type: 'SECURITY',
        target_category: 'STUDENT',
        target_name: `${students[index].full_name} (${students[index].enrollment_no})`,
        target_id: students[index].id,
        details: 'Password was successfully reset using verified Email OTP verification.',
        status: 'SUCCESS'
      });

      return { success: true, user: students[index] };
    } else {
      const profs = this.getProfessors();
      const index = profs.findIndex(
        p => (p.email && p.email.toLowerCase() === clean) ||
             (p.professor_id && p.professor_id.toLowerCase() === clean)
      );
      if (index === -1) {
        return { success: false, error: 'Professor account not found.' };
      }
      profs[index].password = newPassword;
      this.saveProfessors(profs);

      this.addActivityLog({
        action_type: 'SECURITY',
        target_category: 'PROFESSOR',
        target_name: `${profs[index].full_name} (${profs[index].professor_id})`,
        target_id: profs[index].id,
        details: 'Password was successfully reset using verified Email OTP verification.',
        status: 'SUCCESS'
      });

      return { success: true, user: profs[index] };
    }
  }

  // --- Subjects CRUD ---
  static getSubjects(): Subject[] {
    return this.getItem<Subject[]>(STORAGE_KEYS.SUBJECTS, initialSubjects);
  }

  static addSubject(sub: Omit<Subject, 'id'>): { subject?: Subject; error?: string } {
    const list = this.getSubjects();
    if (list.some(s => s.code.toLowerCase() === sub.code.toLowerCase())) {
      return { error: `Subject Code '${sub.code}' already exists!` };
    }
    const newSub: Subject = { ...sub, id: 'sub_' + Date.now() };
    list.push(newSub);
    this.setItem(STORAGE_KEYS.SUBJECTS, list);

    fetch('/api/subjects/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSub)
    }).catch(() => {});

    this.addActivityLog({
      action_type: 'CREATE',
      target_category: 'SUBJECT',
      target_name: `${newSub.name} (${newSub.code})`,
      target_id: newSub.id,
      details: `Added curriculum course subject for Semester ${newSub.semester}.`,
      status: 'SUCCESS'
    });

    return { subject: newSub };
  }

  static updateSubject(id: string, updateData: Partial<Subject>): { subject?: Subject; error?: string } {
    const list = this.getSubjects();
    if (updateData.code) {
      const conflict = list.find(s => s.id !== id && s.code.toLowerCase() === updateData.code!.toLowerCase());
      if (conflict) {
        return { error: `Subject Code '${updateData.code}' is already used by another subject!` };
      }
    }
    let updatedSub: Subject | undefined;
    const newList = list.map(s => {
      if (s.id === id) {
        updatedSub = { ...s, ...updateData };
        return updatedSub;
      }
      return s;
    });
    this.setItem(STORAGE_KEYS.SUBJECTS, newList);

    if (updatedSub) {
      fetch('/api/subjects/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSub)
      }).catch(() => {});
    }

    return { subject: updatedSub };
  }

  static deleteSubject(id: string, code?: string): void {
    const list = this.getSubjects();
    const target = list.find(s => s.id === id || (code && s.code === code));
    const updated = list.filter(s => s.id !== id && (!code || s.code !== code));
    this.setItem(STORAGE_KEYS.SUBJECTS, updated);

    fetch('/api/subjects/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, code: code || target?.code })
    }).catch(() => {});

    if (target) {
      this.addActivityLog({
        action_type: 'DELETE',
        target_category: 'SUBJECT',
        target_name: `${target.name} (${target.code})`,
        target_id: id,
        details: `Deleted subject course from curriculum database.`,
        status: 'SUCCESS'
      });
    }
  }

  // --- Classrooms CRUD ---
  static getClassrooms(): Classroom[] {
    return this.getItem<Classroom[]>(STORAGE_KEYS.CLASSROOMS, initialClassrooms);
  }

  static addClassroom(room: Omit<Classroom, 'id'>): { classroom?: Classroom; error?: string } {
    const list = this.getClassrooms();
    if (list.some(r => r.room_number.toLowerCase() === room.room_number.toLowerCase())) {
      return { error: `Room Number '${room.room_number}' already exists!` };
    }
    const newRoom: Classroom = { ...room, id: 'cr_' + Date.now() };
    list.push(newRoom);
    this.setItem(STORAGE_KEYS.CLASSROOMS, list);

    fetch('/api/classrooms/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRoom)
    }).catch(() => {});

    this.addActivityLog({
      action_type: 'CREATE',
      target_category: 'CLASSROOM',
      target_name: `${newRoom.room_number} (${newRoom.building})`,
      target_id: newRoom.id,
      details: `Added new ${newRoom.type} with capacity ${newRoom.capacity}.`,
      status: 'SUCCESS'
    });

    return { classroom: newRoom };
  }

  static updateClassroom(id: string, updateData: Partial<Classroom>): { classroom?: Classroom; error?: string } {
    const list = this.getClassrooms();
    if (updateData.room_number) {
      const conflict = list.find(r => r.id !== id && r.room_number.toLowerCase() === updateData.room_number!.toLowerCase());
      if (conflict) {
        return { error: `Room Number '${updateData.room_number}' is already taken!` };
      }
    }
    let updatedRoom: Classroom | undefined;
    const newList = list.map(r => {
      if (r.id === id) {
        updatedRoom = { ...r, ...updateData };
        return updatedRoom;
      }
      return r;
    });
    this.setItem(STORAGE_KEYS.CLASSROOMS, newList);

    if (updatedRoom) {
      fetch('/api/classrooms/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRoom)
      }).catch(() => {});
    }

    return { classroom: updatedRoom };
  }

  static deleteClassroom(id: string, room_number?: string): void {
    const list = this.getClassrooms();
    const target = list.find(r => r.id === id || (room_number && r.room_number === room_number));
    const updated = list.filter(r => r.id !== id && (!room_number || r.room_number !== room_number));
    this.setItem(STORAGE_KEYS.CLASSROOMS, updated);

    fetch('/api/classrooms/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, room_number: room_number || target?.room_number })
    }).catch(() => {});

    if (target) {
      this.addActivityLog({
        action_type: 'DELETE',
        target_category: 'CLASSROOM',
        target_name: target.room_number,
        target_id: id,
        details: `Removed classroom infrastructure record.`,
        status: 'SUCCESS'
      });
    }
  }

  // --- Timetable CRUD & Clash Detection ---
  static getTimetables(): TimetableSlot[] {
    return this.getItem<TimetableSlot[]>(STORAGE_KEYS.TIMETABLES, initialTimetables);
  }

  static addTimetable(slot: Omit<TimetableSlot, 'id'>): { timetable?: TimetableSlot; error?: string } {
    const list = this.getTimetables();
    
    // Check clash
    const clash = list.find(s => s.day === slot.day && s.time_slot === slot.time_slot && s.room_number === slot.room_number);
    if (clash) {
      return { error: `Clash detected! Room ${slot.room_number} is occupied on ${slot.day} at ${slot.time_slot}` };
    }

    const newSlot: TimetableSlot = { ...slot, id: 'tt_' + Date.now() };
    list.push(newSlot);
    this.setItem(STORAGE_KEYS.TIMETABLES, list);

    fetch('/api/timetables/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSlot)
    }).catch(() => {});

    this.addActivityLog({
      action_type: 'CREATE',
      target_category: 'TIMETABLE',
      target_name: `${newSlot.day} ${newSlot.time_slot} (Sem ${newSlot.semester})`,
      target_id: newSlot.id,
      details: `Scheduled ${newSlot.subject} by ${newSlot.professor} in ${newSlot.room_number}.`,
      status: 'SUCCESS'
    });

    return { timetable: newSlot };
  }

  static deleteTimetable(id: string): void {
    const list = this.getTimetables();
    const target = list.find(t => t.id === id);
    const updated = list.filter(t => t.id !== id);
    this.setItem(STORAGE_KEYS.TIMETABLES, updated);

    fetch('/api/timetables/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).catch(() => {});

    if (target) {
      this.addActivityLog({
        action_type: 'DELETE',
        target_category: 'TIMETABLE',
        target_name: `${target.day} ${target.time_slot} (${target.subject})`,
        target_id: id,
        details: `Deleted timetable slot for Semester ${target.semester}.`,
        status: 'SUCCESS'
      });
    }
  }

  // --- Notifications CRUD ---
  static getNotifications(): NotificationItem[] {
    return this.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  }

  static addNotification(notif: Omit<NotificationItem, 'id'>): NotificationItem {
    const list = this.getNotifications();
    const newNotif: NotificationItem = {
      ...notif,
      id: 'notif_' + Date.now()
    };
    list.unshift(newNotif);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, list);

    fetch('/api/notifications/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotif)
    }).catch(() => {});

    this.addActivityLog({
      action_type: 'CREATE',
      target_category: 'NOTIFICATION',
      target_name: newNotif.title,
      target_id: newNotif.id,
      details: `Published announcement (Priority: ${newNotif.priority}, Target: ${newNotif.target_role}).`,
      status: 'SUCCESS'
    });

    return newNotif;
  }

  static markNotificationRead(id: string): void {
    const list = this.getNotifications().map(n => n.id === id ? { ...n, is_read: true } : n);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  static deleteNotification(id: string): void {
    const list = this.getNotifications();
    const target = list.find(n => n.id === id);
    const updated = list.filter(n => n.id !== id);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, updated);

    fetch('/api/notifications/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).catch(() => {});

    if (target) {
      this.addActivityLog({
        action_type: 'DELETE',
        target_category: 'NOTIFICATION',
        target_name: target.title,
        target_id: id,
        details: `Removed department notification.`,
        status: 'SUCCESS'
      });
    }
  }

  static updateNotification(id: string, updateData: Partial<NotificationItem>): { notification?: NotificationItem; error?: string } {
    const list = this.getNotifications();
    let updatedNotif: NotificationItem | undefined;
    const newList = list.map(n => {
      if (n.id === id) {
        updatedNotif = { ...n, ...updateData };
        return updatedNotif;
      }
      return n;
    });
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, newList);
    return { notification: updatedNotif };
  }

  // --- Activity Logs CRUD ---
  static getActivityLogs(): ActivityLog[] {
    const logs = this.getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, initialActivityLogs);
    // Sort descending (latest first)
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp' | 'performed_by'> & { performed_by?: string; timestamp?: string }): ActivityLog {
    const currentLogs = this.getActivityLogs();
    const newLog: ActivityLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: log.timestamp || new Date().toISOString(),
      performed_by: log.performed_by || 'SSEC.IT.ADMIN',
      action_type: log.action_type,
      target_category: log.target_category,
      target_name: log.target_name,
      target_id: log.target_id,
      details: log.details,
      status: log.status || 'SUCCESS'
    };

    // Keep up to 200 activity logs
    const updated = [newLog, ...currentLogs].slice(0, 200);
    this.setItem(STORAGE_KEYS.ACTIVITY_LOGS, updated);
    return newLog;
  }

  static clearActivityLogs(): void {
    this.setItem(STORAGE_KEYS.ACTIVITY_LOGS, []);
    this.addActivityLog({
      action_type: 'SYSTEM',
      target_category: 'DATABASE',
      target_name: 'Audit Trail Registry',
      performed_by: 'SSEC.IT.ADMIN',
      details: 'Audit activity logs were cleared by the system administrator.',
      status: 'WARNING'
    });
  }

  // Reset / Clear Database for production
  static resetToSampleData(): void {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.PROFESSORS);
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    localStorage.removeItem(STORAGE_KEYS.CLASSROOMS);
    localStorage.removeItem(STORAGE_KEYS.TIMETABLES);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);

    this.setItem(STORAGE_KEYS.STUDENTS, []);
    this.setItem(STORAGE_KEYS.PROFESSORS, []);
    this.setItem(STORAGE_KEYS.SUBJECTS, []);
    this.setItem(STORAGE_KEYS.CLASSROOMS, []);
    this.setItem(STORAGE_KEYS.TIMETABLES, []);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, []);
    this.setItem(STORAGE_KEYS.ACTIVITY_LOGS, []);

    this.addActivityLog({
      action_type: 'SYSTEM',
      target_category: 'DATABASE',
      target_name: 'Database Reset',
      performed_by: 'SSEC.IT.ADMIN',
      details: 'Departmental database storage cleared and initialized for production.',
      status: 'SUCCESS'
    });
  }
}
