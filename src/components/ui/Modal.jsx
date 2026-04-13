import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from './Button';
import FocusTrap from '../Common/FocusTrap';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    className,
    size = 'medium',
    position = 'center',
    backdropVariant = 'blur',
    allowBackdropClick = true
}) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const sizeClasses = {
        small: 'max-w-sm',
        medium: 'max-w-lg',
        large: 'max-w-2xl',
        fullscreen: 'max-w-full max-h-full'
    };

    const positionClasses = {
        center: 'items-center justify-center',
        top: 'items-start justify-center pt-12',
        bottom: 'items-end justify-center pb-12'
    };

    const backdropClasses = {
        blur: '',
        dark: '',
        light: '',
        gradient: ''
    };

    const backdropStyle = (() => {
        switch (backdropVariant) {
            case 'dark':
                return { background: 'var(--color-overlay-dark)' };
            case 'light':
                return { background: 'var(--color-overlay-light)' };
            case 'gradient':
                return { background: 'var(--color-overlay-medium)' };
            default:
                return { background: 'var(--color-overlay-default)' };
        }
    })();

    const getPositionVariants = () => {
        switch (position) {
            case 'top':
                return {
                    initial: { opacity: 0, y: -50, scale: 0.9 },
                    animate: { opacity: 1, y: 0, scale: 1 },
                    exit: { opacity: 0, y: -50, scale: 0.9 }
                };
            case 'bottom':
                return {
                    initial: { opacity: 0, y: 50, scale: 0.9 },
                    animate: { opacity: 1, y: 0, scale: 1 },
                    exit: { opacity: 0, y: 50, scale: 0.9 }
                };
            default:
                return {
                    initial: { opacity: 0, scale: 0.9, y: 20 },
                    animate: { opacity: 1, scale: 1, y: 0 },
                    exit: { opacity: 0, scale: 0.9, y: 20 }
                };
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <FocusTrap isActive={isOpen}>
                    <div className={cn(
                        "fixed inset-0 z-50 flex p-4 sm:p-6",
                        positionClasses[position]
                    )}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={allowBackdropClick ? onClose : undefined}
                            className={cn(
                                "absolute inset-0",
                                backdropClasses[backdropVariant]
                            )}
                            style={backdropStyle}
                            aria-hidden="true"
                        />
                        <motion.div
                            {...getPositionVariants()}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 300,
                                duration: 0.4
                            }}
                            className={cn(
                                "relative w-full overflow-hidden p-6 shadow-2xl",
                                sizeClasses[size],
                                size === 'fullscreen' && 'h-full',
                                className
                            )}
                            style={{
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface-1)',
                            }}
                            whileHover={{ boxShadow: "var(--shadow-lg)" }}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="modal-title"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 id="modal-title" className="text-xl font-display font-bold text-foreground">{title}</h2>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onClose}
                                        className="h-8 w-8 rounded-full transition-all duration-200"
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        aria-label="Close modal"
                                    >
                                        <X className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
                                    </Button>
                                </motion.div>
                            </div>
                            <motion.div 
                                className="relative"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                            >
                                {children}
                            </motion.div>
                        </motion.div>
                    </div>
                </FocusTrap>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default Modal;
