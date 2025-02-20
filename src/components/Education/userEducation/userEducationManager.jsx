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

const UserEducationManager = () => {
    const dispatch = useDispatch();
    const { educations, loading, error } = useSelector(state => state.education);
    const { user } = useSelector(state => state.auth);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const { theme } = useTheme();

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

    const handleCreatePost = async (postData) => {
        dispatch(setLoading(true));
        try {
            const response = await educationService.createEducation(postData);
            dispatch(addEducation(response));
            setShowCreateModal(false);
            // Refresh the list to ensure we have the latest data
            fetchUserEducationPosts();
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleUpdatePost = async (id, postData) => {
        try {
            const response = await educationService.updateEducation(id, postData);
            dispatch(updateEducation(response));
            setEditingPost(null);
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleDeletePost = async (id) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            await educationService.deleteEducation(id);
            dispatch(deleteEducation(id));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleLike = async (postId) => {
        try {
            await educationService.likeEducation(postId);
            fetchUserEducationPosts();
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleComment = async (postId, comment) => {
        try {
            await educationService.addComment(postId, comment);
            fetchUserEducationPosts();
        } catch (err) {
            dispatch(setError(err.message));
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

    const handleEditClick = () => {
        setEditingPost(selectedPost);
        handleMenuClose();
    };

    const handleDeleteClick = () => {
        if (selectedPost) {
            handleDeletePost(selectedPost.id);
        }
        handleMenuClose();
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
                {educations.map((post, index) => (
                    <Box 
                        key={`education-post-${post.id || index}`}
                        sx={{
                            position: 'relative',
                            height: 'fit-content'
                        }}
                    >
                        <UserEducationPostCard 
                            key={`post-card-${post.id || index}`}
                            post={post}
                            onLike={() => handleLike(post.id)}
                            onComment={(comment) => handleComment(post.id, comment)}
                        />
                        {post.userId === user.id && (
                            <IconButton
                                key={`menu-button-${post.id || index}`}
                                size="small"
                                sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    backgroundColor: theme.backgroundAlt,
                                    '&:hover': {
                                        backgroundColor: theme.primary
                                    }
                                }}
                                onClick={(e) => handleMenuOpen(e, post)}
                            >
                                <MoreVertIcon />
                            </IconButton>
                        )}
                    </Box>
                ))}
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
                <MenuItem onClick={handleEditClick} sx={{ color: theme.text }}>
                    <EditIcon sx={{ mr: 1 }} />
                    Edit
                </MenuItem>
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
                {(showCreateModal || editingPost) && (
                    <CreateEditEducationPost
                        onClose={() => {
                            setShowCreateModal(false);
                            setEditingPost(null);
                        }}
                        onSubmit={editingPost ? 
                            (data) => handleUpdatePost(editingPost.id, data) : 
                            handleCreatePost
                        }
                        initialData={editingPost}
                    />
                )}
            </AnimatePresence>
        </Container>
    );
};

export default UserEducationManager;