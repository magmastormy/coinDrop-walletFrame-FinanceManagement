import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { registerUser } from '../../services/authService';
import './styles/userRegistrationStyles.css';

const UserRegistration = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: ''
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
        
        // Validation checks
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            toast.error('Password must include uppercase, lowercase, number, and special character');
            return;
        }

        if (!formData.email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }
        
        try {
            setLoading(true);
            console.log('📝 Registration attempt:', formData.email);
            await registerUser(formData);
            console.log('✅ Registration successful, redirecting...');
            toast.success('Account created successfully! Redirecting to dashboard...');
            navigate('/dashboard');
        } catch (err) {
            console.error('❌ Registration failed:', err);
            // Handle specific error cases
            if (err.response?.data?.details) {
                const errors = err.response.data.details;
                errors.forEach(error => {
                    toast.error(error.msg);
                });
            } else if (err.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error(err.message || 'Failed to create account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="registration-container">
            <div className="registration-card">
                <div className="registration-header">
                    <h2 className="registration-title">
                        Create your account
                    </h2>
                    <p className="registration-subtitle">
                        Or{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="auth-link"
                        >
                            sign in to your account
                        </button>
                    </p>
                </div>

                <form className="registration-form" onSubmit={handleSubmit}>
                    <div className="registration-form-fields-container">
                        <div className="registration-form-grid">
                            <div className="form-field">
                                <label htmlFor="firstName" className="sr-only">First Name</label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    required
                                    className="form-input"
                                    placeholder="First Name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-field">
                                <label htmlFor="lastName" className="sr-only">Last Name</label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    required
                                    className="form-input"
                                    placeholder="Last Name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="form-input"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="username" className="sr-only">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="form-input"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="form-input"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <small className="password-requirements">
                                Password must be at least 8 characters and include uppercase, lowercase, number, and special character
                            </small>
                        </div>

                        <div className="form-field">
                            <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                className="form-input"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="phone" className="sr-only">Phone Number</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                className="form-input"
                                placeholder="Phone Number"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`registration-submit-button ${loading ? 'button-disabled' : ''}`}
                        >
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserRegistration;