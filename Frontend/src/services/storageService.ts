import { Student, Professor, Subject, Classroom, TimetableSlot, NotificationItem, AuthUser, MongoAtlasConfig } from '../types';
import { initialStudents, initialProfessors, initialSubjects, initialClassrooms, initialTimetables, initialNotifications } from '../data/initialData';

const STORAGE_KEYS = {
  STUDENTS: 'ssec_students_v1',
  PROFESSORS: 'ssec_professors_v1',
  SUBJECTS: 'ssec_subjects_v1',
  CLASSROOMS: 'ssec_classrooms_v1',
  TIMETABLES: 'ssec_timetables_v1',
  NOTIFICATIONS: 'ssec_notifications_v1',
  AUTH: 'ssec_auth_session_v1',
  MONGO_CONFIG: 'ssec_mongo_config_v1'
};

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
      mongo_uri: 'mongodb+srv://admin:SSECIT2026@cluster0.yh7oncz.mongodb.net/?appName=Cluster0',
      db_name: 'ssec_timetable_db',
      is_connected: true,
      cluster_name: 'SSEC-IT-Cluster0'
    });
  }

  static setMongoConfig(config: MongoAtlasConfig): void {
    this.setItem(STORAGE_KEYS.MONGO_CONFIG, config);
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
    if (students.some(s => s.enrollment_no === student.enrollment_no)) {
      return { error: 'Enrollment Number already exists!' };
    }
    const newStudent: Student = {
      ...student,
      id: 'st_' + Date.now()
    };
    students.push(newStudent);
    this.saveStudents(students);
    return { student: newStudent };
  }

  static updateStudent(id: string, updateData: Partial<Student>): void {
    const students = this.getStudents().map(s => s.id === id ? { ...s, ...updateData } : s);
    this.saveStudents(students);
  }

  static deleteStudent(id: string): void {
    const students = this.getStudents().filter(s => s.id !== id);
    this.saveStudents(students);
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
    if (professors.some(p => p.professor_id === prof.professor_id)) {
      return { error: 'Professor ID already registered!' };
    }
    const newProf: Professor = {
      ...prof,
      id: 'pf_' + Date.now()
    };
    professors.push(newProf);
    this.saveProfessors(professors);
    return { professor: newProf };
  }

  static updateProfessor(id: string, updateData: Partial<Professor>): void {
    const professors = this.getProfessors().map(p => p.id === id ? { ...p, ...updateData } : p);
    this.saveProfessors(professors);
  }

  static deleteProfessor(id: string): void {
    const professors = this.getProfessors().filter(p => p.id !== id);
    this.saveProfessors(professors);
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
    return { subject: updatedSub };
  }

  static deleteSubject(id: string): void {
    const list = this.getSubjects().filter(s => s.id !== id);
    this.setItem(STORAGE_KEYS.SUBJECTS, list);
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
    return { classroom: updatedRoom };
  }

  static deleteClassroom(id: string): void {
    const list = this.getClassrooms().filter(r => r.id !== id);
    this.setItem(STORAGE_KEYS.CLASSROOMS, list);
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
    return { timetable: newSlot };
  }

  static deleteTimetable(id: string): void {
    const list = this.getTimetables().filter(t => t.id !== id);
    this.setItem(STORAGE_KEYS.TIMETABLES, list);
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
    return newNotif;
  }

  static markNotificationRead(id: string): void {
    const list = this.getNotifications().map(n => n.id === id ? { ...n, is_read: true } : n);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  static deleteNotification(id: string): void {
    const list = this.getNotifications().filter(n => n.id !== id);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
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

  // Reset to sample data
  static resetToSampleData(): void {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.PROFESSORS);
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    localStorage.removeItem(STORAGE_KEYS.CLASSROOMS);
    localStorage.removeItem(STORAGE_KEYS.TIMETABLES);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  }
}
