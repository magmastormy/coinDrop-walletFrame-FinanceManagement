import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Sun, Moon, Clock, CloudSun } from 'lucide-react';

const DashboardUserGreetings = () => {
    const { user } = useSelector(state => state.auth);
    const currentHour = new Date().getHours();

    const getGreeting = () => {
        if (currentHour >= 5 && currentHour < 12) {
            return {
                text: 'Good Morning',
                icon: Sun,
                gradient: 'from-yellow-400 to-orange-300'
            };
        } else if (currentHour >= 12 && currentHour < 17) {
            return {
                text: 'Good Afternoon',
                icon: CloudSun,
                gradient: 'from-blue-400 to-cyan-300'
            };
        } else if (currentHour >= 17 && currentHour < 21) {
            return {
                text: 'Good Evening',
                icon: Clock,
                gradient: 'from-indigo-400 to-purple-300'
            };
        } else {
            return {
                text: 'Good Night',
                icon: Moon,
                gradient: 'from-purple-400 to-pink-300'
            };
        }
    };

    const greeting = getGreeting();
    const GreetingIcon = greeting.icon;
    const firstName = user?.firstName?.split(' ')[0] || 'Guest';
    const lastName = user?.lastName?.split(' ')[0] || '';

    const getRandomMotivationalQuote = () => {
        const quotes = [
            "Track your spending today for a better tomorrow.",
            "Small savings add up to big dreams.",
            "Your financial future starts with today's decisions.",
            "Every penny saved is a penny earned.",
            "Invest in yourself and your dreams.",
            "Financial freedom is a journey, not a destination."
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <div
                style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-surface-1)',
                    padding: '24px',
                }}
            >
                <div className="flex items-center gap-4 mb-4">
                    <motion.div
                        initial={{ scale: 0.9, rotate: -6 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                            duration: 0.4,
                            ease: "easeOut",
                            delay: 0.1
                        }}
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '9999px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface-2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-text-secondary)',
                            flexShrink: 0,
                        }}
                    >
                        <GreetingIcon className="w-6 h-6" strokeWidth={1.5} />
                    </motion.div>
                    <motion.h2
                        className="text-2xl font-bold text-foreground"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                    >
                        {greeting.text}, {firstName} {lastName}!
                    </motion.h2>
                </div>
                <motion.p
                    className="text-muted-foreground mb-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                >
                    {getRandomMotivationalQuote()}
                </motion.p>
                <motion.div
                    className="grid grid-cols-2 gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                >
                    <div
                        className="flex items-center gap-3 p-3"
                        style={{
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface-1)'
                        }}
                    >
                        <div
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface-2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-text-secondary)'
                            }}
                        >
                            <Sun className="w-4 h-4" strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Today&apos;s Goal</p>
                            <p className="text-foreground font-semibold">$50.00</p>
                        </div>
                    </div>
                    <div
                        className="flex items-center gap-3 p-3"
                        style={{
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface-1)'
                        }}
                    >
                        <div
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-surface-2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-text-secondary)'
                            }}
                        >
                            <Clock className="w-4 h-4" strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Streak</p>
                            <p className="text-foreground font-semibold">7 days</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default DashboardUserGreetings;
