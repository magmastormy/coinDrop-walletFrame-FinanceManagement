import { logError, logInfo } from '../../../utils/logger';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Plus, Loader2, AlertCircle, LayoutGrid, List, Grid,
    ArrowUpDown, RefreshCw, X, ArrowDownAZ
} from 'lucide-react';
import educationService from '../../../services/educationService';
import {
    setEducations,
    setLoading,
    setError,
    addEducation,
    updateEducation,
    deleteEducation
} from '../../../slices/educationSlice';

// Components
import CreateEditEducationPost from './createEditEducationPost';
import UserEducationPostCard from './userEducationPostCard';
import EducationNavBar from '../educationNavBar';
import EducationSearchBar from '../educationSearchBar';
import Button from '../../ui/Button';
import PageHeader from '../../Common/PageHeader';

// Toast notifications
import { toast } from 'react-toastify';

const UserEducationManager = () => {
    const dispatch = useDispatch();
    const { educations, loading, error } = useSelector(state => state.education);
    const { user } = useSelector(state => state.auth);
    const navigate = useNavigate();
    const location = useLocation();
    // UI State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'popular', 'title'
    const [showFilters, setShowFilters] = useState(false);
    const [filterType, setFilterType] = useState('all'); // 'all', 'published', 'draft'

    useEffect(() => {
        if (user?.id) {
            fetchUserEducationPosts();
        }
    }, [user?.id]);

    // Parse URL query parameters for filtering
    useEffect(() => {
        try {
            const params = new URLSearchParams(location.search);
            const filter = params.get('filter');
            if (filter) {
                if (filter === 'liked') {
                    setFilterType('liked');
                } else if (filter === 'history') {
                    setFilterType('history');
                } else {
                    setFilterType('all');
                }
            }
        } catch (error) {
            logError('Error parsing URL parameters:', error);
            setFilterType('all');
        }
    }, [location]);

    const fetchUserEducationPosts = async () => {
        if (!user?.id) return;

        dispatch(setLoading(true));
        try {
            const response = await educationService.getUserEducations(user.id);
            // Extract data from axios response, handling both axios response and plain data
            const educationsData = response?.data || response || [];

            dispatch(setEducations(educationsData));
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    const handleSortChange = (sortOption) => {
        setSortBy(sortOption);
    };

    const handleViewModeChange = () => {
        setViewMode(viewMode === 'grid' ? 'list' : 'grid');
    };

    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    // Filter and sort education posts
    const filteredEducations = (educations || []).filter(post => {
        if (!post) return false;
        // Search filter
        return searchQuery === '' ||
            post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.details?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Sort filtered posts
    const sortedEducations = [...(filteredEducations || [])].sort((a, b) => {
        if (sortBy === 'newest') {
            const aDate = (a.createdAt || a.date) ? new Date(a.createdAt || a.date) : null;
            const bDate = (b.createdAt || b.date) ? new Date(b.createdAt || b.date) : null;
            
            // Validate dates
            const isValidADate = aDate && !isNaN(aDate.getTime());
            const isValidBDate = bDate && !isNaN(bDate.getTime());
            
            if (!isValidADate && !isValidBDate) return 0;
            if (!isValidADate) return sortConfig.direction === 'asc' ? 1 : -1;
            if (!isValidBDate) return sortConfig.direction === 'asc' ? -1 : 1;
            
            return bDate.getTime() - aDate.getTime();
        } else if (sortBy === 'oldest') {
            const aDate = (a.createdAt || a.date) ? new Date(a.createdAt || a.date) : null;
            const bDate = (b.createdAt || b.date) ? new Date(b.createdAt || b.date) : null;
            
            // Validate dates
            const isValidADate = aDate && !isNaN(aDate.getTime());
            const isValidBDate = bDate && !isNaN(bDate.getTime());
            
            if (!isValidADate && !isValidBDate) return 0;
            if (!isValidADate) return sortConfig.direction === 'asc' ? -1 : 1;
            if (!isValidBDate) return sortConfig.direction === 'asc' ? 1 : -1;
            
            return aDate.getTime() - bDate.getTime();
        } else if (sortBy === 'popular') {
            const aPopularity = (a.likes?.length || 0) + (a.comments?.length || 0);
            const bPopularity = (b.likes?.length || 0) + (b.comments?.length || 0);
            return bPopularity - aPopularity;
        } else if (sortBy === 'title') {
            return (a.title || '').localeCompare(b.title || '');
        }
        return 0;
    });

    const bentoSpanPattern = [
        'md:col-span-3 md:row-span-2',
        'md:col-span-3 md:row-span-1',
        'md:col-span-2 md:row-span-1',
        'md:col-span-4 md:row-span-1',
        'md:col-span-2 md:row-span-2',
        'md:col-span-3 md:row-span-1',
        'md:col-span-3 md:row-span-1'
    ];

    const bentoStylePattern = ['feature', 'standard', 'compact', 'wide', 'tall', 'standard', 'wide'];

    const handlePostSubmit = async (postId, postData) => {
        dispatch(setLoading(true));
        try {
            let result;

            if (typeof postId === 'object' && !postData) {
                logInfo("Creating new post with data:", postId);
                result = await educationService.createEducation(postId);
                dispatch(addEducation(result));
                toast.success('Post created successfully');
            } else {
                logInfo("Updating post with ID:", postId, "and data:", postData);
                result = await educationService.updateEducation(postId, postData);
                dispatch(updateEducation(result));
                toast.success('Post updated successfully');
            }

            setEditingPost(null);
            setShowCreateModal(false);
            return result;
        } catch (err) {
            dispatch(setError(err.message));
            toast.error(err.message || 'Failed to save post');
            throw err;
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            setIsLoading(true);

            if (!postId) {
                toast.error('No post ID provided for deletion');
                return;
            }

            // Show confirmation dialog
            const confirmed = window.confirm('Are you sure you want to delete this post?');
            if (!confirmed) {
                return;
            }

            logInfo(`[userEducationManager] Deleting post with ID: ${postId}`);

            // Attempt to delete the post
            await educationService.deleteEducation(postId);

            // Update the UI after successful deletion
            dispatch(deleteEducation(postId));
            toast.success('Post deleted successfully');
        } catch (error) {
            logError('[userEducationManager] Error deleting post:', error);

            // User-friendly error message
            toast.error(error.message || 'Failed to delete post. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async (postId) => {
        try {
            await educationService.likeEducation(postId);
            fetchUserEducationPosts();
            toast.success('Post liked successfully');
        } catch (err) {
            dispatch(setError(err.message));
            toast.error('Failed to like post');
        }
    };

    const handleComment = async (postId, comment) => {
        try {
            if (!postId || !comment) {
                toast.error('Post ID and comment are required');
                return;
            }

            logInfo(`[userEducationManager] Adding comment to post ${postId}: ${comment}`);
            await educationService.addComment(postId, comment);

            // Refresh the posts to show the new comment
            fetchUserEducationPosts();
            toast.success('Comment added successfully');
        } catch (err) {
            logError('[userEducation Manager] Error adding comment:', err);
            dispatch(setError(err.message));
            toast.error(err.message || 'Failed to add comment');
        }
    };

    const handleEditClick = (post) => {
        logInfo("Setting post for editing:", post);
        setEditingPost(post);
        setShowCreateModal(true);
    };

    // Get page title based on filter type
    const getPageTitle = () => {
        if (filterType === 'liked') {
            return 'Liked Education Posts';
        } else if (filterType === 'history') {
            return 'Recently Viewed Posts';
        } else {
            return 'My Education Posts';
        }
    };

    // Get empty state message based on filter type
    const getEmptyStateMessage = () => {
        if (filterType === 'liked') {
            return 'You haven\'t liked any education posts yet.';
        } else if (filterType === 'history') {
            return 'You haven\'t viewed any education posts yet.';
        } else {
            return 'You haven\'t created any education posts yet.';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-row h-full w-full bg-background overflow-hidden">
            {/* Left Sidebar - Fixed width */}
            <div className="w-64 min-w-[250px] h-full overflow-y-auto border-r border-border flex flex-col">
                <div className="flex-grow">
                    <EducationNavBar />
                </div>

                <div className="pt-4 border-t border-border">
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Post
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow h-full w-full flex flex-col overflow-y-hidden p-6">
                <PageHeader
                    title={getPageTitle()}
                    actions={(
                        <div className="flex gap-2 items-center w-full sm:w-auto">
                            <div className="flex-grow max-w-xs">
                                <EducationSearchBar onSearch={handleSearch} />
                            </div>

                            <div className="relative">
                                <ArrowDownAZ className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="h-10 rounded-xl pl-9 pr-8 text-sm text-foreground outline-none transition-all"
                                    style={{
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-surface-2)',
                                        color: 'var(--color-text-primary)',
                                        fontFamily: 'var(--font-body)',
                                    }}
                                    aria-label="Sort my education posts"
                                >
                                    <option value="newest">Newest</option>
                                    <option value="oldest">Oldest</option>
                                    <option value="popular">Most Popular</option>
                                    <option value="title">Title A-Z</option>
                                </select>
                            </div>

                            <button
                                onClick={handleViewModeChange}
                                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                                title="Toggle view mode"
                            >
                                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                            </button>

                            <button
                                onClick={toggleFilters}
                                className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
                                    }`}
                                title="Sort posts"
                            >
                                <ArrowUpDown className="w-5 h-5" />
                            </button>

                            <button
                                onClick={fetchUserEducationPosts}
                                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                                title="Refresh"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                />

                <div className="mt-4 mb-3 text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{sortedEducations?.length || 0}</span> posts
                </div>

                {/* Sort Options */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="p-4 mb-6 bg-muted/30 rounded-xl">
                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    <span className="text-sm font-medium text-foreground">Sort by:</span>
                                    {['newest', 'oldest', 'popular', 'title'].map(option => (
                                        <button
                                            key={option}
                                            onClick={() => handleSortChange(option)}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${sortBy === option
                                                    ? 'bg-primary text-white'
                                                    : 'bg-background text-foreground border border-border hover:bg-muted'
                                                }`}
                                        >
                                            {option === 'title'
                                                ? 'Title A-Z'
                                                : option.charAt(0).toUpperCase() + option.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error Alert */}
                {error && (
                    <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-destructive text-sm">{error}</p>
                        </div>
                        <button
                            onClick={() => dispatch(setError(null))}
                            className="text-destructive hover:text-destructive/80 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Education Posts Grid/List */}
                <div className="flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    {!sortedEducations || sortedEducations.length === 0 ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            textAlign: 'center',
                            padding: '64px'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: 'var(--radius-xl)',
                                background: 'rgba(212, 175, 55, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '24px',
                                color: 'var(--color-gold)'
                            }}>
                                <Grid className="w-10 h-10" />
                            </div>
                            <h2 style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                color: 'var(--color-text-primary)',
                                marginBottom: '12px',
                                fontFamily: 'var(--font-display)'
                            }}>
                                {getEmptyStateMessage()}
                            </h2>
                            <p style={{
                                fontSize: '16px',
                                color: 'var(--color-text-secondary)',
                                maxWidth: '480px',
                                lineHeight: 1.6,
                                fontFamily: 'var(--font-body)'
                            }}>
                                {filterType === 'liked' ?
                                    "Explore the Education Center to find posts you might want to like." :
                                    filterType === 'bookmarked' ?
                                        "Browse the Education Center to discover educational content." :
                                        "Education content is being prepared. Check back soon for helpful financial tips and guides."}
                            </p>
                        </div>
                    ) : (
                        <div className={`grid gap-5 md:gap-6 ${viewMode === 'list'
                                ? 'grid-cols-1'
                                : 'grid-cols-1 auto-rows-[minmax(220px,auto)] md:grid-cols-6'
                            }`}>
                            <AnimatePresence>
                                {sortedEducations.map((post, index) => (
                                    <motion.div
                                        key={post._id}
                                        layout
                                        className={viewMode === 'grid' ? bentoSpanPattern[index % bentoSpanPattern.length] : ''}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <UserEducationPostCard
                                            post={post}
                                            onLike={handleLike}
                                            onComment={handleComment}
                                            onEdit={handleEditClick}
                                            onDelete={handleDeletePost}
                                            currentUser={user}
                                            viewMode={viewMode}
                                            bentoVariant={bentoStylePattern[index % bentoStylePattern.length]}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Button - Mobile Only */}
            {filterType === 'all' && (
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="fixed bottom-5 right-5 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors sm:hidden z-50"
                    aria-label="add"
                >
                    <Plus className="w-6 h-6" />
                </button>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateEditEducationPost
                        isOpen={showCreateModal}
                        onClose={() => {
                            setShowCreateModal(false);
                            setEditingPost(null);
                        }}
                        onSubmit={handlePostSubmit}
                        initialData={editingPost}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserEducationManager;
