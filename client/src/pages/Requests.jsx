import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { swapAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatTimeAgo } from '../utils/helpers';

const Requests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('received');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await swapAPI.getSwaps({
        type: activeTab,
        userId: user._id
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await swapAPI.acceptSwap(requestId);
      toast.success('Request accepted successfully!');
      fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await swapAPI.rejectSwap(requestId);
      toast.success('Request rejected');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const tabs = [
    { id: 'received', name: 'Received', icon: '📥' },
    { id: 'sent', name: 'Sent', icon: '📤' },
    { id: 'active', name: 'Active', icon: '🔄' },
    { id: 'completed', name: 'Completed', icon: '✅' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            My Requests
          </h1>
          <p className="text-lg text-gray-600">
            Manage your skill swap requests and active exchanges
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                  : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-md'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.name}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {requests.length}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-md animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : requests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.map((request, index) => (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                      {request.status}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTimeAgo(request.createdAt)}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {request.skillOffered} ⇄ {request.skillRequested}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {request.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {request.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {request.user?.name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.category}
                      </div>
                    </div>
                  </div>

                  {activeTab === 'received' && request.status === 'pending' && (
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAcceptRequest(request._id)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRejectRequest(request._id)}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </motion.button>
                    </div>
                  )}

                  {(activeTab === 'active' || activeTab === 'completed') && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Open Chat
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="text-6xl mb-4">
                {activeTab === 'received' && '📥'}
                {activeTab === 'sent' && '📤'}
                {activeTab === 'active' && '🔄'}
                {activeTab === 'completed' && '✅'}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No {activeTab} requests
              </h3>
              <p className="text-gray-600 mb-8">
                {activeTab === 'received' && "You haven't received any requests yet."}
                {activeTab === 'sent' && "You haven't sent any requests yet."}
                {activeTab === 'active' && "No active skill swaps at the moment."}
                {activeTab === 'completed' && "No completed swaps yet."}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/'}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Browse Skills
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Requests;