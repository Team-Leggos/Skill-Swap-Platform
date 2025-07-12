import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, MessageSquare, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  name: string;
  location: string;
  bio: string;
  skillsOffered: string[];
  skillsWanted: string[];
  availability: string[];
  rating: number;
  totalSwaps: number;
  isOnline: boolean;
}

export default function BrowseSkills() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Mock data - in real app, this would come from API
  const users: UserProfile[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      location: 'San Francisco, CA',
      bio: 'Graphic designer with 5+ years experience. Love teaching creative skills!',
      skillsOffered: ['Photoshop', 'Illustrator', 'UI Design', 'Branding'],
      skillsWanted: ['Spanish', 'Guitar', 'Cooking'],
      availability: ['Weekend Evenings', 'Weekday Evenings'],
      rating: 4.9,
      totalSwaps: 23,
      isOnline: true
    },
    {
      id: '2',
      name: 'Mike Johnson',
      location: 'New York, NY',
      bio: 'Full-stack developer and guitar enthusiast. Always excited to share knowledge!',
      skillsOffered: ['JavaScript', 'React', 'Node.js', 'Guitar'],
      skillsWanted: ['Photography', 'French', 'Cooking'],
      availability: ['Weekend Mornings', 'Weekday Evenings'],
      rating: 4.7,
      totalSwaps: 18,
      isOnline: false
    },
    {
      id: '3',
      name: 'Emma Wilson',
      location: 'London, UK',
      bio: 'Professional chef and photography hobbyist. Love connecting with creative people!',
      skillsOffered: ['Cooking', 'Baking', 'Photography', 'Food Styling'],
      skillsWanted: ['Web Design', 'Marketing', 'Yoga'],
      availability: ['Weekend Afternoons', 'Flexible Schedule'],
      rating: 5.0,
      totalSwaps: 31,
      isOnline: true
    },
    {
      id: '4',
      name: 'David Rodriguez',
      location: 'Barcelona, Spain',
      bio: 'Language teacher and yoga instructor. Passionate about wellness and communication.',
      skillsOffered: ['Spanish', 'Yoga', 'Meditation', 'Public Speaking'],
      skillsWanted: ['Programming', 'Digital Marketing', 'Video Editing'],
      availability: ['Weekday Mornings', 'Weekend Mornings'],
      rating: 4.8,
      totalSwaps: 15,
      isOnline: true
    }
  ];

  const popularSkills = [
    'Programming', 'Design', 'Languages', 'Music', 'Cooking', 'Photography',
    'Marketing', 'Writing', 'Fitness', 'Art'
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.skillsOffered.some(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      user.skillsWanted.some(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesSkill = selectedSkill === '' ||
      user.skillsOffered.some(skill => 
        skill.toLowerCase().includes(selectedSkill.toLowerCase())
      );

    return matchesSearch && matchesSkill;
  });

  const handleSendRequest = (userId: string, userName: string) => {
    toast.success(`Swap request sent to ${userName}!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Browse Skills
        </h1>
        <p className="text-gray-600">
          Find people to swap skills with in your area and beyond
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-8"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or skill..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Filter size={20} />
            <span>Filters</span>
          </button>
        </div>

        {/* Popular Skills */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Popular Skills:</p>
          <div className="flex flex-wrap gap-2">
            {popularSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(selectedSkill === skill ? '' : skill)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedSkill === skill
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* User Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin size={14} />
                    <span>{user.location}</span>
                  </div>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                user.isOnline ? 'bg-green-400' : 'bg-gray-300'
              }`} />
            </div>

            {/* Bio */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {user.bio}
            </p>

            {/* Skills Offered */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Offers:</h4>
              <div className="flex flex-wrap gap-1">
                {user.skillsOffered.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                  >
                    {skill}
                  </span>
                ))}
                {user.skillsOffered.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    +{user.skillsOffered.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Skills Wanted */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Wants:</h4>
              <div className="flex flex-wrap gap-1">
                {user.skillsWanted.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                  >
                    {skill}
                  </span>
                ))}
                {user.skillsWanted.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    +{user.skillsWanted.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>{user.rating}</span>
              </div>
              <span>{user.totalSwaps} swaps</span>
            </div>

            {/* Action Button */}
            <button
              onClick={() => handleSendRequest(user.id, user.name)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <MessageSquare size={16} />
              <span>Send Request</span>
            </button>
          </motion.div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-gray-400 mb-4">
            <Search size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No users found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search terms or filters
          </p>
        </motion.div>
      )}
    </div>
  );
}