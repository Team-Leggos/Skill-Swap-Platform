import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { swapAPI } from "../services/api";

const Dashboard = () => {
  const { user, loading: userLoading } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [swapsLoading, setSwapsLoading] = useState(true);
  const [swapsError, setSwapsError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchSwaps();
      fetchRequests();
    }
  }, [user]);

  const fetchSwaps = async () => {
    setSwapsLoading(true);
    setSwapsError(null);
    try {
      const response = await swapAPI.getSwaps({ userId: user._id });
      setSwaps(response.data);
    } catch (error) {
      setSwapsError("Could not fetch your swaps. Please try again later.");
    } finally {
      setSwapsLoading(false);
    }
  };

  const fetchRequests = async () => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const response = await swapAPI.getSwaps({
        status: "pending",
        role: "offerer",
      });
      setRequests(response.data.swaps || response.data); // handle both {swaps:[]} and []
    } catch (error) {
      setRequestsError(
        "Could not fetch your requests. Please try again later."
      );
    } finally {
      setRequestsLoading(false);
    }
  };

  // Compute stats
  const activeSwaps = swaps.filter((s) => s.status === "active");
  const pendingSwaps = swaps.filter((s) => s.status === "pending");
  const completedSwaps = swaps.filter((s) => s.status === "completed");
  const upcomingSessions = swaps.filter(
    (s) => s.session && s.session.status === "upcoming"
  );

  if (userLoading) {
    return (
      <div className="text-center py-20 text-xl text-accent-light">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-8 md:px-16 bg-gradient-to-br from-background-light via-primary-dark to-secondary-dark text-accent-light">
      <div className="max-w-5xl mx-auto">
        {/* Welcome/User Info */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome back, {user?.name || "User"}!
            </h1>
            <p className="text-lg text-accent-light/80">
              Here’s a quick overview of your skill swaps and activity.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-light to-secondary-light flex items-center justify-center text-2xl font-bold shadow-lg">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <div className="font-semibold">{user?.name}</div>
              <div className="text-sm text-accent-light/60">{user?.email}</div>
            </div>
          </div>
        </div>
        {/* Stats/Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-background-dark rounded-2xl p-6 shadow-xl flex flex-col items-center">
            <div className="text-3xl font-bold mb-1">{activeSwaps.length}</div>
            <div className="text-sm text-accent-light/70">Active Swaps</div>
          </div>
          <div className="bg-background-dark rounded-2xl p-6 shadow-xl flex flex-col items-center">
            <div className="text-3xl font-bold mb-1">{pendingSwaps.length}</div>
            <div className="text-sm text-accent-light/70">Pending Requests</div>
          </div>
          <div className="bg-background-dark rounded-2xl p-6 shadow-xl flex flex-col items-center">
            <div className="text-3xl font-bold mb-1">
              {upcomingSessions.length}
            </div>
            <div className="text-sm text-accent-light/70">
              Upcoming Sessions
            </div>
          </div>
          <div className="bg-background-dark rounded-2xl p-6 shadow-xl flex flex-col items-center">
            <div className="text-3xl font-bold mb-1">
              {completedSwaps.length}
            </div>
            <div className="text-sm text-accent-light/70">Completed Swaps</div>
          </div>
        </div>
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-10">
          <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-light to-secondary-light text-background-dark font-semibold shadow-lg hover:scale-105 transition">
            Create New Swap
          </button>
          <button className="px-6 py-3 rounded-xl border-2 border-accent-dark text-accent-light font-semibold hover:border-primary-light hover:text-primary-light transition">
            View Profile
          </button>
        </div>
        {/* My Swaps, Requests, Sessions */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-background-dark rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">My Swaps</h2>
            {swapsLoading ? (
              <div className="text-accent-light/70">Loading swaps...</div>
            ) : swapsError ? (
              <div className="text-red-400">{swapsError}</div>
            ) : (
              <ul className="space-y-3">
                {swaps.map((swap) => (
                  <li
                    key={swap._id}
                    className="bg-primary-dark/30 rounded-lg p-3 flex justify-between items-center"
                  >
                    <span>
                      Swap: {swap.skillOffered} for {swap.skillRequested}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        swap.status === "active"
                          ? "bg-success/20 text-success"
                          : swap.status === "pending"
                          ? "bg-warning/20 text-warning"
                          : "bg-gray-400/20 text-gray-400"
                      }`}
                    >
                      {swap.status.charAt(0).toUpperCase() +
                        swap.status.slice(1)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-background-dark rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Requests</h2>
            {requestsLoading ? (
              <div className="text-accent-light/70">Loading requests...</div>
            ) : requestsError ? (
              <div className="text-red-400">{requestsError}</div>
            ) : requests.length === 0 ? (
              <div className="text-accent-light/70">No pending requests.</div>
            ) : (
              <ul className="space-y-3">
                {requests.map((req) => (
                  <li
                    key={req._id}
                    className="bg-secondary-dark/30 rounded-lg p-3 flex justify-between items-center"
                  >
                    <span>
                      Request from {req.requesterId?.name || "User"}:{" "}
                      {req.skillRequested?.name || req.skillRequested}
                    </span>
                    <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded">
                      Pending
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="bg-background-dark rounded-2xl p-6 shadow-xl mt-8">
          <h2 className="text-xl font-bold mb-4">Sessions</h2>
          {/* Placeholder: You can fetch and map real sessions here */}
          <div className="text-accent-light/70">Coming soon...</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
