import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Check, 
  X, 
  Star, 
  MessageSquare, 
  Calendar,
  Trash2,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SwapRequest {
  id: string;
  type: 'incoming' | 'outgoing';
  otherUser: {
    name: string;
    avatar: string;
    rating: number;
  };
  skillOffered: string;
  skillWanted: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  scheduledDate?: string;
}

export default function SwapRequests() {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'completed'>('incoming');
  const [showRatingModal, setShowRatingModal] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  // Mock data - in real app, this would come from API
  const swapRequests: SwapRequest[] = [
    {
      id: '1',
      type: 'incoming',
      otherUser: {
        name: 'Sarah Chen',
        avatar: 'SC',
        rating: 4.9
      },
      skillOffered: 'Photoshop',
      skillWanted: 'Spanish',
      message: 'Hi! I saw you offer Spanish lessons. I\'d love to trade my Photoshop skills for some Spanish tutoring. I\'m available weekends!',
      status: 'pending',
      createdAt: '2 hours ago'
    },
    {
      id: '2',
      type: 'incoming',
      otherUser: {
        name: 'Mike Johnson',
        avatar: 'MJ',
        rating: 4.7
      },
      skillOffered: 'Guitar',
      skillWanted: 'Web Design',
      message: 'Hey! I can teach you guitar in exchange for some web design help. I need a simple portfolio site.',
      status: 'pending',
      createdAt: '1 day ago'
    },
    {
      id: '3',
      type: 'outgoing',
      otherUser: {
        name: 'Emma Wilson',
        avatar: 'EW',
        rating: 5.0
      },
      skillOffered: 'Spanish',
      skillWanted: 'Photography',
      message: 'Hi Emma! I\'d love to learn photography from you. I can offer Spanish lessons in return. Let me know if you\'re interested!',
      status: 'accepted',
      createdAt: '3 days ago',
      scheduledDate: 'Tomorrow at 2:00 PM'
    },
    {
      id: '4',
      type: 'outgoing',
      otherUser: {
        name: 'David Rodriguez',
        avatar: 'DR',
        rating: 4.8
      },
      skillOffered: 'Web Design',
      skillWanted: 'Yoga',
      message: 'Hi David! I saw your yoga classes. I can help with web design in exchange for some yoga sessions.',
      status: 'pending',
      createdAt: '5 days ago'
    },
    {
      id: '5',
      type: 'incoming',
      otherUser: {
        name: 'Lisa Park',
        avatar: 'LP',
        rating: 4.6
      },
      skillOffered: 'Cooking',
      skillWanted: 'Guitar',
      message: 'Completed swap - taught cooking basics',
      status: 'completed',
      createdAt: '1 week ago'
    }
  ];

  const filteredRequests = swapRequests.filter(request => {
    if (activeTab === 'completed') {
      return request.status === 'completed';
    }
    return request.type === activeTab && request.status !== 'completed';
  });

  const handleAcceptRequest = (requestId: string) => {
    toast.success('Swap request accepted! You can now schedule your session.');
  };

  const handleRejectRequest = (requestId: string) => {
    toast.success('Swap request declined.');
  };

  const handleDeleteRequest = (requestId: string) => {
    toast.success('Swap request deleted.');
  };

  const handleSubmitRating = (requestId: string) => {
    toast.success('Rating submitted! Thank you for your feedback.');
    setShowRatingModal(null);
    setRating(5);
    setFeedback('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Swap Requests
        </h1>
        <p className="text-gray-600">
          Manage your incoming and outgoing skill swap requests
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'incoming', label: 'Incoming', count: swapRequests.filter(r => r.type === 'incoming' && r.status !== 'completed').length },
              { id: 'outgoing', label: 'Outgoing', count: swapRequests.filter(r => r.type === 'outgoing' && r.status !== 'completed').length },
              { id: 'completed', label: 'Completed', count: swapRequests.filter(r => r.status === 'completed').length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request, index) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {request.otherUser.avatar}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {request.otherUser.name}
                    </h3>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">
                        {request.otherUser.rating}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                      <span className="font-medium">Offers:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {request.skillOffered}
                      </span>
                      <span>for</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                        {request.skillWanted}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{request.message}</p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{request.createdAt}</span>
                      </div>
                      {request.scheduledDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>{request.scheduledDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                {request.type === 'incoming' && request.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      title="Accept"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Decline"
                    >
                      <X size={16} />
                    </button>
                  </>
                )}

                {request.type === 'outgoing' && request.status === 'pending' && (
                  <button
                    onClick={() => handleDeleteRequest(request.id)}
                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Delete Request"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                {request.status === 'accepted' && (
                  <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
                    <MessageSquare size={14} className="inline mr-1" />
                    Message
                  </button>
                )}

                {request.status === 'completed' && (
                  <button
                    onClick={() => setShowRatingModal(request.id)}
                    className="px-4 py-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
                  >
                    <Star size={14} className="inline mr-1" />
                    Rate
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-gray-400 mb-4">
            <MessageSquare size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {activeTab} requests
          </h3>
          <p className="text-gray-600">
            {activeTab === 'incoming' 
              ? "You don't have any incoming requests yet"
              : activeTab === 'outgoing'
              ? "You haven't sent any requests yet"
              : "No completed swaps to show"
            }
          </p>
        </motion.div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rate Your Experience
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`w-8 h-8 ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <Star className="w-full h-full fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Share your experience..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRatingModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmitRating(showRatingModal)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}