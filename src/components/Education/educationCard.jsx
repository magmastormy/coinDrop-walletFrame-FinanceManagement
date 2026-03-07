import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Image as ImageIcon, Images, Eye, Check } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import EducationRenderer from './educationRenderer';
import EducationFullDetailModal from './educationFullDetailModal';
import { cn } from '../../lib/utils';

const EducationCard = ({ education, onLike, onComment, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(
        education.likes?.includes(currentUser?._id) ||
        education.likes?.includes(currentUser?.id)
    );
    const [readProgress, setReadProgress] = useState(
        education.readProgress?.[currentUser?.id] || 0
    );

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleLike = (e) => {
        e.stopPropagation();
        setIsLiked(!isLiked);
        if (onLike) {
            onLike(education._id);
        }
    };

    const handleReadMore = () => {
        setReadProgress(100);
        setIsModalOpen(true);
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const postDate = new Date(date);
        const diffInSeconds = Math.floor((now - postDate) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;

        const diffInYears = Math.floor(diffInMonths / 12);
        return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
    };

    return (
        <>
            <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
            >
                <GlassCard
                    className="h-full flex flex-col overflow-hidden group cursor-pointer"
                    onClick={handleReadMore}
                >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                        {education.images && education.images.length > 0 ? (
                            <>
                                <img
                                    src={education.images[0].url}
                                    alt={education.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    loading="lazy"
                                />
                                {education.images.length > 1 && (
                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                                        <Images className="w-3 h-3" />
                                        {education.images.length}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                <ImageIcon className="w-12 h-12 text-muted-foreground opacity-40" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2 text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground font-medium">
                                <span>{education.author?.username || 'WalletFrame'}</span>
                                {readProgress === 100 && (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                )}
                            </div>
                            <span className="text-muted-foreground">
                                {education.createdAt ? getTimeAgo(education.createdAt) : formatDate(education.date)}
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                            {education.title}
                        </h3>

                        {/* Content Preview */}
                        <div className="text-sm text-muted-foreground mb-3 line-clamp-10 flex-1 overflow-hidden">
                            <EducationRenderer content={education.details} />
                        </div>

                        {/* Read Progress */}
                        {readProgress > 0 && (
                            <div className="mb-3">
                                <div className="flex items-center justify-between mb-1 text-xs">
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Eye className="w-3 h-3" />
                                        {readProgress === 100 ? 'Read' : 'Continue reading'}
                                    </span>
                                    <span className="text-muted-foreground">{readProgress}%</span>
                                </div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-300"
                                        style={{ width: `${readProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 pt-3 border-t border-white/10">
                            <button
                                onClick={handleLike}
                                className={cn(
                                    "flex items-center gap-1 text-sm transition-colors",
                                    isLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                                {education.likes?.length > 0 && (
                                    <span>{education.likes.length}</span>
                                )}
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleReadMore();
                                }}
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" />
                                {education.comments?.length > 0 && (
                                    <span>{education.comments.length}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            <EducationFullDetailModal
                education={education}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onLike={handleLike}
                onComment={onComment}
                currentUser={currentUser}
            />
        </>
    );
};

export default EducationCard;
