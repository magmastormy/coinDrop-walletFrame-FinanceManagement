import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import './styles/loginStyles.css';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        lastName: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Password validation (referencing userRegistrationForm.jsx)
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(formData.newPassword)) {
            toast.error('Password must include uppercase, lowercase, number, and special character');
            return;
        }

        if (!formData.email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }
        
        try {
            setLoading(true);
            await authService.forgotPassword(formData);
            toast.success('Password reset successful! Please login with your new password.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Reset Password</h2>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-form-field">
                        <label htmlFor="email">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="login-input"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="login-form-field">
                        <label htmlFor="lastName">Last Name</label>
                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            required
                            className="login-input"
                            placeholder="Enter your last name"
                            value={formData.lastName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="login-form-field">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            required
                            className="login-input"
                            placeholder="Enter new password"
                            value={formData.newPassword}
                            onChange={handleChange}
                        />
                        <small className="password-requirements">
                            Password must be at least 8 characters and include uppercase, lowercase, number, and special character
                        </small>
                    </div>
                    <div className="login-form-field">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            className="login-input"
                            placeholder="Confirm new password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`login-submit-button ${loading ? 'button-disabled' : ''}`}
                    >
                        {loading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword; 