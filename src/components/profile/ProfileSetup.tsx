import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, X, MapPin, Clock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfileData {
  name: string;
  location: string;
  bio: string;
  skillsOffered: string[];
  skillsWanted: string[];
  availability: string[];
  isPublic: boolean;
}

interface ProfileSetupProps {
  onComplete: () => void;
  isEdit?: boolean;
}

export default function ProfileSetup({ onComplete, isEdit = false }: ProfileSetupProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    location: '',
    bio: '',
    skillsOffered: [],
    skillsWanted: [],
    availability: [],
    isPublic: true,
  });

  const [newSkillOffered, setNewSkillOffered] = useState('');
  const [newSkillWanted, setNewSkillWanted] = useState('');
  const [newAvailability, setNewAvailability] = useState('');

  const availabilityOptions = [
    'Weekday Mornings',
    'Weekday Afternoons', 
    'Weekday Evenings',
    'Weekend Mornings',
    'Weekend Afternoons',
    'Weekend Evenings',
    'Flexible Schedule'
  ];

  useEffect(() => {
    if (isEdit) {
      const savedProfile = localStorage.getItem(`profile_${user?.id}`);
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    }
  }, [isEdit, user?.id]);

  const addSkillOffered = () => {
    if (newSkillOffered.trim() && !profile.skillsOffered.includes(newSkillOffered.trim())) {
      setProfile(prev => ({
        ...prev,
        skillsOffered: [...prev.skillsOffered, newSkillOffered.trim()]
      }));
      setNewSkillOffered('');
    }
  };

  const addSkillWanted = () => {
    if (newSkillWanted.trim() && !profile.skillsWanted.includes(newSkillWanted.trim())) {
      setProfile(prev => ({
        ...prev,
        skillsWanted: [...prev.skillsWanted, newSkillWanted.trim()]
      }));
      setNewSkillWanted('');
    }
  };

  const removeSkillOffered = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      skillsOffered: prev.skillsOffered.filter(s => s !== skill)
    }));
  };

  const removeSkillWanted = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      skillsWanted: prev.skillsWanted.filter(s => s !== skill)
    }));
  };

  const toggleAvailability = (option: string) => {
    setProfile(prev => ({
      ...prev,
      availability: prev.availability.includes(option)
        ? prev.availability.filter(a => a !== option)
        : [...prev.availability, option]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (profile.skillsOffered.length === 0) {
      toast.error('Please add at least one skill you can offer');
      return;
    }
    
    if (profile.skillsWanted.length === 0) {
      toast.error('Please add at least one skill you want to learn');
      return;
    }

    // Save profile to localStorage (in real app, this would be saved to database)
    localStorage.setItem(`profile_${user?.id}`, JSON.stringify(profile));
    
    toast.success(isEdit ? 'Profile updated successfully!' : 'Profile created successfully!');
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Edit Your Profile' : 'Complete Your Profile'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isEdit 
                ? 'Update your information and skills'
                : 'Tell others about your skills and what you want to learn'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell others about yourself and your interests..."
                  />
                </div>
              </div>
            </div>

            {/* Skills Offered */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills I Can Offer *</h2>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newSkillOffered}
                    onChange={(e) => setNewSkillOffered(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillOffered())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Photoshop, Guitar, Cooking, Programming..."
                  />
                  <button
                    type="button"
                    onClick={addSkillOffered}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {profile.skillsOffered.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkillOffered(skill)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills Wanted */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills I Want to Learn *</h2>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newSkillWanted}
                    onChange={(e) => setNewSkillWanted(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillWanted())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Spanish, Web Design, Photography..."
                  />
                  <button
                    type="button"
                    onClick={addSkillWanted}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {profile.skillsWanted.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkillWanted(skill)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Availability */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                <Clock className="inline w-5 h-5 mr-2" />
                Availability
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availabilityOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleAvailability(option)}
                    className={`p-3 text-sm rounded-lg border transition-all ${
                      profile.availability.includes(option)
                        ? 'bg-purple-100 border-purple-300 text-purple-800'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Settings */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy Settings</h2>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {profile.isPublic ? (
                    <Eye className="w-5 h-5 text-green-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {profile.isPublic ? 'Public Profile' : 'Private Profile'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {profile.isPublic 
                        ? 'Others can find and contact you'
                        : 'Only you can see your profile'
                      }
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProfile(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    profile.isPublic ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profile.isPublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                {isEdit ? 'Update Profile' : 'Complete Profile'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}