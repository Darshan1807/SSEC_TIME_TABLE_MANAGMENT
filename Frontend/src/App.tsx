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
import { TimetableSearchModal } from './components/TimetableSearchModal';
import { MongoConfigModal } from './components/MongoConfigModal';
import { FlaskCodeViewerModal } from './components/FlaskCodeViewerModal';
import { ProfileModal } from './components/ProfileModal';

export default function App() {
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
  }, []);

  const handleLogout = () => {
    StorageService.setAuth(null);
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        notifications={notifications}
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
          <AdminDashboardView
            user={user}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenMongoConfig={() => setIsMongoConfigOpen(true)}
            onOpenCodeViewer={() => setIsCodeViewerOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 py-6 text-center text-xs shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            <strong className="text-slate-700">Shantilal Shah Engineering College (SSEC), Bhavnagar</strong> — IT Department
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>IT Department Portal</span>
            <span>•</span>
            <span>Version 2.4.0</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
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
