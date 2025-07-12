import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import './styles.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    skillsOffered: '',
    skillsWanted: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all required fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.skillsOffered || !formData.skillsWanted) {
      toast.error('Please specify skills you can offer and want to learn');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    
    setLoading(true);

    try {
      const userData = {
        ...formData,
        skillsOffered: formData.skillsOffered.split(',').map(skill => skill.trim()),
        skillsWanted: formData.skillsWanted.split(',').map(skill => skill.trim())
      };
      
      const result = await signup(userData);
      
      if (result.success) {
        toast.success('Account created successfully!');
        navigate('/');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-glow auth-glow-1"></div>
        <div className="auth-glow auth-glow-2"></div>
        <div className="auth-glow auth-glow-3"></div>
      </div>
      
      <motion.div
        className="auth-card signup-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="auth-header">
          <motion.h1
            className="auth-title"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Join SkillSwap
          </motion.h1>
          <motion.p
            className="auth-subtitle"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Create your account and start sharing skills
          </motion.p>
        </div>

        {/* Progress Indicator */}
        <div className="signup-progress">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Account Info</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Skills & Bio</span>
          </div>
        </div>

        <motion.form
          className="auth-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                  />
                  <div className="input-icon">👤</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your email"
                    required
                  />
                  <div className="input-icon">📧</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Confirm your password"
                    required
                  />
                  <div className="input-icon">🔒</div>
                </div>
              </div>

              <motion.button
                type="button"
                onClick={handleNext}
                className="auth-submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Next Step</span>
                <div className="btn-arrow">→</div>
              </motion.button>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="form-group">
                <label className="form-label">Skills You Can Offer</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="skillsOffered"
                    value={formData.skillsOffered}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., JavaScript, Guitar, Cooking"
                    required
                  />
                  <div className="input-icon">🎯</div>
                </div>
                <small className="form-hint">Separate skills with commas</small>
              </div>

              <div className="form-group">
                <label className="form-label">Skills You Want to Learn</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="skillsWanted"
                    value={formData.skillsWanted}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Python, Piano, Photography"
                    required
                  />
                  <div className="input-icon">🎓</div>
                </div>
                <small className="form-hint">Separate skills with commas</small>
              </div>

              <div className="form-group">
                <label className="form-label">Bio (Optional)</label>
                <div className="input-wrapper">
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="Tell others about yourself..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-buttons">
                <motion.button
                  type="button"
                  onClick={handleBack}
                  className="auth-secondary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ← Back
                </motion.button>

                <motion.button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <div className="loading-spinner">
                      <div className="spinner"></div>
                      Creating...
                    </div>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <div className="btn-arrow">✨</div>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.form>

        <motion.div
          className="auth-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup;