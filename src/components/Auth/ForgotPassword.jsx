import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Mail, User, Lock, Eye, EyeOff, Loader } from 'lucide-react';
import authService, { AUTH_ERRORS } from '../../services/authService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { GlassCard } from '../ui/GlassCard';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        lastName: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-background/80">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <GlassCard className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">Reset Your Password</h1>
                        <p className="text-muted-foreground">Enter your details to reset your password</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-foreground">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="lastName" className="text-sm font-medium text-foreground">
                                Last Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    required
                                    placeholder="Enter your last name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Enter new password"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Confirm new password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full gap-2"
                        >
                            {loading && <Loader className="w-4 h-4 animate-spin" />}
                            {loading ? 'Resetting Password...' : 'Reset Password'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-muted-foreground">
                            Remember your password?{' '}
                            <button
                                onClick={() => navigate('/login')}
                                className="text-primary hover:underline font-medium"
                            >
                                Back to Login
                            </button>
                        </p>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;