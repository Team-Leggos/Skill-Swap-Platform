import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Header from './layout/Header';
import ProfileSetup from './profile/ProfileSetup';
import Dashboard from './dashboard/Dashboard';
import BrowseSkills from './browse/BrowseSkills';
import SwapRequests from './swaps/SwapRequests';
import { useAuth } from '../contexts/AuthContext';

type View = 'dashboard' | 'browse' | 'requests' | 'profile';

export default function MainApp() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [profileComplete, setProfileComplete] = useState(false);
  const { user } = useAuth();

  // Check if user has completed profile setup
  React.useEffect(() => {
    // In a real app, this would check the user's profile data
    // For demo, we'll assume profile is incomplete initially
    const hasProfile = localStorage.getItem(`profile_${user?.id}`);
    setProfileComplete(!!hasProfile);
  }, [user]);

  if (!profileComplete) {
    return <ProfileSetup onComplete={() => setProfileComplete(true)} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'browse':
        return <BrowseSkills />;
      case 'requests':
        return <SwapRequests />;
      case 'profile':
        return <ProfileSetup onComplete={() => setCurrentView('dashboard')} isEdit />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="pt-16">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderView()}
        </motion.div>
      </main>
    </div>
  );
}