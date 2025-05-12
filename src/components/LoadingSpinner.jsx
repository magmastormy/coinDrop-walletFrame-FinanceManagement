import React from 'react';
import './LoadingSpinner.css'; // Create this file for animations

const LoadingSpinner = () => (
  <div className="spinner-container">
    <div className="spinner"></div>
    <p className="spinner-text">Loading your dashboard...</p>
  </div>
);

export default LoadingSpinner; 