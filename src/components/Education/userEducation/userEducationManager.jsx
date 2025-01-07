import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
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
import EducationCard from '../educationCard';
import './styles/userEducationManagerStyles.css';

const UserEducationManager = () => {
    const dispatch = useDispatch();
    const { educations, loading, error } = useSelector(state => state.education);
    const { user } = useSelector(state => state.auth);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);

    useEffect(() => {
        fetchUserEducationPosts();
    }, [user.id]);

    const fetchUserEducationPosts = async () => {
        if (!user?.id) return;
        
        dispatch(setLoading(true));
        try {
            const response = await educationService.getUserEducations(user.id);
            dispatch(setEducations(response.data.data));
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
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleEditPost = async (id, postData) => {
        dispatch(setLoading(true));
        try {
            const response = await educationService.updateEducation(id, postData);
            dispatch(updateEducation(response));
            setEditingPost(null);
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
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
            <Box className="user-education-manager loading">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" className="user-education-manager" sx={{ 
            height: 'calc(100vh - 64px)', // Subtract header height
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            py: 3
        }}>
            <Box className="header" sx={{ 
                mb: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Typography variant="h4" component="h1">
                    My Education Posts
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setShowCreateModal(true)}
                >
                    Create Post
                </Button>
            </Box>

            {error && (
                <Alert severity="error" className="error-alert" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ 
                flex: 1,
                overflowY: 'auto',
                pb: 3
            }}>
                {educations?.length === 0 ? (
                    <Box className="empty-state" sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        gap: 2
                    }}>
                        <Typography variant="h6">
                            You haven't created any education posts yet
                        </Typography>
                        <Typography color="textSecondary" paragraph>
                            Share your knowledge with the community
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => setShowCreateModal(true)}
                        >
                            Create Your First Post
                        </Button>
                    </Box>
                ) : (
                    <Grid container spacing={3} className="posts-grid">
                        {educations?.map(post => (
                            <Grid item xs={12} sm={6} md={4} key={post._id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <EducationCard
                                        education={post}
                                        onLike={() => handleLike(post._id)}
                                        onComment={handleComment}
                                        onEdit={() => setEditingPost(post)}
                                        onDelete={() => handleDeletePost(post._id)}
                                        currentUser={user}
                                        showActions={true}
                                    />
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>

            {(showCreateModal || editingPost) && (
                <CreateEditEducationPost
                    open={true}
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingPost(null);
                    }}
                    onSubmit={editingPost ? handleEditPost : handleCreatePost}
                    post={editingPost}
                />
            )}

            <Fab
                color="primary"
                aria-label="add"
                className="mobile-add-button"
                onClick={() => setShowCreateModal(true)}
            >
                <AddIcon />
            </Fab>
        </Container>
    );
};

export default UserEducationManager;