import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { userAPI, swapAPI } from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    totalSwaps: 0,
    completedSwaps: 0,
    activeSwaps: 0,
    rating: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    skillsOffered: '',
    skillsWanted: '',
    location: '',
    website: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        skillsOffered: user.skillsOffered?.join(', ') || '',
        skillsWanted: user.skillsWanted?.join(', ') || '',
        location: user.location || '',
        website: user.website || ''
      });
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const response = await swapAPI.getSwaps({ userId: user._id });
      const swaps = response.data;
      
      setUserStats({
        totalSwaps: swaps.length,
        completedSwaps: swaps.filter(s => s.status === 'completed').length,
        activeSwaps: swaps.filter(s => s.status === 'active').length,
        rating: user.rating || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        ...formData,
        skillsOffered: formData.skillsOffered.split(',').map(skill => skill.trim()).filter(Boolean),
        skillsWanted: formData.skillsWanted.split(',').map(skill => skill.trim()).filter(Boolean)
      };

      const response = await userAPI.updateProfile(updateData);
      updateUser(response.data);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      bio: user.bio || '',
      skillsOffered: user.skillsOffered?.join(', ') || '',
      skillsWanted: user.skillsWanted?.join(', ') || '',
      location: user.location || '',
      website: user.website || ''
    });
    setEditing(false);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span
        key={i}
        className={`text-2xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ⭐
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32"></div>
          <div className="relative px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-16">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-white p-2 shadow-lg">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 mt-4 sm:mt-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {user?.name}
                    </h1>
                    <p className="text-gray-600 mb-2">{user?.email}</p>
                    {user?.location && (
                      <p className="text-gray-500 text-sm">📍 {user.location}</p>
                    )}
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditing(!editing)}
                    className="mt-4 sm:mt-0 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    {editing ? 'Cancel Edit' : 'Edit Profile'}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {userStats.totalSwaps}
            </div>
            <div className="text-gray-600">Total Swaps</div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {userStats.completedSwaps}
            </div>
            <div className="text-gray-600">Completed</div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {userStats.activeSwaps}
            </div>
            <div className="text-gray-600">Active</div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <div className="flex justify-center mb-2">
              {renderStars(Math.round(userStats.rating))}
            </div>
            <div className="text-gray-600">Rating</div>
          </div>
        </motion.div>

        {/* Profile Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Edit Profile
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="City, Country"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Tell others about yourself..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills You Offer
                </label>
                <input
                  type="text"
                  name="skillsOffered"
                  value={formData.skillsOffered}
                  onChange={handleChange}
                  placeholder="JavaScript, Guitar, Cooking (separate with commas)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills You Want to Learn
                </label>
                <input
                  type="text"
                  name="skillsWanted"
                  value={formData.skillsWanted}
                  onChange={handleChange}
                  placeholder="Python, Piano, Photography (separate with commas)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </motion.button>
                
                <motion.button
                  type="button"
                  onClick={handleCancel}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Profile Information
              </h2>
              
              {user?.bio && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-600 leading-relaxed">{user.bio}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Skills I Offer
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user?.skillsOffered?.length > 0 ? (
                      user.skillsOffered.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No skills listed</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Skills I Want to Learn
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user?.skillsWanted?.length > 0 ? (
                      user.skillsWanted.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No skills listed</p>
                    )}
                  </div>
                </div>
              </div>
              
              {(user?.location || user?.website) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Additional Information
                  </h3>
                  <div className="space-y-2">
                    {user?.location && (
                      <p className="text-gray-600">
                        <span className="font-medium">Location:</span> {user.location}
                      </p>
                    )}
                    {user?.website && (
                      <p className="text-gray-600">
                        <span className="font-medium">Website:</span>{' '}
                        <a
                          href={user.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {user.website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;