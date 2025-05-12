import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
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

// MUI Components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Fab from '@mui/material/Fab';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';

// Icons
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// Toast notifications
import { toast } from 'react-toastify';

// Theme
import { useTheme } from '../../../theme/ThemeContext';

// Styles
import './styles/userEducationManagerStyles.css';

const UserEducationManager = () => {
    const dispatch = useDispatch();
    const { educations, loading, error } = useSelector(state => state.education);
    const { user } = useSelector(state => state.auth);
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
    
    // UI State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'popular'
    const [showFilters, setShowFilters] = useState(false);
    const [filterType, setFilterType] = useState('all'); // 'all', 'published', 'draft'

    useEffect(() => {
        if (user?.id) {
            fetchUserEducationPosts();
        }
    }, [user?.id]);
    
    // Parse URL query parameters for filtering
    useEffect(() => {
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
    }, [location]);

    const fetchUserEducationPosts = async () => {
        if (!user?.id) return;
        
        dispatch(setLoading(true));
        try {
            const response = await educationService.getUserEducations(user.id);
            let filteredResponse = response;

            dispatch(setEducations(filteredResponse));
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
    const filteredEducations = educations?.filter(post => {
        // Search filter
        return searchQuery === '' || 
            post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.details?.toLowerCase().includes(searchQuery.toLowerCase());
    });
    
    // Sort filtered posts
    const sortedEducations = [...(filteredEducations || [])].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
        } else if (sortBy === 'oldest') {
            return new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date);
        } else if (sortBy === 'popular') {
            const aPopularity = (a.likes?.length || 0) + (a.comments?.length || 0);
            const bPopularity = (b.likes?.length || 0) + (b.comments?.length || 0);
            return bPopularity - aPopularity;
        }
        return 0;
    });

    const handlePostSubmit = async (postData) => {
        dispatch(setLoading(true));
        try {
            let result;
            
            if (postData._id) {
                // Update existing post
                result = await educationService.updateEducation(postData._id, postData);
                dispatch(updateEducation(result));
                toast.success('Post updated successfully');
            } else {
                // Create new post
                result = await educationService.createEducation(postData);
                console.log("***[userEducationManager - handlePostSubmit createEducation] result/response: ", result);
                dispatch(addEducation(result));
                toast.success('Post created successfully');
            }
            
            setEditingPost(null);
            setShowCreateModal(false);
            return result; // Return the result to createEditEducationPost.jsx
        } catch (err) {
            dispatch(setError(err.message));
            toast.error(err.message || 'Failed to save post');
            throw err; // Rethrow to be caught by createEditEducationPost.jsx
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
            
            console.log(`[userEducationManager] Deleting post with ID: ${postId}`);
            
            // Attempt to delete the post
            await educationService.deleteEducation(postId);
            
            // Update the UI after successful deletion
            dispatch(deleteEducation(postId));
            toast.success('Post deleted successfully');
        } catch (error) {
            console.error('[userEducationManager] Error deleting post:', error);
            
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
            
            console.log(`[userEducationManager] Adding comment to post ${postId}: ${comment}`);
            await educationService.addComment(postId, comment);
            
            // Refresh the posts to show the new comment
            fetchUserEducationPosts();
            toast.success('Comment added successfully');
        } catch (err) {
            console.error('[userEducationManager] Error adding comment:', err);
            dispatch(setError(err.message));
            toast.error(err.message || 'Failed to add comment');
        }
    };

    const handleMenuOpen = (event, post) => {
        setAnchorEl(event.currentTarget);
        setSelectedPost(post);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedPost(null);
    };

    const handleEditClick = (post) => {
        setEditingPost(post);
        setShowCreateModal(true);
    };

    const handleDeleteClick = () => {
        if (selectedPost) {
            handleDeletePost(selectedPost.id);
        }
        handleMenuClose();
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
            <Box 
                className="user-education-loading" 
                style={{ 
                    backgroundColor: theme.background.primary,
                    color: theme.text.primary 
                }}
            >
                <CircularProgress style={{ color: theme.button.base }} />
            </Box>
        );
    }

    // Create a completely new layout structure
    return (
        <div style={{ 
            display: 'flex',
            flexDirection: 'row',
            height: 'calc(100vh - 64px)',
            width: '100%',
            backgroundColor: theme.background.primary,
            color: theme.text.primary,
            overflow: 'hidden'
        }}>
            {/* Left Sidebar - Fixed width */}
            <div style={{ 
                width: '250px',
                minWidth: '250px',
                padding: '16px',
                height: '100%',
                overflowY: 'auto',
                borderRight: `1px solid ${theme.border || 'rgba(0,0,0,0.1)'}`,
                display: 'flex',
                flexDirection: 'column'
            }}>
                <EducationNavBar />
                
                <Divider sx={{ my: 2 }} />
                
                <Typography 
                    variant="subtitle2" 
                    sx={{ 
                        fontWeight: 600, 
                        mb: 2,
                        color: theme.text.heading,
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}
                >
                    My Content
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <Chip
                        label="Other Posts"
                        onClick={() => {
                            setFilterType('all');
                            navigate('/education');
                        }}
                        color={filterType === 'all' ? 'primary' : 'default'}
                        variant={filterType === 'all' ? 'filled' : 'outlined'}
                        sx={{ mb: 1 }}
                    />
                </Box>
                
                <Box sx={{ marginTop: 'auto', paddingTop: 2, borderTop: `1px solid ${theme.border || 'rgba(0,0,0,0.1)'}` }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setShowCreateModal(true)}
                        fullWidth
                    >
                        Create Post
                    </Button>
                </Box>
            </div>
            
            {/* Main Content Area */}
            <div style={{ 
                flexGrow: 1,
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'hidden',
                padding: '16px 24px'
            }}>
                {/* Header with Search and Controls */}
                <Box 
                    sx={{ 
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'stretch', sm: 'center' },
                        mb: 2,
                        gap: 2
                    }}
                >
                    <Typography 
                        variant="h5" 
                        component="h1"
                        sx={{ 
                            fontWeight: 600,
                            color: theme.text.heading,
                            flexShrink: 0
                        }}
                    >
                        {getPageTitle()}
                    </Typography>
                    
                    <Box 
                        sx={{ 
                            display: 'flex',
                            gap: 1,
                            alignItems: 'center',
                            width: { xs: '100%', sm: 'auto' },
                        }}
                    >
                        <Box sx={{ flexGrow: 1, maxWidth: '300px' }}>
                            <EducationSearchBar onSearch={handleSearch} />
                        </Box>
                        
                        <Tooltip title="Toggle view mode">
                            <IconButton 
                                onClick={handleViewModeChange}
                                sx={{ color: theme.text.secondary }}
                            >
                                {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Sort posts">
                            <IconButton 
                                onClick={toggleFilters}
                                sx={{ 
                                    color: showFilters ? theme.primary : theme.text.secondary,
                                    backgroundColor: showFilters ? `${theme.primary}10` : 'transparent'
                                }}
                            >
                                <SortIcon />
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Refresh">
                            <IconButton 
                                onClick={fetchUserEducationPosts}
                                sx={{ color: theme.text.secondary }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                
                {/* Sort Options */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Paper 
                                elevation={0} 
                                sx={{ 
                                    p: 2, 
                                    mb: 2, 
                                    backgroundColor: theme.background.secondary,
                                    borderRadius: '12px',
                                    width: '100%'
                                }}
                            >
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                                    <Typography variant="subtitle2" sx={{ mr: 1, alignSelf: 'center' }}>
                                        Sort by:
                                    </Typography>
                                    {['newest', 'oldest', 'popular'].map(option => (
                                        <Chip 
                                            key={option}
                                            label={option.charAt(0).toUpperCase() + option.slice(1)}
                                            onClick={() => handleSortChange(option)}
                                            color={sortBy === option ? 'primary' : 'default'}
                                            variant={sortBy === option ? 'filled' : 'outlined'}
                                            size="small"
                                        />
                                    ))}
                                </Box>
                            </Paper>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Error Alert */}
                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ mb: 2 }}
                        onClose={() => dispatch(setError(null))}
                    >
                        {error}
                    </Alert>
                )}
                
                {/* Education Posts Grid/List */}
                <Box 
                    sx={{ 
                        flexGrow: 1,
                        overflowY: 'auto',
                        pr: 1, // Space for scrollbar
                        scrollbarWidth: 'thin',
                        '&::-webkit-scrollbar': {
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            borderRadius: '3px',
                        }
                    }}
                >
                    {!sortedEducations || sortedEducations.length === 0 ? (
                        <Box 
                            sx={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                height: '100%',
                                p: 4
                            }}
                        >
                            <Typography variant="h6" sx={{ mb: 1, color: theme.text.heading }}>
                                {getEmptyStateMessage()}
                            </Typography>
                            
                            {filterType === 'all' && (
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    onClick={() => setShowCreateModal(true)}
                                    startIcon={<AddIcon />}
                                    sx={{ mt: 2 }}
                                >
                                    Create your first post
                                </Button>
                            )}
                            
                            {filterType !== 'all' && (
                                <Typography variant="body2" sx={{ color: theme.text.secondary, maxWidth: '500px' }}>
                                    {filterType === 'liked' ? 
                                        "Explore the Education Center to find posts you might want to like." :
                                        "Browse the Education Center to discover educational content."}
                                </Typography>
                            )}
                        </Box>
                    ) : (
                        <Grid 
                            container 
                            spacing={3} 
                            sx={{ 
                                mt: 0.5,
                                width: '100%',
                                mx: 0,
                                // List view adjustments
                                '& .MuiGrid-item': {
                                    width: viewMode === 'list' ? '100%' : 'auto',
                                }
                            }}
                        >
                            <AnimatePresence>
                                {sortedEducations.map(post => (
                                    <Grid 
                                        item 
                                        xs={12} 
                                        sm={viewMode === 'list' ? 12 : 6} 
                                        md={viewMode === 'list' ? 12 : 4} 
                                        lg={viewMode === 'list' ? 12 : 4}
                                        xl={viewMode === 'list' ? 12 : 3}
                                        key={post._id}
                                    >
                                        <motion.div
                                            layout
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
                                            />
                                        </motion.div>
                                    </Grid>
                                ))}
                            </AnimatePresence>
                        </Grid>
                    )}
                </Box>
            </div>
            
            {/* Floating Action Button - Mobile Only */}
            {filterType === 'all' && (
                <Fab 
                    color="primary" 
                    aria-label="add" 
                    className="fab-button"
                    onClick={() => setShowCreateModal(true)}
                    sx={{ 
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        display: { xs: 'flex', sm: 'none' }
                    }}
                >
                    <AddIcon />
                </Fab>
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

            {/* Post Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        backgroundColor: theme.background.secondary,
                        color: theme.text.primary,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        borderRadius: '8px',
                        minWidth: '150px'
                    }
                }}
            >
                <MenuItem onClick={handleEditClick} sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <EditIcon fontSize="small" />
                        <Typography>Edit Post</Typography>
                    </Box>
                </MenuItem>
                <MenuItem onClick={handleDeleteClick} sx={{ py: 1.5, color: theme.error }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <DeleteIcon fontSize="small" />
                        <Typography>Delete Post</Typography>
                    </Box>
                </MenuItem>
            </Menu>
        </div>
    );
};

export default UserEducationManager;