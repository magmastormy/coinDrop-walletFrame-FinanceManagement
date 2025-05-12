import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService, { AUTH_ERRORS } from '../../services/authService';
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
        
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error(AUTH_ERRORS.PASSWORD_MISMATCH);
            return;
        }

        if (formData.newPassword.length < 8) {
            toast.error(AUTH_ERRORS.PASSWORD_REQUIREMENTS);
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(formData.newPassword)) {
            toast.error(AUTH_ERRORS.PASSWORD_REQUIREMENTS);
            return;
        }

        if (!formData.email.includes('@')) {
            toast.error(AUTH_ERRORS.VALIDATION_ERROR);
            return;
        }
        
        try {
            setLoading(true);
            await authService.forgotPassword(formData);
            toast.success('Password reset successful! Please login with your new password.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.error || AUTH_ERRORS.SERVER_ERROR);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Reset Your Password</h2>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="login-form-field">
                        <label htmlFor="email">Email Address</label>
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
                <div className="login-footer">
                    <p className="login-signup-link">
                        Remember your password?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="login-link"
                        >
                            Back to Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword; 