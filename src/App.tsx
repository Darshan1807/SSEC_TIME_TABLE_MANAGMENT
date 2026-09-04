/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthUser, NotificationItem } from './types';
import { StorageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { AuthView } from './components/AuthView';
import { StudentDashboardView } from './components/StudentDashboardView';
import { ProfessorDashboardView } from './components/ProfessorDashboardView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AdminAppView } from './components/AdminAppView';
import { TimetableSearchModal } from './components/TimetableSearchModal';
import { MongoConfigModal } from './components/MongoConfigModal';
import { FlaskCodeViewerModal } from './components/FlaskCodeViewerModal';
import { ProfileModal } from './components/ProfileModal';

export default function App() {
  // App Mode: 'portal' (Student & Faculty Timetable Portal) vs 'admin' (Dedicated Admin Panel WebApp)
  const [activeApp, setActiveApp] = useState<'portal' | 'admin'>(() => {
    if (typeof window !== 'undefined' && window.location.hash.toLowerCase().includes('admin')) {
      return 'admin';
    }
    return 'portal';
  });

  const [user, setUser] = useState<AuthUser | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modal controls
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMongoConfigOpen, setIsMongoConfigOpen] = useState(false);
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    // Restore session
    const savedUser = StorageService.getAuth();
    if (savedUser) {
      setUser(savedUser);
    }
    setNotifications(StorageService.getNotifications());

    // Listen to hash change for URL-based applet switching
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('admin')) {
        setActiveApp('admin');
      } else {
        setActiveApp('portal');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSwitchApp = (nextApp: 'portal' | 'admin') => {
    setActiveApp(nextApp);
    if (typeof window !== 'undefined') {
      window.location.hash = nextApp === 'admin' ? '#admin' : '#portal';
    }
  };

  const handleLogout = () => {
    StorageService.setAuth(null);
    setUser(null);
  };

  // 1. DEDICATED ADMIN PANEL WEBAPP
  if (activeApp === 'admin') {
    return (
      <>
        <AdminAppView
          user={user}
          onLoginSuccess={(loggedInUser) => setUser(loggedInUser)}
          onLogout={handleLogout}
          onSwitchToPortal={() => handleSwitchApp('portal')}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenMongoConfig={() => setIsMongoConfigOpen(true)}
          onOpenCodeViewer={() => setIsCodeViewerOpen(true)}
        />

        {/* Global Modals */}
        <TimetableSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />

        <MongoConfigModal
          isOpen={isMongoConfigOpen}
          onClose={() => setIsMongoConfigOpen(false)}
        />

        <FlaskCodeViewerModal
          isOpen={isCodeViewerOpen}
          onClose={() => setIsCodeViewerOpen(false)}
        />

        {user && (
          <ProfileModal
            user={user}
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onProfileUpdated={(updated) => setUser(updated)}
          />
        )}
      </>
    );
  }

  // 2. TIMETABLE PORTAL WEBAPP (Students, Professors, Public Schedule)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-white">
      
      {/* Top Navbar with App Switcher */}
      <Navbar
        user={user}
        notifications={notifications}
        activeApp="portal"
        onSwitchApp={handleSwitchApp}
        onLogout={handleLogout}
        onOpenCodeViewer={() => setIsCodeViewerOpen(true)}
        onOpenMongoConfig={() => setIsMongoConfigOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {!user ? (
          <AuthView
            onLoginSuccess={(loggedInUser) => setUser(loggedInUser)}
          />
        ) : user.role === 'student' ? (
          <StudentDashboardView
            user={user}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onLogout={handleLogout}
          />
        ) : user.role === 'professor' ? (
          <ProfessorDashboardView
            user={user}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onLogout={handleLogout}
          />
        ) : (
          <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            {/* Quick banner indicating admin is viewing inside portal */}
            <div className="bg-sky-50 text-sky-900 p-4 rounded-2xl border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="text-xs">
                <strong className="text-sky-800">Admin Mode Active:</strong> You are viewing the Timetable Portal as an Administrator.
              </div>
              <button
                onClick={() => handleSwitchApp('admin')}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-xs"
              >
                Open Full Admin WebApp ↗
              </button>
            </div>

            <AdminDashboardView
              user={user}
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenMongoConfig={() => setIsMongoConfigOpen(true)}
              onOpenCodeViewer={() => setIsCodeViewerOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 py-6 text-center text-xs shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            <strong className="text-slate-700">Shantilal Shah Engineering College (SSEC), Bhavnagar</strong> — IT Department
          </div>
          <div className="flex items-center space-x-2 text-slate-400 font-medium">
            <span>Academic Timetable & Schedule Management</span>
            <span>•</span>
            <span>Version 2.4.0</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <TimetableSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <MongoConfigModal
        isOpen={isMongoConfigOpen}
        onClose={() => setIsMongoConfigOpen(false)}
      />

      <FlaskCodeViewerModal
        isOpen={isCodeViewerOpen}
        onClose={() => setIsCodeViewerOpen(false)}
      />

      {user && (
        <ProfileModal
          user={user}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onProfileUpdated={(updated) => setUser(updated)}
        />
      )}

    </div>
  );
}
