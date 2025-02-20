import React, { useState } from 'react';
import { 
    Card,
    CardContent,
    CardActions,
    Typography,
    IconButton,
    Button,
    Menu,
    MenuItem,
    Box,
    TextField,
    Avatar,
    Tooltip
} from '@mui/material';
import {
    ThumbUp as ThumbUpIcon,
    Comment as CommentIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useTheme } from '../../../theme/ThemeContext';
import './styles/userEducationPostCardStyles.css';

const UserEducationPostCard = ({ 
    post, 
    onLike, 
    onComment,
    currentUser 
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const { theme } = useTheme();

    if (!post) {
        return null;
    }

    const renderImage = (imageUrl) => {
        if (!imageUrl?.url) return null;
        
        return (
            <Box 
                component="img"
                src={imageUrl.url}
                alt="Post content"
                onError={(e) => {
                    console.error('Image failed to load:', imageUrl.url);
                    e.target.style.display = 'none';
                }}
                sx={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'cover',
                    maxHeight: '300px',
                    borderRadius: '4px'
                }}
            />
        );
    };

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            onComment(post._id, newComment);
            setNewComment('');
        }
    };

    const isLiked = Array.isArray(post.likes) && post.likes.includes(currentUser?._id);
    const isAuthor = post.author?._id === currentUser?._id;
    const postDetails = post.details || post.content || ''; // Handle both content fields

    return (
        <Card 
            sx={{ 
                backgroundColor: theme.backgroundAlt,
                color: theme.text,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}
        >
            <CardContent sx={{ flex: 1 }}>
                <Box className="post-header">
                    <Box className="author-info">
                        <Avatar 
                            src={post.author?.profileImage} 
                            alt={post.author?.username}
                            style={{
                                backgroundColor: theme.button.base
                            }}
                        >
                            {post.author?.username?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                        <Box>
                            <Typography 
                                variant="subtitle1"
                                style={{ color: theme.text.primary }}
                            >
                                {post.author?.username || 'Unknown User'}
                            </Typography>
                            <Typography 
                                variant="caption"
                                style={{ color: theme.text.secondary }}
                            >
                                {new Date(post.createdAt || post.date).toLocaleDateString()}
                            </Typography>
                        </Box>
                    </Box>
                    
                    {isAuthor && (
                        <>
                            <IconButton 
                                onClick={handleMenuClick}
                                size="small"
                                style={{ color: theme.text.secondary }}
                            >
                                <MoreVertIcon />
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                PaperProps={{
                                    style: {
                                        backgroundColor: theme.background.secondary,
                                        color: theme.text.primary,
                                        border: `1px solid ${theme.border}`
                                    }
                                }}
                            >
                                <MenuItem 
                                    onClick={() => {
                                        handleMenuClose();
                                        // onEdit();
                                    }}
                                    style={{ color: theme.text.primary }}
                                >
                                    <EditIcon fontSize="small" style={{ marginRight: 8 }} />
                                    Edit
                                </MenuItem>
                                <MenuItem 
                                    onClick={() => {
                                        handleMenuClose();
                                        // onDelete();
                                    }}
                                    style={{ color: theme.error }}
                                >
                                    <DeleteIcon fontSize="small" style={{ marginRight: 8 }} />
                                    Delete
                                </MenuItem>
                            </Menu>
                        </>
                    )}
                </Box>

                <Typography 
                    variant="h6" 
                    className="post-title"
                    style={{ color: theme.text.primary }}
                >
                    {post.title}
                </Typography>

                {post.images && post.images.map((image, index) => (
                    <Box key={`${post.id}-image-${index}`}>
                        {renderImage(image)}
                    </Box>
                ))}

                <div 
                    className="post-content"
                    style={{ color: theme.text.secondary }}
                    dangerouslySetInnerHTML={{ __html: postDetails }}
                />
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', padding: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        size="small"
                        startIcon={<ThumbUpIcon />}
                        onClick={onLike}
                        sx={{
                            color: isLiked ? theme.primary : theme.text
                        }}
                    >
                        {Array.isArray(post.likes) ? post.likes.length : 0}
                    </Button>
                    <Button
                        size="small"
                        startIcon={<CommentIcon />}
                        onClick={() => setShowComments(!showComments)}
                        sx={{ color: theme.text }}
                    >
                        {Array.isArray(post.comments) ? post.comments.length : 0}
                    </Button>
                </Box>
            </CardActions>

            {showComments && (
                <Box sx={{ p: 2, borderTop: `1px solid ${theme.border}` }}>
                    {post.comments?.map((comment, index) => (
                        <Box key={`${post.id}-comment-${index}`} sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {comment.author?.username}
                            </Typography>
                            <Typography variant="body2">
                                {comment.content}
                            </Typography>
                        </Box>
                    ))}
                    <Box component="form" onSubmit={handleCommentSubmit} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: theme.border,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: theme.primary,
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: theme.primary,
                                    },
                                    '& input': {
                                        color: theme.text
                                    }
                                }
                            }}
                        />
                        <Button 
                            type="submit"
                            variant="contained"
                            disabled={!newComment.trim()}
                            size="small"
                            style={{
                                backgroundColor: theme.button.base,
                                color: theme.button.text
                            }}
                        >
                            Post
                        </Button>
                    </Box>
                </Box>
            )}
        </Card>
    );
};

export default UserEducationPostCard;
