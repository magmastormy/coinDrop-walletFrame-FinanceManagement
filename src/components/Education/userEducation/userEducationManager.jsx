import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Box,
    Typography,
    CircularProgress,
    Grid,
    Button,
    Alert,
    Container,
    Fab,
    IconButton,
    Menu,
    MenuItem
} from '@mui/material';
import { 
    Add as AddIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon 
} from '@mui/icons-material';
import { useTheme } from '../../../theme/ThemeContext';
import educationService from '../../../services/educationService';
import { 
    setEducations, 
    setLoading, 
    setError,
    addEducation,
    updateEducation,
    deleteEducation
} from '../../../slices/educationSlice';
import CreateEditEducationPost from './createEditEducationPost';
import UserEducationPostCard from './userEducationPostCard';
import UserEducationInformationBar from './userEducationInformationBar';
import './styles/userEducationManagerStyles.css';
import { toast } from 'react-toastify';

const UserEducationManager = () => {
    const dispatch = useDispatch();
    const { educations, loading, error } = useSelector(state => state.education);
    const { user } = useSelector(state => state.auth);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const { theme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchUserEducationPosts();
    }, [user.id]);

    const fetchUserEducationPosts = async () => {
        if (!user?.id) return;
        
        dispatch(setLoading(true));
        try {
            const response = await educationService.getUserEducations(user.id);
            dispatch(setEducations(response));
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

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
            await educationService.addComment(postId, comment);
            fetchUserEducationPosts();
            toast.success('Comment added successfully');
        } catch (err) {
            dispatch(setError(err.message));
            toast.error('Failed to add comment');
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

    const renderEducationPosts = () => {
        if (loading) {
            return <CircularProgress />;
        }

        if (!educations || educations.length === 0) {
            return (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography variant="h6" color="textSecondary">
                        You haven't created any education posts yet.
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => setShowCreateModal(true)}
                        sx={{ mt: 2 }}
                    >
                        Create your first post
                    </Button>
                </Box>
            );
        }

        return educations.map(post => {
            if (!post || !post._id) {
                console.warn('Invalid post data:', post);
                return null;
            }
            
            return (
                <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    layout
                >
                    <UserEducationPostCard
                        post={post}
                        currentUser={user}
                        onLike={() => handleLike(post._id)}
                        onComment={(comment) => handleComment(post._id, comment)}
                        onEdit={() => handleEditClick(post)}
                        onDelete={() => handleDeletePost(post._id)}
                    />
                </motion.div>
            );
        }).filter(Boolean); // Filter out any null values from invalid posts
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

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px',
                padding: '24px'
            }}>
                {renderEducationPosts()}
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        backgroundColor: theme.backgroundAlt,
                        color: theme.text
                    }
                }}
            >
                <MenuItem onClick={handleDeleteClick} sx={{ color: theme.error }}>
                    <DeleteIcon sx={{ mr: 1 }} />
                    Delete
                </MenuItem>
            </Menu>

            <Fab
                color="primary"
                aria-label="add"
                onClick={() => setShowCreateModal(true)}
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    backgroundColor: theme.primary,
                    '&:hover': {
                        backgroundColor: theme.primaryDark
                    }
                }}
            >
                <AddIcon />
            </Fab>

            <AnimatePresence>
                {showCreateModal && (
                    <CreateEditEducationPost 
                        onSubmit={handlePostSubmit} 
                        onClose={() => {
                            setShowCreateModal(false);
                            setEditingPost(null);
                        }} 
                        post={editingPost}
                    />
                )}
            </AnimatePresence>
        </Container>
    );
};

export default UserEducationManager;