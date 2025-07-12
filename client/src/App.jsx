import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";

// Components
import Navbar from "./components/Navbar/Navbar";

// Pages
import Home from "./pages/Home";
import SwapDetails from "./pages/SwapDetails";
import Requests from "./pages/Requests";
import Profile from "./pages/Profile";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/swap/:id" element={<SwapDetails />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              className="mt-16"
            />
          </div>
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
