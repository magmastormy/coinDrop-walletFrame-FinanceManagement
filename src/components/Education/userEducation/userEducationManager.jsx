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
    Fab
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
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
        <Container 
            maxWidth="xl" 
            className="user-education-manager"
            style={{
                backgroundColor: theme.background.primary,
                color: theme.text.primary,
                transition: theme.transition
            }}
        >
            <UserEducationInformationBar onCreateClick={() => setShowCreateModal(true)} />

            {error && (
                <Alert 
                    severity="error" 
                    className="error-alert"
                    style={{
                        backgroundColor: `${theme.error}20`,
                        color: theme.error
                    }}
                >
                    {error}
                </Alert>
            )}

            <Box className="education-content">
                {educations?.length === 0 ? (
                    <Box 
                        className="empty-state"
                        style={{
                            backgroundColor: theme.background.secondary,
                            color: theme.text.secondary
                        }}
                    >
                        <Typography variant="h6" style={{ color: theme.text.primary }}>
                            You haven't created any education posts yet
                        </Typography>
                        <Typography style={{ color: theme.text.secondary }}>
                            Share your knowledge with the community
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => setShowCreateModal(true)}
                            style={{
                                backgroundColor: theme.button.base,
                                color: theme.button.text
                            }}
                        >
                            Create Your First Post
                        </Button>
                    </Box>
                ) : (
                    <Grid container spacing={3} className="posts-grid">
                        {educations?.map(post => post && post._id ? (
                            <Grid item xs={12} sm={6} md={4} key={post._id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <UserEducationPostCard
                                        post={post}
                                        onLike={() => handleLike(post._id)}
                                        onComment={handleComment}
                                        onEdit={() => setEditingPost(post)}
                                        onDelete={() => handleDeletePost(post._id)}
                                        currentUser={user}
                                    />
                                </motion.div>
                            </Grid>
                        ) : null)}
                    </Grid>
                )}
            </Box>

            <AnimatePresence>
                {(showCreateModal || editingPost) && (
                    <CreateEditEducationPost
                        onClose={() => {
                            setShowCreateModal(false);
                            setEditingPost(null);
                        }}
                        onSubmit={editingPost ? 
                            (data) => handleUpdatePost(editingPost._id, data) : 
                            handleCreatePost
                        }
                        initialData={editingPost}
                    />
                )}
            </AnimatePresence>

            <Fab
                color="primary"
                aria-label="add"
                className="mobile-add-button"
                onClick={() => setShowCreateModal(true)}
                style={{
                    backgroundColor: theme.button.base,
                    color: theme.button.text
                }}
            >
                <AddIcon />
            </Fab>
        </Container>
    );
};

export default UserEducationManager;