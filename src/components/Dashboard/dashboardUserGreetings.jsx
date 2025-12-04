import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Sun, Moon, Clock, CloudSun } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

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
            <GlassCard className="p-6">
                <div className="flex items-center gap-4 mb-4">
                    <motion.div
                        className={`p-4 rounded-full bg-gradient-to-br ${greeting.gradient}`}
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                            duration: 0.6,
                            ease: "easeOut",
                            delay: 0.2
                        }}
                    >
                        <GreetingIcon className="w-6 h-6 text-white" />
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
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <div className="p-2 rounded-lg bg-primary/20">
                            <Sun className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Today's Goal</p>
                            <p className="text-foreground font-semibold">$50.00</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <div className="p-2 rounded-lg bg-primary/20">
                            <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Streak</p>
                            <p className="text-foreground font-semibold">7 days</p>
                        </div>
                    </div>
                </motion.div>
            </GlassCard>
        </motion.div>
    );
};

export default DashboardUserGreetings;