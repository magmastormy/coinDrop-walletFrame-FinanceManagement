import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import educationService from '../../services/educationService';
import { 
    setEducations, 
    setLoading, 
    setError,
} from '../../slices/educationSlice';
import EducationCard from './educationCard';
import './styles/educationManagerStyles.css';
import { motion } from 'framer-motion';

const EducationManager = () => {
    const dispatch = useDispatch();
    const { educations, loading, error } = useSelector(state => state.education);
    const { user } = useAuth();
    const { theme } = useTheme();

    const fetchEducationPosts = async () => {
        dispatch(setLoading(true));
        try {
            const response = await educationService.getEducations();
            dispatch(setEducations(response));
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    useEffect(() => {
        fetchEducationPosts();
    }, [dispatch, user]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleLike = async (postId) => {
        try {
            await educationService.likeEducation(postId);
            // Refresh posts after like
            fetchEducationPosts();
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleComment = async (postId, comment) => {
        try {
            await educationService.addComment(postId, comment);
            // Refresh posts after comment
            fetchEducationPosts();
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    if (loading) {
        return (
            <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight="200px"
                style={{ color: theme.text.primary }}
            >
                <CircularProgress style={{ color: theme.button.base }} />
            </Box>
        );
    }

    return (
        <Container 
            maxWidth="xl" 
            className="education-manager" 
            style={{
                backgroundColor: theme.background.primary,
                color: theme.text.primary,
                transition: theme.transition,
                padding: '20px',
                height: 'calc(100vh - 64px)', // Subtract header height
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                py: 3
            }}
        >
            <Box className="header" sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Education Posts
                </Typography>
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
                    <Box className="empty-state">
                        <Typography variant="h6">
                            No education posts yet
                        </Typography>
                        <Typography color="textSecondary">
                            Check back later for educational content
                        </Typography>
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
                                        currentUser={user}
                                    />
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>
        </Container>
    );
};

export default EducationManager;