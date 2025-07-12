import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  Search, 
  MessageSquare, 
  User, 
  LogOut,
  ArrowRightLeft
} from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: 'dashboard' | 'browse' | 'requests' | 'profile') => void;
}

export default function Header({ currentView, onViewChange }: HeaderProps) {
  const { user, signOut } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'browse', label: 'Browse Skills', icon: Search },
    { id: 'requests', label: 'Swap Requests', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SkillSwap
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id as any)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-blue-50 border border-blue-200 rounded-lg -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-sm text-gray-600">
              {user?.email}
            </div>
            <button
              onClick={signOut}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 bg-white">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id as any)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}