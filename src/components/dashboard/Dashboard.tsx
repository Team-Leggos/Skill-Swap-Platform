import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  ArrowRightLeft, 
  Star, 
  TrendingUp,
  MessageSquare,
  Calendar,
  Award,
  Eye
} from 'lucide-react';

interface ProfileData {
  name: string;
  location: string;
  bio: string;
  skillsOffered: string[];
  skillsWanted: string[];
  availability: string[];
  isPublic: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState({
    totalSwaps: 12,
    activeRequests: 3,
    rating: 4.8,
    profileViews: 47
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem(`profile_${user?.id}`);
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, [user?.id]);

  const recentActivity = [
    {
      id: 1,
      type: 'swap_completed',
      message: 'Completed skill swap with Sarah Chen',
      skill: 'Photoshop for Spanish',
      time: '2 hours ago',
      rating: 5
    },
    {
      id: 2,
      type: 'request_received',
      message: 'New swap request from Mike Johnson',
      skill: 'Guitar lessons for Web Design',
      time: '1 day ago'
    },
    {
      id: 3,
      type: 'request_accepted',
      message: 'Emma Wilson accepted your request',
      skill: 'Cooking for Photography',
      time: '2 days ago'
    }
  ];

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile.name}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your skill swaps
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: 'Total Swaps',
            value: stats.totalSwaps,
            icon: ArrowRightLeft,
            color: 'blue',
            change: '+2 this month'
          },
          {
            label: 'Active Requests',
            value: stats.activeRequests,
            icon: MessageSquare,
            color: 'green',
            change: '1 pending'
          },
          {
            label: 'Rating',
            value: stats.rating,
            icon: Star,
            color: 'yellow',
            change: 'Based on 12 reviews'
          },
          {
            label: 'Profile Views',
            value: stats.profileViews,
            icon: Eye,
            color: 'purple',
            change: '+8 this week'
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your Profile
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Skills Offered</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skillsOffered.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                  {profile.skillsOffered.length > 3 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                      +{profile.skillsOffered.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Skills Wanted</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skillsWanted.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                  {profile.skillsWanted.length > 3 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                      +{profile.skillsWanted.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Profile Status</span>
                  <span className={`font-medium ${
                    profile.isPublic ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {profile.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Activity
            </h2>
            
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className={`p-2 rounded-lg ${
                    activity.type === 'swap_completed' ? 'bg-green-100' :
                    activity.type === 'request_received' ? 'bg-blue-100' :
                    'bg-purple-100'
                  }`}>
                    {activity.type === 'swap_completed' && (
                      <Award className="w-5 h-5 text-green-600" />
                    )}
                    {activity.type === 'request_received' && (
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    )}
                    {activity.type === 'request_accepted' && (
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {activity.message}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.skill}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">{activity.time}</p>
                      {activity.rating && (
                        <div className="flex items-center space-x-1">
                          {[...Array(activity.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                View All Activity
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}