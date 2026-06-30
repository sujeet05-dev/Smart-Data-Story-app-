import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Upload from './components/Upload';
import Dashboard from './components/Dashboard';
import { authService, dataService } from './services/api';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
          
          // Try to load the most recent session from history if it exists
          const history = await dataService.getSessions();
          if (history && history.length > 0) {
            const latestSession = await dataService.getSession(history[0].session_id);
            setActiveSession(latestSession);
          }
        } catch (err) {
          console.error('Session expired or network error', err);
          authService.logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const handleAuthSuccess = async (userData) => {
    setUser(userData);
    // After logging in, check if user has existing sessions and load the latest
    try {
      const history = await dataService.getSessions();
      if (history && history.length > 0) {
        const latestSession = await dataService.getSession(history[0].session_id);
        setActiveSession(latestSession);
      }
    } catch (err) {
      console.error('Failed to load history on login', err);
    }
  };

  const handleUploadSuccess = (sessionData) => {
    setActiveSession(sessionData);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setActiveSession(null);
  };

  const handleNewUpload = () => {
    setActiveSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-3 text-white">
          <span className="w-10 h-10 border-4 border-[#ffb0c8] border-t-transparent rounded-full animate-spin"></span>
          <span className="text-xs uppercase tracking-widest text-[#ffb0c8] animate-pulse">Initializing Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#161618',
            color: '#e3e2e2',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '12px',
            borderRadius: '12px',
            padding: '12px 16px',
          },
        }}
      />
      {!user ? (
        <Login onAuthSuccess={handleAuthSuccess} />
      ) : !activeSession ? (
        <Upload 
          user={user} 
          onUploadSuccess={handleUploadSuccess} 
          onLogout={handleLogout} 
        />
      ) : (
        <Dashboard 
          initialSession={activeSession} 
          user={user} 
          onNewUpload={handleNewUpload} 
          onLogout={handleLogout} 
        />
      )}
    </>
  );
}
