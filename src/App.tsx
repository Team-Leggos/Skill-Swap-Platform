import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import LoginScreen from './components/auth/LoginScreen';
import MainApp from './components/MainApp';
import LoadingScreen from './components/ui/LoadingScreen';
import { useAuth } from './contexts/AuthContext';

function AppContent() {
  const { session, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {session ? <MainApp /> : <LoginScreen />}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#1f2937',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;