import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Box,
    Avatar,
    Chip,
    LinearProgress,
    Button,
    Divider,
    Grid,
    ImageList,
    ImageListItem,
    TextField
} from '@mui/material';
import { 
    Close as CloseIcon,
    Favorite as FavoriteIcon,
    FavoriteBorder as FavoriteBorderIcon,
    Comment as CommentIcon,
    Share as ShareIcon,
    Bookmark as BookmarkIcon,
    BookmarkBorder as BookmarkBorderIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon
} from '@mui/icons-material';
import EducationRenderer from './educationRenderer';
import './styles/educationFullDetailStyles.css';

const EducationFullDetailModal = ({ education, onClose, onLike, onComment, isLiked, currentUser }) => {
    const [readingProgress, setReadingProgress] = useState(0);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showCommentInput, setShowCommentInput] = useState(false);
    const [commentText, setCommentText] = useState('');
    const contentRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return;
            
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
            setReadingProgress(Math.min(progress, 100));
        };

        const contentElement = contentRef.current;
        if (contentElement) {
            contentElement.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (contentElement) {
                contentElement.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (commentText.trim()) {
            onComment(education._id, commentText);
            setCommentText('');
            setShowCommentInput(false);
        }
    };

    const handleBookmark = () => {
        setIsBookmarked(!isBookmarked);
        // TODO: Implement bookmark functionality
    };

    const handleShare = async () => {
        try {
            await navigator.share({
                title: education.title,
                text: education.details.substring(0, 100) + '...',
                url: window.location.href
            });
        } catch (err) {
            // Fallback to clipboard copy
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Dialog 
            open={true}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    minHeight: '80vh',
                    maxHeight: '90vh',
                    width: '90%',
                    margin: '20px',
                    overflowY: 'auto',
                    '& .MuiDialogContent-root': {
                        padding: '24px',
                        overflowY: 'auto'
                    }
                }
            }}
        >
            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <Box sx={{ 
                        position: 'sticky', 
                        top: 0, 
                        bgcolor: 'background.paper', 
                        zIndex: 1,
                        borderBottom: 1,
                        borderColor: 'divider',
                        p: 2
                    }}>
                        <IconButton
                            onClick={onClose}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="h4" component="h2" gutterBottom>
                            {education.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar
                                src={education.author?.profilePicture}
                                alt={education.author?.username}
                                sx={{ mr: 1 }}
                            />
                            <Box>
                                <Typography variant="subtitle1">
                                    {education.author?.username}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(education.date).toLocaleDateString()}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={{ 
                        flex: 1, 
                        overflowY: 'auto',
                        p: 3,
                        '& img': {
                            maxWidth: '100%',
                            height: 'auto'
                        }
                    }}>
                        <Box className="content-header">
                            <Typography variant="h4" component="h1" gutterBottom>
                                {education.title}
                            </Typography>

                            <Box className="author-info">
                                <Avatar className="author-avatar">
                                    {education.author?.firstName?.[0] || <PersonIcon />}
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle1">
                                        {education.author?.firstName} {education.author?.lastName}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        <CalendarIcon fontSize="small" />
                                        {formatDate(education.date)}
                                    </Typography>
                                </Box>
                            </Box>

                            {education.category && (
                                <Chip 
                                    label={education.category}
                                    color="primary"
                                    variant="outlined"
                                    className="category-chip"
                                />
                            )}
                        </Box>

                        <Divider className="content-divider" />

                        <Box className="main-content">
                            <Typography variant="body1" component="div" className="content-text">
                                <EducationRenderer content={education.details} />
                            </Typography>

                            {education.images && education.images.length > 0 && (
                                <Box className="images-container">
                                    <ImageList 
                                        cols={education.images.length === 1 ? 1 : 2} 
                                        gap={8}
                                    >
                                        {education.images.map((image, index) => (
                                            <ImageListItem key={index}>
                                                <img
                                                    src={image}
                                                    alt={`Content image ${index + 1}`}
                                                    loading="lazy"
                                                    className="content-image"
                                                />
                                            </ImageListItem>
                                        ))}
                                    </ImageList>
                                </Box>
                            )}
                        </Box>

                        <Box className="interaction-bar">
                            <Box className="left-actions">
                                <IconButton 
                                    onClick={() => onLike(education._id)}
                                    color={isLiked ? "primary" : "default"}
                                    aria-label={isLiked ? "unlike" : "like"}
                                >
                                    {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                </IconButton>
                                <Typography variant="caption">
                                    {education.likes?.length || 0}
                                </Typography>

                                <IconButton 
                                    onClick={() => setShowCommentInput(true)}
                                    aria-label="comment"
                                >
                                    <CommentIcon />
                                </IconButton>
                                <Typography variant="caption">
                                    {education.comments?.length || 0}
                                </Typography>
                            </Box>

                            <Box className="right-actions">
                                <IconButton 
                                    onClick={handleBookmark}
                                    aria-label={isBookmarked ? "unbookmark" : "bookmark"}
                                >
                                    {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                                </IconButton>

                                <IconButton 
                                    onClick={handleShare}
                                    aria-label="share"
                                >
                                    <ShareIcon />
                                </IconButton>
                            </Box>
                        </Box>

                        {showCommentInput && (
                            <Box component="form" onSubmit={handleCommentSubmit} className="comment-input">
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Write a comment..."
                                    variant="outlined"
                                />
                                <Box className="comment-actions">
                                    <Button 
                                        onClick={() => setShowCommentInput(false)}
                                        color="inherit"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        disabled={!commentText.trim()}
                                    >
                                        Comment
                                    </Button>
                                </Box>
                            </Box>
                        )}

                        {education.comments && education.comments.length > 0 && (
                            <Box className="comments-section">
                                <Typography variant="h6" gutterBottom>
                                    Comments ({education.comments.length})
                                </Typography>
                                {education.comments.map((comment, index) => (
                                    <Box key={index} className="comment">
                                        <Avatar className="comment-avatar">
                                            {comment.author?.firstName?.[0] || <PersonIcon />}
                                        </Avatar>
                                        <Box className="comment-content">
                                            <Typography variant="subtitle2">
                                                {comment.author?.firstName} {comment.author?.lastName}
                                            </Typography>
                                            <Typography variant="body2">
                                                {comment.content}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {formatDate(comment.date)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default EducationFullDetailModal;