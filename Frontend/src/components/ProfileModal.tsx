import React, { useState } from 'react';
import { AuthUser } from '../types';
import { StorageService } from '../services/storageService';
import { User, X, Lock, CheckCircle2, ShieldCheck, GraduationCap, UserCheck } from 'lucide-react';

interface ProfileModalProps {
  user: AuthUser;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (updatedUser: AuthUser) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, isOpen, onClose, onProfileUpdated }) => {
  if (!isOpen) return null;

  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password && password !== confirmPass) {
      setError('Passwords do not match!');
      return;
    }

    if (user.role === 'student') {
      StorageService.updateStudent(user.id, { full_name: name });
    } else if (user.role === 'professor') {
      StorageService.updateProfessor(user.id, { full_name: name });
    }

    const updated = { ...user, name };
    StorageService.setAuth(updated);
    onProfileUpdated(updated);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 space-y-5">
        
        <div className="flex justify-between items-center border-b border-slate-200 pb-4 bg-sky-50/50 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 px-6 sm:px-8 pt-6 sm:pt-8">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl shadow-sm ${
              user.role === 'admin' ? 'bg-amber-500 shadow-amber-500/20' :
              user.role === 'professor' ? 'bg-emerald-600 shadow-emerald-600/20' :
              'bg-sky-500 shadow-sky-500/20'
            } text-white`}>
              {user.role === 'admin' && <ShieldCheck className="w-5 h-5" />}
              {user.role === 'student' && <GraduationCap className="w-5 h-5" />}
              {user.role === 'professor' && <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">User Profile</h3>
              <p className="text-xs font-semibold text-slate-500 capitalize">{user.role} Control Settings</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-xs font-semibold focus:outline-none focus:border-sky-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Identifier ({user.role === 'student' ? 'Enrollment No' : user.role === 'professor' ? 'Professor ID' : 'Username'})
            </label>
            <input
              type="text"
              disabled
              value={user.identifier}
              className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-2.5 text-xs font-mono font-semibold cursor-not-allowed"
            />
          </div>

          <div className="pt-3 border-t border-slate-200">
            <span className="text-xs font-semibold text-slate-500 block mb-2.5">Change Password (Optional)</span>
            
            <div className="space-y-2">
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-400"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-sky-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all mt-4"
          >
            Save Profile Changes
          </button>
        </form>

      </div>
    </div>
  );
};
