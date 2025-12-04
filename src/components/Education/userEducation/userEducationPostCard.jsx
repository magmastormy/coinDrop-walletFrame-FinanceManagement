import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Image as ImageIcon, Calendar, MoreVertical, Edit, Trash2 } from 'lucide-react';
import UserEducationFullDetailModal from './userEducationFullDetailModal';
import { useTheme } from '../../../theme/ThemeContext';

import EducationImageGallery from '../educationImageGallery';
import { GlassCard } from '../../ui/GlassCard';
import { Button } from '../../ui/Button';

const UserEducationPostCard = ({ post, onLike, onComment, currentUser, onEdit, onDelete, viewMode }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [showImageGallery, setShowImageGallery] = useState(false);
    const [showFullContent, setShowFullContent] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [readProgress, setReadProgress] = useState(
        post.readProgress?.[currentUser?.id] || 0
    );
    const { theme } = useTheme();

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

    const handleCardClick = () => {
        setShowFullContent(true);
        setReadProgress(100);
    };

    // Calculate analytics data
    const totalViews = post.views || 0;
    const totalLikes = Array.isArray(post.likes) ? post.likes.length : 0;
    const totalComments = Array.isArray(post.comments) ? post.comments.length : 0;
    const engagementRate = totalViews > 0 ? Math.round(((totalLikes + totalComments) / totalViews) * 100) : 0;

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

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="h-full"
        >
            <GlassCard
                className="flex flex-col h-full cursor-pointer overflow-hidden p-0"
                onClick={() => setIsModalOpen(true)}
            >
                {/* Image Section */}
                <div className="relative h-48 md:h-52 bg-muted">
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
                                <div className="absolute bottom-3 right-3 bg-black/60 text-white rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5">
                                    <ImageIcon className="w-3 h-3" />
                                    {post.images.length}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
                        </div>
                    )}
                </div>

                <div className="p-6 flex-grow">
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
                                    <Calendar className="w-3 h-3" />
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
                                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                                {anchorEl && (
                                    <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[120px] z-10">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditClick();
                                            }}
                                            className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick();
                                            }}
                                            className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold mb-3 text-foreground">
                        {post.title}
                    </h3>

                    {/* Content Preview */}
                    <div
                        className="text-muted-foreground text-sm mb-3 line-clamp-5 overflow-hidden education-content-preview"
                        dangerouslySetInnerHTML={{ __html: post.details }}
                        onClick={() => setIsModalOpen(true)}
                    />

                    {/* Read Progress */}
                    {readProgress > 0 && (
                        <div className="w-full mt-3">
                            <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${readProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center px-6 py-4 border-t border-border">
                    <div className="flex gap-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onLike(post._id);
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${isLiked
                                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                                : 'text-muted-foreground hover:bg-muted'
                                }`}
                            title={isLiked ? "Unlike" : "Like"}
                        >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                            {Array.isArray(post.likes) && post.likes.length > 0 && (
                                <span className="text-sm">{post.likes.length}</span>
                            )}
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowComments(!showComments);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-muted-foreground hover:bg-muted"
                            title="Comments"
                        >
                            <MessageCircle className="w-4 h-4" />
                            {Array.isArray(post.comments) && post.comments.length > 0 && (
                                <span className="text-sm">{post.comments.length}</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="px-6 py-4 border-t border-border bg-muted/30">
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
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-2"
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
            </GlassCard>
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
    currentUser: PropTypes.object
};

export default UserEducationPostCard;
