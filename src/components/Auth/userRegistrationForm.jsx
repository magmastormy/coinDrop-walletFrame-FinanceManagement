import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { User, Mail, Lock, Phone, Eye, EyeOff, Loader } from 'lucide-react';
import { registerUser } from '../../services/authService';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { SkeletonForm } from '../ui/LoadingSkeleton';

const UserRegistration = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        phone: ''
    });
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        strength: 'Very Weak',
        color: '#ef4444'
    });

    const totalSteps = 2;

    const calculatePasswordStrength = (password) => {
        let score = 0;
        
        // Length check
        if (password.length >= 8) score += 25;
        else if (password.length >= 6) score += 10;
        
        // Uppercase check
        if (/[A-Z]/.test(password)) score += 25;
        
        // Lowercase check
        if (/[a-z]/.test(password)) score += 25;
        
        // Number check
        if (/\d/.test(password)) score += 15;
        
        // Special character check
        if (/[@$!%*?&_]/.test(password)) score += 10;
        
        let strength, color;
        if (score >= 90) {
            strength = 'Very Strong';
            color = '#22c55e';
        } else if (score >= 70) {
            strength = 'Strong';
            color = '#10b981';
        } else if (score >= 50) {
            strength = 'Medium';
            color = '#f59e0b';
        } else if (score >= 30) {
            strength = 'Weak';
            color = '#ef4444';
        } else {
            strength = 'Very Weak';
            color = '#ef4444';
        }
        
        return { score, strength, color };
    };

    const validateField = (name, value) => {
        let error = '';
        
        switch (name) {
            case 'firstName':
                if (!value) {
                    error = 'First name is required';
                }
                break;
            case 'lastName':
                if (!value) {
                    error = 'Last name is required';
                }
                break;
            case 'email':
                if (!value) {
                    error = 'Email is required';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    error = 'Please enter a valid email address';
                }
                break;
            case 'username':
                if (!value) {
                    error = 'Username is required';
                } else if (value.length < 3) {
                    error = 'Username must be at least 3 characters';
                }
                break;
            case 'password':
                if (!value) {
                    error = 'Password is required';
                } else if (value.length < 8) {
                    error = 'Password must be at least 8 characters';
                } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{8,}$/.test(value)) {
                    error = 'Password must include uppercase, lowercase, number, and special character';
                }
                break;
            case 'confirmPassword':
                if (!value) {
                    error = 'Please confirm your password';
                } else if (value !== formData.password) {
                    error = 'Passwords do not match';
                }
                break;
            case 'phone':
                if (!value) {
                    error = 'Phone number is required';
                } else if (!/^\d{10,15}$/.test(value.replace(/[^\d]/g, ''))) {
                    error = 'Please enter a valid phone number';
                }
                break;
            default:
                break;
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
        
        // Calculate password strength if password changes
        if (name === 'password') {
            const strength = calculatePasswordStrength(value);
            setPasswordStrength(strength);
            
            // Also validate confirm password
            const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword);
            setFieldErrors(prev => ({
                ...prev,
                confirmPassword: confirmPasswordError
            }));
        } else if (name === 'confirmPassword') {
            const confirmPasswordError = validateField('confirmPassword', value);
            setFieldErrors(prev => ({
                ...prev,
                confirmPassword: confirmPasswordError
            }));
        }
    };

    const handleNext = () => {
        // Validate current step fields
        const stepFields = currentStep === 1 
            ? ['firstName', 'lastName', 'email', 'username']
            : ['password', 'confirmPassword', 'phone'];
        
        const stepErrors = {};
        stepFields.forEach(field => {
            stepErrors[field] = validateField(field, formData[field]);
        });
        
        setFieldErrors(prev => ({
            ...prev,
            ...stepErrors
        }));
        
        const hasErrors = stepFields.some(field => stepErrors[field] !== '');
        if (!hasErrors) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all fields
        const newFieldErrors = {};
        Object.keys(formData).forEach(field => {
            newFieldErrors[field] = validateField(field, formData[field]);
        });

        setFieldErrors(newFieldErrors);

        // Check if there are any errors
        const hasErrors = Object.values(newFieldErrors).some(error => error !== '');
        if (hasErrors) {
            return;
        }

        try {
            setLoading(true);
            await registerUser(formData);
            toast.success('Account created successfully! Redirecting to dashboard...');
            navigate('/dashboard');
        } catch (err) {
            if (Array.isArray(err?.details)) {
                err.details.forEach(error => {
                    toast.error(error.msg || error.message || 'Validation error');
                });
            } else if (typeof err === 'string') {
                toast.error(err);
            } else if (err?.error) {
                toast.error(err.error);
            } else if (err.response?.data?.details) {
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
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Form Section */}
            <div className="flex items-center justify-center p-4" style={{ background: 'var(--color-bg-primary)' }}>
                {/* ARIA Live Region for Announcements */}
                <div aria-live="polite" className="sr-only">
                    {Object.values(fieldErrors).some(e => e) && 'Please fix the form errors'}
                    {currentStep === 1 && 'Step 1 of 2: Personal Information'}
                    {currentStep === 2 && 'Step 2 of 2: Security'}
                </div>
                
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-2xl"
                >
                    <div
                        style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--color-surface-1)',
                            padding: '32px',
                        }}
                    >
                        <div className="text-center mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Create your account</h1>
                            <p className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                Or{' '}
                                <button
                                    onClick={() => navigate('/login')}
                                    className="font-bold underline"
                                    style={{ color: 'var(--color-gold)' }}
                                >
                                    sign in to your account
                                </button>
                            </p>
                        </div>

                        {/* Step Indicator */}
                        <div 
                            className="flex items-center justify-center mb-8"
                            role="navigation"
                            aria-label="Registration progress"
                        >
                            <div className="flex items-center space-x-4" role="list">
                                <div className="flex flex-col items-center" role="listitem">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${currentStep === 1 ? 'bg-primary text-white' : ''}`}
                                        style={currentStep !== 1 ? { background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' } : undefined}
                                        aria-current={currentStep === 1 ? 'step' : undefined}
                                    >
                                        1
                                    </div>
                                    <span className="mt-2 text-xs font-medium">Personal Info</span>
                                </div>
                                <div
                                    className={`h-1 flex-1 ${currentStep >= 2 ? 'bg-primary' : ''}`}
                                    style={currentStep < 2 ? { background: 'var(--color-border)' } : undefined}
                                    aria-hidden="true"
                                ></div>
                                <div className="flex flex-col items-center" role="listitem">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${currentStep === 2 ? 'bg-primary text-white' : ''}`}
                                        style={currentStep !== 2 ? { background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' } : undefined}
                                        aria-current={currentStep === 2 ? 'step' : undefined}
                                    >
                                        2
                                    </div>
                                    <span className="mt-2 text-xs font-medium">Security</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {loading ? (
                                <SkeletonForm />
                            ) : (
                                <>
                                    {/* Step 1: Personal Information */}
                                    {currentStep === 1 && (
                                        <>
                                            {/* Name Fields */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label htmlFor="firstName" className="text-sm font-semibold text-foreground">
                                                        First Name
                                                    </label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} />
                                                        <Input
                                                            id="firstName"
                                                            name="firstName"
                                                            type="text"
                                                            required
                                                            placeholder="First Name"
                                                            value={formData.firstName}
                                                            onChange={handleChange}
                                                            className="pl-10"
                                                            autoComplete="given-name"
                                                            error={fieldErrors.firstName}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="lastName" className="text-sm font-semibold text-foreground">
                                                        Last Name
                                                    </label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} />
                                                        <Input
                                                            id="lastName"
                                                            name="lastName"
                                                            type="text"
                                                            required
                                                            placeholder="Last Name"
                                                            value={formData.lastName}
                                                            onChange={handleChange}
                                                            className="pl-10"
                                                            autoComplete="family-name"
                                                            error={fieldErrors.lastName}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Email */}
                                            <div className="space-y-2">
                                                <label htmlFor="email" className="text-sm font-semibold text-foreground">
                                                    Email address
                                                </label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} />
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        required
                                                        placeholder="Email address"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        className="pl-10"
                                                        autoComplete="email"
                                                        error={fieldErrors.email}
                                                    />
                                                </div>
                                            </div>

                                            {/* Username */}
                                            <div className="space-y-2">
                                                <label htmlFor="username" className="text-sm font-semibold text-foreground">
                                                    Username
                                                </label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} />
                                                    <Input
                                                        id="username"
                                                        name="username"
                                                        type="text"
                                                        required
                                                        placeholder="Username"
                                                        value={formData.username}
                                                        onChange={handleChange}
                                                        className="pl-10"
                                                        autoComplete="username"
                                                        error={fieldErrors.username}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Step 2: Security Information */}
                                    {currentStep === 2 && (
                                        <>
                                            {/* Password */}
                                            <div className="space-y-2">
                                            <label htmlFor="password" className="text-sm font-semibold text-foreground">
                                                Password
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} />
                                                <Input
                                                    id="password"
                                                    name="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    required
                                                    placeholder="Password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    className="pl-10 pr-10"
                                                    autoComplete="new-password"
                                                    error={fieldErrors.password}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                    aria-pressed={showPassword}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded focus:outline-none focus:ring-2 focus:ring-ring text-muted-foreground hover:text-foreground"
                                                >
                                                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Eye className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                                                </button>
                                            </div>
                                            {formData.password && (
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold" style={{ color: passwordStrength.color }}>
                                                            {passwordStrength.strength}
                                                        </span>
                                                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                                            {formData.password.length} characters
                                                        </span>
                                                    </div>
                                                    <div
                                                        className="w-full h-2 rounded-full overflow-hidden"
                                                        style={{ background: 'var(--color-border)' }}
                                                    >
                                                        <div 
                                                            className="h-full rounded-full transition-all duration-300 ease-in-out"
                                                            style={{ 
                                                                width: `${passwordStrength.score}%`,
                                                                backgroundColor: passwordStrength.color
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                                Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&_)
                                            </p>
                                        </div>

                                            {/* Confirm Password */}
                                            <div className="space-y-2">
                                                <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
                                                    Confirm Password
                                                </label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} />
                                                    <Input
                                                        id="confirmPassword"
                                                        name="confirmPassword"
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        required
                                                        placeholder="Confirm Password"
                                                        value={formData.confirmPassword}
                                                        onChange={handleChange}
                                                        className="pl-10 pr-10"
                                                        autoComplete="new-password"
                                                        error={fieldErrors.confirmPassword}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                                        aria-pressed={showConfirmPassword}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded focus:outline-none focus:ring-2 focus:ring-ring text-muted-foreground hover:text-foreground"
                                                    >
                                                        {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Eye className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Phone */}
                                            <div className="space-y-2">
                                                <label htmlFor="phone" className="text-sm font-semibold text-foreground">
                                                    Phone Number
                                                </label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} />
                                                    <Input
                                                        id="phone"
                                                        name="phone"
                                                        type="tel"
                                                        required
                                                        placeholder="Phone Number"
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                        className="pl-10"
                                                        autoComplete="tel"
                                                        error={fieldErrors.phone}
                                                    />
                                                </div>
                                            </div>
                                            </>
                                        )}

                                        {/* Navigation Buttons */}
                                        <div className="flex justify-between">
                                            {currentStep > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={handleBack}
                                                    className="w-1/3"
                                                >
                                                    Back
                                                </Button>
                                            )}
                                            <div className={currentStep > 1 ? "w-2/3 flex justify-end" : "w-full"}>
                                                {currentStep < totalSteps ? (
                                                    <Button
                                                        type="button"
                                                        onClick={handleNext}
                                                        className="w-full"
                                                    >
                                                        Next
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="w-full gap-2"
                                                    >
                                                        {loading && <Loader className="w-4 h-4 animate-spin" />}
                                                        {loading ? 'Creating account...' : 'Create account'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </form>
                    </div>
                </motion.div>
            </div>
            
            {/* Right: Dark Panel */}
            <div className="hidden lg:flex items-center justify-center p-8" style={{ background: 'var(--color-surface-1)' }}>
                <div className="text-center space-y-6">
                    <div className="inline-block">
                        <h2 className="text-3xl font-bold text-foreground mb-3">Join CoinDrip Today</h2>
                        <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>Start your journey to financial freedom</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserRegistration;
