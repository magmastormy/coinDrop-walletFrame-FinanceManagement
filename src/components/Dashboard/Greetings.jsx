import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Sun, Moon, CloudSun } from 'lucide-react';

const Greetings = () => {
    const { user } = useSelector(state => state.auth);
    const currentHour = new Date().getHours();

    const getGreeting = () => {
        if (currentHour >= 5 && currentHour < 12) return { text: 'Good Morning', icon: Sun };
        if (currentHour >= 12 && currentHour < 18) return { text: 'Good Afternoon', icon: CloudSun };
        return { text: 'Good Evening', icon: Moon };
    };

    const { text, icon: Icon } = getGreeting();
    const firstName = user?.firstName?.split(' ')[0] || 'User';

    return (
        <div className="mb-8">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
            >
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">
                        {text}, <span className="text-primary">{firstName}</span>
                    </h1>
                    <p className="text-muted-foreground">Here&apos;s your financial overview for today.</p>
                </div>
            </motion.div>
        </div>
    );
};

export default Greetings;
