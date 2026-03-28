import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader } from 'lucide-react';
import { loginUser } from '../../services/authService';
import { Input } from '../ui/Input';
import { SkeletonForm } from '../ui/LoadingSkeleton';

const UserLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [cooldownTime, setCooldownTime] = useState(0);

    // Cooldown timer effect
    useEffect(() => {
        if (cooldownTime > 0) {
            const timer = setTimeout(() => {
                setCooldownTime(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldownTime]);

    const validateField = (name, value) => {
        let error = '';
        
        if (name === 'email') {
            if (!value) {
                error = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                error = 'Please enter a valid email address';
            }
        } else if (name === 'password') {
            if (!value) {
                error = 'Password is required';
            } else if (value.length < 6) {
                error = 'Password must be at least 6 characters';
            }
        }
        
        return error;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Update form data
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Validate field in real-time
        const fieldError = validateField(name, value);
        setFieldErrors(prev => ({
            ...prev,
            [name]: fieldError
        }));
        
        // Clear general error if field errors are fixed
        if (fieldError === '' && Object.values(fieldErrors).every(err => err === '')) {
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate all fields
        const emailError = validateField('email', formData.email);
        const passwordError = validateField('password', formData.password);
        
        const newFieldErrors = {
            email: emailError,
            password: passwordError
        };
        
        setFieldErrors(newFieldErrors);
        
        // Check if there are any errors
        if (emailError || passwordError) {
            setError('Please fix the errors below');
            return;
        }
        
        try {
            setError('');
            setLoading(true);

            const response = await loginUser(formData);

            if (response.accessToken) {
                navigate('/dashboard');
            } else {
                throw new Error('Authentication failed: No tokens received');
            }
        } catch (err) {
            // Handle cooldown errors
            if (err.message && err.message.includes('Please wait')) {
                const seconds = parseInt(err.message.match(/\d+/)?.[0] || '10');
                setCooldownTime(seconds);
                setError(err.message);
            } else {
                setError(err.response?.data?.message || err.details || err.message || 'Failed to sign in. Please check your credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                background: 'var(--color-bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '15vw',
                    color: 'var(--color-text-primary)',
                    opacity: 0.04,
                    zIndex: 0,
                    pointerEvents: 'none',
                    lineHeight: 1
                }}
            >
                COINDROP
            </div>

            <div aria-live="polite" className="sr-only">
                {error && `Error: ${error}`}
            </div>

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    maxWidth: '400px',
                    background: 'var(--color-surface-1)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--card-pad-lg, 20px)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            fontSize: '18px',
                            color: 'var(--color-text-primary)',
                            marginBottom: '8px'
                        }}
                    >
                        CoinDrop
                    </div>
                    <div
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontWeight: 600,
                            fontSize: '16px',
                            color: 'var(--color-text-primary)'
                        }}
                    >
                        Welcome back
                    </div>
                </div>

                {error && (
                    <div
                        className="mb-6 p-4 rounded-lg"
                        style={{
                            border: '1px solid rgba(239,71,111,0.25)',
                            background: 'rgba(239,71,111,0.10)',
                            color: 'var(--color-negative)'
                        }}
                        role="alert"
                        aria-live="assertive"
                    >
                        {error}
                    </div>
                )}

                {loading ? (
                    <SkeletonForm />
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="email"
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: 'var(--color-text-secondary)'
                                }}
                            >
                                Email
                            </label>
                            <div className="relative">
                                <Mail
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                                    strokeWidth={1.5}
                                    style={{ color: 'var(--color-text-muted)' }}
                                />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="pl-9"
                                    style={{}}
                                    autoComplete="email"
                                    error={fieldErrors.email}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="password"
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: 'var(--color-text-secondary)'
                                }}
                            >
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                                    strokeWidth={1.5}
                                    style={{ color: 'var(--color-text-muted)' }}
                                />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="pl-9"
                                    style={{}}
                                    autoComplete="current-password"
                                    error={fieldErrors.password}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || cooldownTime > 0}
                            style={{
                                background: cooldownTime > 0 ? '#94a3b8' : 'var(--color-gold)',
                                color: 'var(--color-bg-primary)',
                                height: '40px',
                                width: '100%',
                                fontFamily: 'var(--font-display)',
                                fontWeight: 600,
                                fontSize: '14px',
                                textTransform: 'uppercase',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                cursor: cooldownTime > 0 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {cooldownTime > 0 ? `Please wait ${cooldownTime}s...` : (loading ? 'Signing in...' : 'Sign in')}
                        </button>
                    </form>
                )}

                <div className="mt-4 space-y-2 text-center text-sm">
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Don&apos;t have an account?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            style={{
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--color-gold)'
                            }}
                        >
                            Sign up
                        </button>
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Forgot your password?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/forgot-password')}
                            style={{
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--color-gold)'
                            }}
                        >
                            Reset Password
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserLogin;
