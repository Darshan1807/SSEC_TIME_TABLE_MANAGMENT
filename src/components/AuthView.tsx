/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AuthUser, Student, Professor } from '../types';
import { StorageService } from '../services/storageService';
import { OtpService } from '../services/otpService';
import { 
  GraduationCap, 
  UserCheck, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  KeyRound, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Send,
  Clock,
  RefreshCw
} from 'lucide-react';

interface AuthViewProps {
  onLoginSuccess: (user: AuthUser) => void;
  initialMode?: 'login' | 'register' | 'verify_otp' | 'forgot_password' | 'reset_password';
}

export type AuthMode = 'login' | 'register' | 'verify_otp' | 'forgot_password' | 'reset_password';

export const AuthView: React.FC<AuthViewProps> = ({
  onLoginSuccess,
  initialMode = 'login'
}) => {
  const [activeTab, setActiveTab] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<'student' | 'professor'>('student');

  // Sign In inputs
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration Form states
  const [fullName, setFullName] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [semester, setSemester] = useState(6);
  const [classroom, setClassroom] = useState('IT-LH-101');
  const [department, setDepartment] = useState('Information Technology');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP Verification States
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState<number>(300); // 5 mins
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [otpPurpose, setOtpPurpose] = useState<'REGISTRATION' | 'PASSWORD_RESET'>('REGISTRATION');
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Forgot / Reset Password states
  const [forgotInput, setForgotInput] = useState('');
  const [resetAccount, setResetAccount] = useState<{
    name: string;
    email: string;
    identifier: string;
    role: 'student' | 'professor';
  } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Notification and Status
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' | 'info' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Expiry Countdown Timer (5 minutes)
  useEffect(() => {
    if (activeTab !== 'verify_otp' && activeTab !== 'reset_password') return;
    const timer = setInterval(() => {
      setOtpExpirySeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTab]);

  // Restore any active OTP verification session on mount (survives page refresh)
  useEffect(() => {
    const active = OtpService.getActiveSession();
    if (active && Date.now() < active.expiresAt) {
      const remainingSecs = Math.max(1, Math.round((active.expiresAt - Date.now()) / 1000));
      setOtpExpirySeconds(remainingSecs);

      if (active.purpose === 'REGISTRATION') {
        setOtpPurpose('REGISTRATION');
        if (active.email) setEmail(active.email);
        if (active.role) setRole(active.role);
        if (active.recipientName) setFullName(active.recipientName);
        if (active.identifier) setRegIdentifier(active.identifier);

        try {
          const stored = sessionStorage.getItem('ssec_pending_reg');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.fullName) setFullName(parsed.fullName);
            if (parsed.regIdentifier) setRegIdentifier(parsed.regIdentifier);
            if (parsed.email) setEmail(parsed.email);
            if (parsed.phone) setPhone(parsed.phone);
            if (parsed.semester) setSemester(parsed.semester);
            if (parsed.classroom) setClassroom(parsed.classroom);
            if (parsed.department) setDepartment(parsed.department);
            if (parsed.designation) setDesignation(parsed.designation);
            if (parsed.regPassword) {
              setRegPassword(parsed.regPassword);
              setConfirmPassword(parsed.regPassword);
            }
            if (parsed.role) setRole(parsed.role);
          }
        } catch {}
      } else if (active.purpose === 'PASSWORD_RESET') {
        setOtpPurpose('PASSWORD_RESET');
        setResetAccount({
          name: active.recipientName || 'User',
          email: active.email,
          identifier: active.identifier || '',
          role: active.role || 'student'
        });
      }
    }
  }, []);

  // 2. Resend Cooldown Timer (60 seconds)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTabSwitch = (tab: AuthMode) => {
    setActiveTab(tab);
    setMessage(null);
  };

  const handleRoleChange = (newRole: 'student' | 'professor') => {
    setRole(newRole);
    setMessage(null);
    setIdentifier('');
    setPassword('');
  };

  const handleRegIdentifierChange = (val: string) => {
    setRegIdentifier(val);
    if (!email || email.endsWith('@ssec.ac.in')) {
      const clean = val.trim().toLowerCase();
      if (clean) {
        setEmail(`${clean}@ssec.ac.in`);
      }
    }
  };

  // Handle OTP 6-Digit input changes
  const handleOtpDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    if (cleanVal.length > 0) {
      newDigits[index] = cleanVal[cleanVal.length - 1];
      setOtpDigits(newDigits);
      if (index < 5 && otpInputRefs.current[index + 1]) {
        otpInputRefs.current[index + 1]?.focus();
      }
    } else {
      newDigits[index] = '';
      setOtpDigits(newDigits);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    const newDigits = [...otpDigits];
    paste.split('').forEach((char, idx) => {
      if (idx < 6) newDigits[idx] = char;
    });
    setOtpDigits(newDigits);
    const focusIdx = Math.min(paste.length, 5);
    otpInputRefs.current[focusIdx]?.focus();
  };

  // ==========================================
  // 1. SIGN IN HANDLER
  // ==========================================
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      setMessage({ text: 'Please enter both ID/Email and Password.', type: 'danger' });
      return;
    }

    if (role === 'student') {
      const students = StorageService.getStudents();
      const st = students.find(
        s => (s.enrollment_no && s.enrollment_no.toLowerCase() === cleanIdentifier.toLowerCase()) ||
             (s.email && s.email.toLowerCase() === cleanIdentifier.toLowerCase())
      );

      if (st) {
        if (st.password && st.password !== password) {
          setMessage({ text: 'Incorrect password for this student account! You can click "Forgot Password?" below.', type: 'danger' });
          return;
        }

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
        setMessage({ 
          text: 'Student account not found! Please check your enrollment number/email or register an account.', 
          type: 'danger' 
        });
      }
    } else if (role === 'professor') {
      const profs = StorageService.getProfessors();
      const pf = profs.find(
        p => (p.professor_id && p.professor_id.toLowerCase() === cleanIdentifier.toLowerCase()) ||
             (p.email && p.email.toLowerCase() === cleanIdentifier.toLowerCase())
      );

      if (pf) {
        if (pf.password && pf.password !== password) {
          setMessage({ text: 'Incorrect password for this faculty account! You can click "Forgot Password?" below.', type: 'danger' });
          return;
        }

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
        setMessage({ 
          text: 'Professor account not found! Please check your Professor ID/email or register an account.', 
          type: 'danger' 
        });
      }
    }
  };

  // ==========================================
  // 2. REGISTRATION OTP REQUEST
  // ==========================================
  const handleRequestRegisterOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const cleanFullName = fullName.trim();
    const cleanId = regIdentifier.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanFullName || !cleanId || !cleanEmail || !regPassword) {
      setMessage({ text: 'Please fill in all required registration fields.', type: 'danger' });
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setMessage({ text: 'Please enter a valid email address.', type: 'danger' });
      return;
    }

    if (regPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match! Please verify your password.', type: 'danger' });
      return;
    }

    if (regPassword.length < 4) {
      setMessage({ text: 'Password must be at least 4 characters long.', type: 'danger' });
      return;
    }

    // Check duplicate
    if (role === 'student') {
      const students = StorageService.getStudents();
      if (students.some(s => s.enrollment_no.toLowerCase() === cleanId.toLowerCase())) {
        setMessage({ text: `Student with enrollment '${cleanId}' is already registered. Please sign in.`, type: 'danger' });
        return;
      }
      if (students.some(s => s.email && s.email.toLowerCase() === cleanEmail)) {
        setMessage({ text: `A student account with email '${cleanEmail}' already exists.`, type: 'danger' });
        return;
      }
    } else {
      const profs = StorageService.getProfessors();
      if (profs.some(p => p.professor_id.toLowerCase() === cleanId.toLowerCase())) {
        setMessage({ text: `Faculty member with ID '${cleanId}' is already registered. Please sign in.`, type: 'danger' });
        return;
      }
      if (profs.some(p => p.email && p.email.toLowerCase() === cleanEmail)) {
        setMessage({ text: `A faculty account with email '${cleanEmail}' already exists.`, type: 'danger' });
        return;
      }
    }

    // Generate & Dispatch OTP via real Gmail SMTP
    setIsSubmitting(true);
    OtpService.requestOtp({
      email: cleanEmail,
      role,
      purpose: 'REGISTRATION',
      recipientName: cleanFullName,
      identifier: cleanId
    }).then((res) => {
      setIsSubmitting(false);
      if (!res.success) {
        setMessage({ text: res.error || 'Unable to send verification email. Please try again later.', type: 'danger' });
        return;
      }

      // Persist pending registration data across reloads
      try {
        sessionStorage.setItem('ssec_pending_reg', JSON.stringify({
          fullName: cleanFullName,
          regIdentifier: cleanId,
          email: cleanEmail,
          phone: phone.trim(),
          semester,
          classroom,
          department,
          designation,
          regPassword,
          role
        }));
      } catch {}

      setOtpPurpose('REGISTRATION');
      setOtpDigits(['', '', '', '', '', '']);
      setOtpExpirySeconds(300);
      setResendCooldown(60);
      setMessage({ 
        text: `A 6-digit verification code has been dispatched to your real email inbox (${res.maskedEmail || OtpService.maskEmail(cleanEmail)}). Please check your email.`, 
        type: 'info' 
      });
      handleTabSwitch('verify_otp');
    }).catch(() => {
      setIsSubmitting(false);
      setMessage({ text: 'Unable to send verification email. Please try again later.', type: 'danger' });
    });
  };

  // Verify Registration OTP
  const handleVerifyRegistrationOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setMessage({ text: 'Please enter the full 6-digit verification code.', type: 'danger' });
      return;
    }

    const activeSession = OtpService.getActiveSession();
    let pendingReg: any = null;
    try {
      const stored = sessionStorage.getItem('ssec_pending_reg');
      if (stored) pendingReg = JSON.parse(stored);
    } catch {}

    const cleanEmail = (email || pendingReg?.email || activeSession?.email || '').trim().toLowerCase();

    if (!cleanEmail) {
      setMessage({ text: 'No email address found for verification. Please return to the registration form.', type: 'danger' });
      return;
    }

    setIsSubmitting(true);

    const verification = await OtpService.verifyOtp({
      email: cleanEmail,
      purpose: 'REGISTRATION',
      code: otpCode
    });

    setIsSubmitting(false);

    if (!verification.valid) {
      setMessage({ text: verification.error || 'Invalid OTP code.', type: 'danger' });
      return;
    }

    // Resolve final fields from state or stored pending session
    const effectiveRole = role || pendingReg?.role || activeSession?.role || 'student';
    const effectiveName = fullName.trim() || pendingReg?.fullName || activeSession?.recipientName || 'Student';
    const effectiveId = regIdentifier.trim() || pendingReg?.regIdentifier || activeSession?.identifier || '';
    const effectivePass = regPassword || pendingReg?.regPassword || '';
    const effectivePhone = phone.trim() || pendingReg?.phone || '+91 9800000000';
    const effectiveSem = semester || pendingReg?.semester || 6;
    const effectiveClass = classroom || pendingReg?.classroom || 'IT-LH-101';
    const effectiveDept = department.trim() || pendingReg?.department || 'Information Technology';
    const effectiveDesig = designation.trim() || pendingReg?.designation || 'Assistant Professor';

    // Successful Verification - Save to storage
    if (effectiveRole === 'student') {
      const res = StorageService.addStudent({
        full_name: effectiveName,
        enrollment_no: effectiveId,
        semester: effectiveSem,
        classroom: effectiveClass,
        email: cleanEmail,
        phone: effectivePhone,
        password: effectivePass,
        status: 'Active'
      });

      if (res.error) {
        setMessage({ text: res.error, type: 'danger' });
      } else {
        try {
          sessionStorage.removeItem('ssec_pending_reg');
        } catch {}
        OtpService.clearSession();
        setMessage({ 
          text: `Account created & email verified successfully! Welcome ${effectiveName}. You can now sign in.`, 
          type: 'success' 
        });
        setIdentifier(effectiveId);
        setPassword(effectivePass);
        handleTabSwitch('login');
      }
    } else {
      const res = StorageService.addProfessor({
        full_name: effectiveName,
        professor_id: effectiveId,
        department: effectiveDept,
        designation: effectiveDesig,
        email: cleanEmail,
        phone: effectivePhone,
        password: effectivePass,
        status: 'Active'
      });

      if (res.error) {
        setMessage({ text: res.error, type: 'danger' });
      } else {
        try {
          sessionStorage.removeItem('ssec_pending_reg');
        } catch {}
        OtpService.clearSession();
        setMessage({ 
          text: `Faculty account registered & email verified! Welcome Prof. ${effectiveName}. You can now sign in.`, 
          type: 'success' 
        });
        setIdentifier(effectiveId);
        setPassword(effectivePass);
        handleTabSwitch('login');
      }
    }
  };

  // ==========================================
  // 3. FORGOT PASSWORD & RESET FLOW
  // ==========================================
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const cleanInput = forgotInput.trim();
    if (!cleanInput) {
      setMessage({ text: 'Please enter your registered email address or ID.', type: 'danger' });
      return;
    }

    const lookup = StorageService.findUserByEmailOrId(role, cleanInput);
    if (lookup.error || !lookup.user) {
      setMessage({ text: lookup.error || `No ${role} account found matching "${cleanInput}".`, type: 'danger' });
      return;
    }

    const user = lookup.user;
    const targetEmail = user.email || (
      'enrollment_no' in user
        ? `${(user as Student).enrollment_no.toLowerCase()}@ssec.ac.in`
        : `${(user as Professor).professor_id.toLowerCase()}@ssec.ac.in`
    );
    const identifierVal = 'enrollment_no' in user ? (user as Student).enrollment_no : (user as Professor).professor_id;

    setIsSubmitting(true);
    const res = await OtpService.requestOtp({
      email: targetEmail,
      role,
      purpose: 'PASSWORD_RESET',
      recipientName: user.full_name,
      identifier: identifierVal
    });
    setIsSubmitting(false);

    if (!res.success) {
      setMessage({ text: res.error || 'Unable to send verification email. Please try again later.', type: 'danger' });
      return;
    }

    setResetAccount({
      name: user.full_name,
      email: targetEmail,
      identifier: identifierVal,
      role
    });

    setOtpPurpose('PASSWORD_RESET');
    setOtpDigits(['', '', '', '', '', '']);
    setOtpExpirySeconds(300);
    setResendCooldown(60);
    setMessage({
      text: `Password reset OTP has been sent to your registered email (${res.maskedEmail || OtpService.maskEmail(targetEmail)}). Please check your email inbox.`,
      type: 'info'
    });
    handleTabSwitch('reset_password');
  };

  const handleVerifyResetOtpAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setMessage({ text: 'Please enter the 6-digit reset code sent to your email.', type: 'danger' });
      return;
    }

    if (!newPassword || !confirmNewPassword) {
      setMessage({ text: 'Please enter and confirm your new password.', type: 'danger' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setMessage({ text: 'New passwords do not match!', type: 'danger' });
      return;
    }

    if (newPassword.length < 4) {
      setMessage({ text: 'Password must be at least 4 characters long.', type: 'danger' });
      return;
    }

    const activeSession = OtpService.getActiveSession();
    let account = resetAccount;
    if (!account && activeSession && activeSession.purpose === 'PASSWORD_RESET') {
      account = {
        name: activeSession.recipientName || 'User',
        email: activeSession.email,
        identifier: activeSession.identifier || '',
        role: activeSession.role || 'student'
      };
      setResetAccount(account);
    }

    if (!account) {
      setMessage({ text: 'Session expired. Please restart the password reset process.', type: 'danger' });
      handleTabSwitch('forgot_password');
      return;
    }

    setIsSubmitting(true);

    const verification = await OtpService.verifyOtp({
      email: account.email,
      purpose: 'PASSWORD_RESET',
      code: otpCode
    });

    if (!verification.valid) {
      setIsSubmitting(false);
      setMessage({ text: verification.error || 'Invalid OTP code.', type: 'danger' });
      return;
    }

    const resetRes = StorageService.resetUserPassword(account.role, account.email, newPassword);
    setIsSubmitting(false);

    if (!resetRes.success) {
      setMessage({ text: resetRes.error || 'Failed to update password.', type: 'danger' });
      return;
    }

    OtpService.clearSession();
    setMessage({
      text: `Password updated successfully for ${account.name}! You can now sign in with your new password.`,
      type: 'success'
    });
    setIdentifier(account.identifier || account.email);
    setPassword(newPassword);
    setResetAccount(null);
    handleTabSwitch('login');
  };

  // Mask email for display
  const getMaskedEmail = (rawEmail: string) => {
    if (!rawEmail || !rawEmail.includes('@')) return rawEmail;
    const [u, d] = rawEmail.split('@');
    return u.length <= 2 ? `${u[0]}****@${d}` : `${u[0]}${'*'.repeat(u.length - 1)}@${d}`;
  };

  return (
    <div className="min-h-[85vh] bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      
      {/* Top Banner Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-2xl shadow-md shadow-sky-500/20 border border-sky-400/30">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            SSEC <span className="text-sky-600 font-extrabold">IT Department</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Personalized Timetable & Academic Management Portal
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 space-y-5">

          {/* Active Pending Verification Banner */}
          {(activeTab === 'login' || activeTab === 'register') && OtpService.getActiveSession() && (
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3 flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2 text-sky-900">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Active code pending for <strong>{getMaskedEmail(OtpService.getActiveSession()?.email || '')}</strong></span>
              </div>
              <button
                type="button"
                id="btn-resume-verification"
                onClick={() => handleTabSwitch(OtpService.getActiveSession()?.purpose === 'PASSWORD_RESET' ? 'reset_password' : 'verify_otp')}
                className="font-bold text-sky-700 hover:text-sky-900 underline ml-2 shrink-0"
              >
                Enter Code
              </button>
            </div>
          )}

          {/* Navigation Tabs (Only for Login / Register) */}
          {(activeTab === 'login' || activeTab === 'register') && (
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                id="tab-login"
                type="button"
                onClick={() => handleTabSwitch('login')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'login' 
                    ? 'bg-white text-sky-800 shadow-xs font-bold border border-slate-200/60' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                id="tab-register"
                type="button"
                onClick={() => handleTabSwitch('register')}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'register' 
                    ? 'bg-white text-sky-800 shadow-xs font-bold border border-slate-200/60' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Register Account
              </button>
            </div>
          )}

          {/* Flash Message Banner */}
          {message && (
            <div 
              id="auth-status-message"
              className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs font-medium ${
                message.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : message.type === 'info'
                  ? 'bg-sky-50 border-sky-200 text-sky-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : message.type === 'info' ? (
                <Mail className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              )}
              <span className="leading-relaxed">{message.text}</span>
            </div>
          )}

          {/* Role Selector Buttons */}
          {(activeTab === 'login' || activeTab === 'register' || activeTab === 'forgot_password') && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="role-student-btn"
                  onClick={() => handleRoleChange('student')}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all ${
                    role === 'student'
                      ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-xs ring-2 ring-sky-100'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-700'
                  }`}
                >
                  <GraduationCap className={`w-5 h-5 ${role === 'student' ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">Student</span>
                </button>

                <button
                  type="button"
                  id="role-professor-btn"
                  onClick={() => handleRoleChange('professor')}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all ${
                    role === 'professor'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-2 ring-emerald-100'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                  }`}
                >
                  <UserCheck className={`w-5 h-5 ${role === 'professor' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">Professor</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 1. SIGN IN FORM */}
          {/* ================================================================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {role === 'student' ? 'Enrollment Number or Registered Email' : 'Professor ID or Registered Email'}
                </label>
                <input
                  type="text"
                  required
                  id="input-identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    role === 'student' ? 'e.g. 200010116001 or student@ssec.ac.in' : 'e.g. PROF_IT_01 or prof@ssec.ac.in'
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-mono transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    id="btn-forgot-password-link"
                    onClick={() => handleTabSwitch('forgot_password')}
                    className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    id="input-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 pr-10 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-login"
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md shadow-sky-600/20 transition-all flex items-center justify-center space-x-2 mt-2"
              >
                <span>Sign In as {role.charAt(0).toUpperCase() + role.slice(1)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ================================================================= */}
          {/* 2. REGISTER PROFILE FORM */}
          {/* ================================================================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleRequestRegisterOtp} className="space-y-3">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {role === 'student' ? 'Enrollment Number' : 'Professor ID'}
                  </label>
                  <input
                    type="text"
                    required
                    id="reg-identifier"
                    value={regIdentifier}
                    onChange={(e) => handleRegIdentifierChange(e.target.value)}
                    placeholder={role === 'student' ? 'e.g. 200010116005' : 'e.g. PROF_IT_04'}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Registered Email Address <span className="text-sky-600 font-bold">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    id="reg-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@ssec.ac.in"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-mono transition-all"
                  />
                </div>
              </div>

              {role === 'student' ? (
                <div className="grid grid-cols-2 gap-3">
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
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    id="reg-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 4 characters"
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
                    placeholder="Re-enter password"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 font-mono transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-get-register-otp"
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md shadow-sky-600/20 transition-all flex items-center justify-center space-x-2 mt-4"
              >
                <Send className="w-4 h-4" />
                <span>Get Email OTP & Verify Registration</span>
              </button>
            </form>
          )}

          {/* ================================================================= */}
          {/* 3. OTP VERIFICATION VIEW */}
          {/* ================================================================= */}
          {activeTab === 'verify_otp' && (
            <div className="space-y-5 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Verify Email Address</h3>
                <p className="text-xs text-slate-500 mt-1">
                  We've sent a 6-digit verification code to:
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-mono font-bold text-slate-800">
                  <Mail className="w-3.5 h-3.5 text-sky-600" />
                  <span>{getMaskedEmail(email || OtpService.getActiveSession()?.email || '')}</span>
                </div>
              </div>

              <form onSubmit={handleVerifyRegistrationOtp} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Enter 6-Digit OTP Code
                  </label>
                  <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`reg-otp-${idx}`}
                        ref={el => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        className="w-10 h-12 text-center text-lg font-bold font-mono border-2 border-slate-300 rounded-xl focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span>Code expires in:</span>
                  <span className={`font-mono font-bold ${otpExpirySeconds < 60 ? 'text-red-600' : 'text-sky-600'}`}>
                    {formatTime(otpExpirySeconds)}
                  </span>
                </div>

                <button
                  type="submit"
                  id="btn-confirm-register-otp"
                  disabled={isSubmitting || otpDigits.join('').length !== 6 || otpExpirySeconds === 0}
                  className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Code & Complete Registration</span>
                </button>
              </form>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-xs text-slate-500">Didn't receive the email?</p>
                <button
                  type="button"
                  id="btn-resend-register-otp"
                  onClick={async () => {
                    if (resendCooldown > 0 || isSubmitting) return;
                    const activeSession = OtpService.getActiveSession();
                    let pendingReg: any = null;
                    try {
                      const stored = sessionStorage.getItem('ssec_pending_reg');
                      if (stored) pendingReg = JSON.parse(stored);
                    } catch {}

                    const targetEmail = (email || pendingReg?.email || activeSession?.email || '').trim().toLowerCase();
                    const targetRole = role || pendingReg?.role || activeSession?.role || 'student';
                    const targetName = fullName.trim() || pendingReg?.fullName || activeSession?.recipientName || 'Student';
                    const targetId = regIdentifier.trim() || pendingReg?.regIdentifier || activeSession?.identifier || '';

                    if (!targetEmail) {
                      setMessage({ text: 'No email address found. Please return to the registration form.', type: 'danger' });
                      return;
                    }

                    setIsSubmitting(true);
                    const res = await OtpService.requestOtp({
                      email: targetEmail,
                      role: targetRole,
                      purpose: 'REGISTRATION',
                      recipientName: targetName,
                      identifier: targetId
                    });
                    setIsSubmitting(false);

                    if (!res.success) {
                      setMessage({ text: res.error || 'Unable to send verification email. Please try again later.', type: 'danger' });
                      return;
                    }
                    setOtpDigits(['', '', '', '', '', '']);
                    setOtpExpirySeconds(300);
                    setResendCooldown(60);
                    setMessage({ text: `A fresh 6-digit OTP code has been sent to ${res.maskedEmail || OtpService.maskEmail(targetEmail)}. Please check your inbox.`, type: 'info' });
                  }}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 disabled:text-slate-400"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>{resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend Verification Code'}</span>
                </button>

                <div>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('register')}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 mx-auto mt-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to registration form</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 4. FORGOT PASSWORD VIEW */}
          {/* ================================================================= */}
          {activeTab === 'forgot_password' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 mb-2">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Forgot Password</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your registered ID or Email to receive a 6-digit password reset OTP.
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {role === 'student' ? 'Enrollment Number or Email' : 'Professor ID or Email'}
                  </label>
                  <input
                    type="text"
                    required
                    id="input-forgot-identifier"
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder={role === 'student' ? 'e.g. 200010116001 or student@ssec.ac.in' : 'e.g. PROF_IT_01 or prof@ssec.ac.in'}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 font-mono"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  id="btn-send-reset-otp"
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Password Reset OTP</span>
                </button>
              </form>

              <div className="text-center pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* 5. RESET PASSWORD VIEW */}
          {/* ================================================================= */}
          {activeTab === 'reset_password' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 mb-2">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Set New Password</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter the OTP sent to <strong className="font-mono text-slate-700">{getMaskedEmail(resetAccount?.email || '')}</strong> and choose a new password.
                </p>
              </div>

              <form onSubmit={handleVerifyResetOtpAndSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-center">
                    Enter 6-Digit Reset OTP
                  </label>
                  <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`reset-otp-${idx}`}
                        ref={el => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        className="w-9 h-11 text-center text-lg font-bold font-mono border-2 border-slate-300 rounded-xl focus:border-sky-500 focus:outline-none"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span>Expires in:</span>
                  <span className="font-mono font-bold text-sky-600">{formatTime(otpExpirySeconds)}</span>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={async () => {
                      if (resendCooldown > 0 || isSubmitting) return;
                      const activeSession = OtpService.getActiveSession();
                      const targetAccount = resetAccount || (activeSession?.purpose === 'PASSWORD_RESET' ? {
                        name: activeSession.recipientName || 'User',
                        email: activeSession.email,
                        identifier: activeSession.identifier || '',
                        role: activeSession.role || 'student'
                      } : null);

                      if (!targetAccount) return;
                      setIsSubmitting(true);
                      const res = await OtpService.requestOtp({
                        email: targetAccount.email,
                        role: targetAccount.role,
                        purpose: 'PASSWORD_RESET',
                        recipientName: targetAccount.name,
                        identifier: ''
                      });
                      setIsSubmitting(false);

                      if (!res.success) {
                        setMessage({ text: res.error || 'Unable to send verification email. Please try again later.', type: 'danger' });
                        return;
                      }
                      setOtpDigits(['', '', '', '', '', '']);
                      setOtpExpirySeconds(300);
                      setResendCooldown(60);
                      setMessage({ text: `A fresh password reset OTP has been sent to ${res.maskedEmail || OtpService.maskEmail(targetAccount.email)}. Please check your inbox.`, type: 'info' });
                    }}
                    disabled={resendCooldown > 0 || isSubmitting}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 disabled:text-slate-400"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                    <span>{resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 4 characters"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-save-new-password"
                  disabled={isSubmitting}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 mt-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Update Password & Sign In</span>
                </button>
              </form>

              <div className="text-center pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancel and Return to Sign In</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
