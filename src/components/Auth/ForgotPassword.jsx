import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Button from '../ui/Button';

const ForgotPassword = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg-primary)' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
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
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/15 text-amber-500 mb-4">
                            <AlertTriangle className="w-7 h-7" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Reset Password Disabled</h1>
                        <p className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                            This flow is temporarily disabled while a secure token-based reset process is being implemented.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-100">
                            Contact support if you need immediate access recovery.
                        </div>
                        <Button
                            type="button"
                            className="w-full gap-2"
                            onClick={() => navigate('/login')}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
