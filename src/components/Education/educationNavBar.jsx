import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { GraduationCap, Edit, Heart } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { cn } from '../../lib/utils';

const EducationNavBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const { educations } = useSelector(state => state.education);

    const [newContentCount, setNewContentCount] = useState(0);
    const [savedCount, setSavedCount] = useState(0);
    const [myPostsCount, setMyPostsCount] = useState(0);

    const isUserEducation = location.pathname.includes('/user-education');

    useEffect(() => {
        if (educations && educations.length > 0) {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const newPosts = educations.filter(post =>
                new Date(post.createdAt) > oneWeekAgo
            ).length;
            setNewContentCount(newPosts);

            const saved = educations.filter(post =>
                post.bookmarkedBy?.includes(user?.id)
            ).length;
            setSavedCount(saved);

            const userPosts = educations.filter(post =>
                post.user === user?.id || post.user?._id === user?.id
            ).length;
            setMyPostsCount(userPosts);
        }
    }, [educations, user]);

    const handleNavigation = (path) => {
        navigate(path);
    };

    const navItems = [
        {
            title: 'All Education',
            icon: GraduationCap,
            path: '/education',
            section: 'general'
        },
        {
            title: 'My Education Posts',
            icon: Edit,
            path: '/user-education',
            count: myPostsCount,
            section: 'user'
        },
        {
            title: 'Liked Posts',
            icon: Heart,
            path: '/user-education?filter=liked',
            section: 'user'
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
        >
            <GlassCard className="p-4 h-full">
                <h2 className="text-lg font-semibold text-foreground mb-4 px-2">
                    Education Center
                </h2>

                <nav className="space-y-6">
                    {/* Explore Section */}
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-2">
                            Explore
                        </p>
                        <div className="space-y-1">
                            {navItems
                                .filter(item => item.section === 'general')
                                .map((item, index) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname + location.search === item.path;

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleNavigation(item.path)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                                isActive
                                                    ? "bg-primary/20 text-primary"
                                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                            )}
                                        >
                                            <Icon className="w-5 h-5 flex-shrink-0" />
                                            <span className="flex-1 text-left">{item.title}</span>
                                            {item.count > 0 && (
                                                <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                                                    {item.count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                        </div>
                    </div>

                    {/* My Content Section */}
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-2">
                            My Content
                        </p>
                        <div className="space-y-1">
                            {navItems
                                .filter(item => item.section === 'user')
                                .map((item, index) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname + location.search === item.path;

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleNavigation(item.path)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                                isActive
                                                    ? "bg-primary/20 text-primary"
                                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                            )}
                                        >
                                            <Icon className="w-5 h-5 flex-shrink-0" />
                                            <span className="flex-1 text-left">{item.title}</span>
                                            {item.count > 0 && (
                                                <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                                                    {item.count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
                </nav>
            </GlassCard>
        </motion.div>
    );
};

export default EducationNavBar;
