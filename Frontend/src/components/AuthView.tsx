import React, { useState } from 'react';
import { UserRole, AuthUser } from '../types';
import { StorageService } from '../services/storageService';
import { GraduationCap, UserCheck, ShieldCheck, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthViewProps {
  onLoginSuccess: (user: AuthUser) => void;
  onOpenCodeViewer?: () => void;
  onOpenMongoConfig?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLoginSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('student');

  // Form states
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState(''); // Enrollment No / Prof ID / Admin Username
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [semester, setSemester] = useState(6);
  const [classroom, setClassroom] = useState('IT-LH-101');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setMessage(null);
    setIdentifier('');
    setPassword('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      setMessage({ text: 'Please enter both ID/Username and Password.', type: 'danger' });
      return;
    }

    if (role === 'admin') {
      // Admin creds check
      if (cleanIdentifier === 'SSEC.IT.ADMIN' && password === 'Admin@ssecit') {
        const user: AuthUser = {
          role: 'admin',
          id: 'admin_root',
          name: 'SSEC IT Administrator',
          identifier: 'SSEC.IT.ADMIN',
          department: 'Information Technology'
        };
        StorageService.setAuth(user);
        onLoginSuccess(user);
      } else {
        setMessage({ text: 'Invalid Admin Username or Password!', type: 'danger' });
      }
    } else if (role === 'student') {
      const students = StorageService.getStudents();
      const st = students.find(s => s.enrollment_no.toLowerCase() === cleanIdentifier.toLowerCase());
      if (st) {
        const user: AuthUser = {
          role: 'student',
          id: st.id,
          name: st.full_name,
          identifier: st.enrollment_no,
          semester: st.semester,
          classroom: st.classroom
        };
        StorageService.setAuth(user);
        onLoginSuccess(user);
      } else {
        setMessage({ text: 'Invalid Enrollment Number or Password! Please register if you do not have an account.', type: 'danger' });
      }
    } else if (role === 'professor') {
      const profs = StorageService.getProfessors();
      const pf = profs.find(p => p.professor_id.toLowerCase() === cleanIdentifier.toLowerCase());
      if (pf) {
        const user: AuthUser = {
          role: 'professor',
          id: pf.id,
          name: pf.full_name,
          identifier: pf.professor_id,
          department: pf.department
        };
        StorageService.setAuth(user);
        onLoginSuccess(user);
      } else {
        setMessage({ text: 'Invalid Professor ID or Password! Please register if you do not have an account.', type: 'danger' });
      }
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!fullName.trim() || !identifier.trim() || !password) {
      setMessage({ text: 'Please fill in all required fields.', type: 'danger' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match!', type: 'danger' });
      return;
    }

    if (role === 'student') {
      const res = StorageService.addStudent({
        full_name: fullName,
        enrollment_no: identifier,
        semester,
        classroom,
        email: `${identifier.toLowerCase()}@ssec.ac.in`,
        phone: '+91 9800000000'
      });
      if (res.error) {
        setMessage({ text: res.error, type: 'danger' });
      } else {
        setMessage({ text: 'Student registration successful! Please switch to Login tab to enter.', type: 'success' });
        setActiveTab('login');
      }
    } else if (role === 'professor') {
      const res = StorageService.addProfessor({
        full_name: fullName,
        professor_id: identifier,
        department: 'Information Technology',
        designation: 'Assistant Professor',
        email: `${identifier.toLowerCase()}@ssec.ac.in`,
        phone: '+91 9800000000'
      });
      if (res.error) {
        setMessage({ text: res.error, type: 'danger' });
      } else {
        setMessage({ text: 'Professor registration successful! Please switch to Login tab to enter.', type: 'success' });
        setActiveTab('login');
      }
    }
  };

  return (
    <div className="min-h-[85vh] bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Top Banner Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-2xl shadow-lg shadow-sky-500/25">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            SSEC <span className="text-sky-600 font-extrabold">IT Department</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Smart Timetable Portal Access
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6">

          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="tab-login"
              onClick={() => { setActiveTab('login'); setMessage(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'login' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-register"
              onClick={() => { setActiveTab('register'); setMessage(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'register' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register Account
            </button>
          </div>

          {/* Flash Message Banner */}
          {message && (
            <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
              message.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Role Selector Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">
              Select Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="role-student-btn"
                onClick={() => handleRoleChange('student')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                  role === 'student'
                    ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-700'
                }`}
              >
                <GraduationCap className={`w-5 h-5 ${role === 'student' ? 'text-sky-600' : 'text-slate-400'}`} />
                <span className="text-xs font-semibold">Student</span>
              </button>

              <button
                type="button"
                id="role-professor-btn"
                onClick={() => handleRoleChange('professor')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                  role === 'professor'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                <UserCheck className={`w-5 h-5 ${role === 'professor' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs font-semibold">Professor</span>
              </button>

              <button
                type="button"
                id="role-admin-btn"
                onClick={() => {
                  if (activeTab === 'register') setActiveTab('login');
                  handleRoleChange('admin');
                }}
                className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                  role === 'admin'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-700'
                }`}
              >
                <ShieldCheck className={`w-5 h-5 ${role === 'admin' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className="text-xs font-semibold">Admin</span>
              </button>
            </div>
            {role === 'admin' && activeTab === 'register' && (
              <p className="text-xs text-amber-600 text-center font-medium mt-1">
                Note: Admin registration is restricted. Please sign in with your admin credentials.
              </p>
            )}
          </div>

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {role === 'student' && 'Enrollment Number'}
                  {role === 'professor' && 'Professor ID'}
                  {role === 'admin' && 'Admin Username'}
                </label>
                <input
                  type="text"
                  required
                  id="input-identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    role === 'student' ? 'e.g. 200010116001' :
                    role === 'professor' ? 'e.g. PROF_IT_01' : 'SSEC.IT.ADMIN'
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-mono transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  id="input-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-mono transition-all"
                />
              </div>

              <button
                type="submit"
                id="btn-submit-login"
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center space-x-2 mt-2"
              >
                <span>Sign In as {role.charAt(0).toUpperCase() + role.slice(1)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && role !== 'admin' && (
            <form onSubmit={handleRegister} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  id="reg-fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {role === 'student' ? 'Enrollment Number' : 'Professor ID'}
                </label>
                <input
                  type="text"
                  required
                  id="reg-identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={role === 'student' ? 'e.g. 200010116005' : 'e.g. PROF_IT_04'}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-mono transition-all"
                />
              </div>

              {role === 'student' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Semester</label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 transition-all"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Classroom</label>
                    <input
                      type="text"
                      value={classroom}
                      onChange={(e) => setClassroom(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 font-mono transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  id="reg-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 font-mono transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  id="reg-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 font-mono transition-all"
                />
              </div>

              <button
                type="submit"
                id="btn-submit-register"
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center space-x-2 mt-3"
              >
                <span>Register {role.charAt(0).toUpperCase() + role.slice(1)}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>
      </div>

    </div>
  );
};
