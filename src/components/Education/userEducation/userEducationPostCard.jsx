import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Image as ImageIcon, Calendar, MoreVertical, Edit, Trash2 } from 'lucide-react';
import UserEducationFullDetailModal from './userEducationFullDetailModal';
import { cn } from '../../../lib/utils';

import EducationImageGallery from '../educationImageGallery';
import Button from '../../ui/Button';
import SafeHtml from '../../Common/SafeHtml';

const UserEducationPostCard = ({
    post,
    onLike,
    onComment,
    currentUser,
    onEdit,
    onDelete,
    viewMode = 'grid',
    bentoVariant = 'standard'
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [showImageGallery, setShowImageGallery] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [readProgress, setReadProgress] = useState(
        post.readProgress?.[currentUser?.id] || 0
    );

    if (!post) {
        return null;
    }

    const isAuthor = currentUser?._id === post.user?._id || currentUser?.id === post.user;

    const handleMenuClick = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleEditClick = () => {
        handleMenuClose();
        onEdit(post);
    };

    const handleDeleteClick = () => {
        handleMenuClose();
        onDelete(post._id);
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            onComment(post._id, newComment);
            setNewComment('');
        }
    };

    // Calculate analytics data
    const isLiked = Array.isArray(post.likes) && (post.likes.includes(currentUser?._id) || post.likes.includes(currentUser?.id));

    // Calculate how long ago the post was created
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

    const isListMode = viewMode === 'list';
    const isFeatureCard = !isListMode && (bentoVariant === 'feature' || bentoVariant === 'tall');
    const isCompactCard = !isListMode && bentoVariant === 'compact';
    const isWideCard = !isListMode && bentoVariant === 'wide';

    const imageClassName = cn(
        "relative overflow-hidden bg-muted",
        isListMode ? "h-52 md:h-auto md:w-72 md:flex-shrink-0" : "h-48",
        isFeatureCard && "h-56",
        isCompactCard && "h-40",
        isWideCard && "h-44"
    );

    const previewClampClass = cn(
        "education-content-preview text-sm text-muted-foreground overflow-hidden",
        isListMode ? "line-clamp-4" : "line-clamp-6",
        isFeatureCard && "line-clamp-8",
        isCompactCard && "line-clamp-4"
    );

    return (
        <motion.div
            whileHover={isListMode ? { y: -2 } : { scale: 1.01 }}
            className="h-full"
        >
            <div
                className={cn(
                    "h-full cursor-pointer overflow-hidden p-0",
                    isListMode ? "flex flex-col md:flex-row" : "flex flex-col"
                )}
                style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-surface-1)',
                }}
                onClick={() => {
                    setReadProgress(100);
                    setIsModalOpen(true);
                }}
            >
                {/* Image Section */}
                <div className={imageClassName}>
                    {post.images && post.images.length > 0 ? (
                        <>
                            <img
                                src={post.images[0].url}
                                alt={post.title}
                                className="w-full h-full object-cover object-center"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowImageGallery(true);
                                }}
                            />
                            {post.images.length > 1 && (
                                <div
                                    className="absolute bottom-3 right-3 rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5"
                                    style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-primary)' }}
                                >
                                    <ImageIcon className="w-[18px] h-[18px]" strokeWidth={1.5} />
                                    {post.images.length}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-muted-foreground/80" aria-hidden="true" />
                        </div>
                    )}
                </div>

                <div className="flex flex-grow flex-col p-5">
                    {/* Author & Date */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                {post.user?.profilePicture ? (
                                    <img
                                        src={post.user.profilePicture}
                                        alt={post.user?.username || 'User'}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-primary font-semibold text-sm">
                                        {(post.author?.username || 'A')[0].toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-foreground">
                                    {post.author?.username || 'Anonymous User'}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="w-[18px] h-[18px]" strokeWidth={1.5} />
                                    {post.createdAt ? getTimeAgo(post.createdAt) : new Date(post.date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {isAuthor && (
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMenuClick(e);
                                    }}
                                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
                                >
                                    <MoreVertical className="w-[18px] h-[18px]" strokeWidth={1.5} />
                                </button>
                                {anchorEl && (
                                    <div className="absolute right-0 top-full z-10 mt-1 min-w-[120px] rounded-lg border border-border bg-card py-1 shadow-lg">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditClick();
                                            }}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
                                        >
                                            <Edit className="w-[18px] h-[18px]" strokeWidth={1.5} />
                                            Edit
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick();
                                            }}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-destructive hover:bg-muted"
                                        >
                                            <Trash2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className={cn(
                        "mb-3 line-clamp-2 font-semibold text-foreground",
                        isFeatureCard ? "text-xl" : "text-lg"
                    )}>
                        {post.title}
                    </h3>

                    {/* Content Preview */}
                    <SafeHtml
                        html={post.details}
                        className={cn(previewClampClass, "mb-3")}
                        onClick={() => setIsModalOpen(true)}
                    />

                    {/* Read Progress */}
                    {readProgress > 0 && (
                        <div className="mt-3 w-full">
                            <div
                                className="h-1 rounded-full overflow-hidden"
                                style={{ background: 'var(--color-border)' }}
                            >
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-300"
                                    style={{ width: `${readProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderTop: '1px solid var(--color-border)' }}
                >
                    <div className="flex gap-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onLike(post._id);
                            }}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${isLiked
                                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                                : 'text-muted-foreground hover:bg-muted'
                                }`}
                            title={isLiked ? "Unlike" : "Like"}
                        >
                            <Heart className={`w-[18px] h-[18px] ${isLiked ? 'fill-current' : ''}`} strokeWidth={1.5} />
                            {Array.isArray(post.likes) && post.likes.length > 0 && (
                                <span className="text-sm">{post.likes.length}</span>
                            )}
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowComments(!showComments);
                            }}
                            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted"
                            title="Comments"
                        >
                            <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.5} />
                            {Array.isArray(post.comments) && post.comments.length > 0 && (
                                <span className="text-sm">{post.comments.length}</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div
                        className="px-5 py-4"
                        style={{
                            borderTop: '1px solid var(--color-border)',
                            background: 'var(--color-surface-2)',
                        }}
                    >
                        {post.comments?.map((comment, index) => (
                            <div key={`${post._id}-comment-${index}`} className="mb-3">
                                <p className="font-semibold text-sm text-foreground">{comment.author?.username}</p>
                                <p className="text-sm text-muted-foreground">{comment.content}</p>
                            </div>
                        ))}
                        <form onSubmit={handleCommentSubmit} className="mt-4">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="mb-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                                type="submit"
                                disabled={!newComment.trim()}
                                onClick={(e) => e.stopPropagation()}
                            >
                                Post
                            </Button>
                        </form>
                    </div>
                )}

                {showImageGallery && post.images && post.images.length > 0 && (
                    <EducationImageGallery
                        images={post.images.map(img => typeof img === 'string' ? img : img.url)}
                        onClose={() => setShowImageGallery(false)}
                    />
                )}

                {/* Full Content Modal */}
                <UserEducationFullDetailModal
                    post={post}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onLike={onLike}
                    onComment={onComment}
                    currentUser={currentUser}
                />
            </div>
        </motion.div>
    );
};

UserEducationPostCard.propTypes = {
    post: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        details: PropTypes.string.isRequired,
        createdAt: PropTypes.string,
        user: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                _id: PropTypes.string,
                username: PropTypes.string,
                profilePicture: PropTypes.string
            })
        ]),
        author: PropTypes.shape({
            username: PropTypes.string
        }),
        likes: PropTypes.array,
        comments: PropTypes.array,
        images: PropTypes.array
    }).isRequired,
    onLike: PropTypes.func.isRequired,
    onComment: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    currentUser: PropTypes.object,
    viewMode: PropTypes.oneOf(['grid', 'list']),
    bentoVariant: PropTypes.oneOf(['feature', 'standard', 'compact', 'wide', 'tall'])
};

export default UserEducationPostCard;
