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
    onEdit, 
    onDelete,
    currentUser 
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const { theme } = useTheme();

    if (!post) {
        return null;
    }

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
            className="education-post-card"
            style={{
                backgroundColor: theme.background.secondary,
                color: theme.text.primary,
                borderColor: theme.border
            }}
        >
            <CardContent>
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
                                        onEdit();
                                    }}
                                    style={{ color: theme.text.primary }}
                                >
                                    <EditIcon fontSize="small" style={{ marginRight: 8 }} />
                                    Edit
                                </MenuItem>
                                <MenuItem 
                                    onClick={() => {
                                        handleMenuClose();
                                        onDelete();
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

                <div 
                    className="post-content"
                    style={{ color: theme.text.secondary }}
                    dangerouslySetInnerHTML={{ __html: postDetails }}
                />

                {post.imageUrl && (
                    <Box 
                        component="img"
                        src={post.imageUrl}
                        alt={post.title}
                        className="post-image"
                        style={{ borderColor: theme.border }}
                    />
                )}
            </CardContent>

            <CardActions className="post-actions">
                <Box className="action-buttons">
                    <Tooltip title={isLiked ? "Unlike" : "Like"}>
                        <IconButton 
                            onClick={onLike}
                            style={{ 
                                color: isLiked ? theme.button.base : theme.text.secondary 
                            }}
                        >
                            <ThumbUpIcon />
                            <Typography 
                                variant="caption" 
                                className="action-count"
                                style={{ color: theme.text.secondary }}
                            >
                                {Array.isArray(post.likes) ? post.likes.length : 0}
                            </Typography>
                        </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Comment">
                        <IconButton 
                            onClick={() => setShowComments(!showComments)}
                            style={{ color: theme.text.secondary }}
                        >
                            <CommentIcon />
                            <Typography 
                                variant="caption" 
                                className="action-count"
                                style={{ color: theme.text.secondary }}
                            >
                                {Array.isArray(post.comments) ? post.comments.length : 0}
                            </Typography>
                        </IconButton>
                    </Tooltip>
                </Box>
            </CardActions>

            {showComments && (
                <Box 
                    className="comments-section"
                    style={{ borderTopColor: theme.border }}
                >
                    <form onSubmit={handleCommentSubmit} className="comment-form">
                        <TextField
                            fullWidth
                            size="small"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            variant="outlined"
                            InputProps={{
                                style: {
                                    backgroundColor: theme.background.primary,
                                    color: theme.text.primary,
                                    borderColor: theme.border
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
                    </form>

                    <Box className="comments-list">
                        {Array.isArray(post.comments) && post.comments.map((comment, index) => (
                            <Box 
                                key={comment._id || index} 
                                className="comment-item"
                                style={{ borderBottomColor: theme.border }}
                            >
                                <Box className="comment-header">
                                    <Typography 
                                        variant="subtitle2"
                                        style={{ color: theme.text.primary }}
                                    >
                                        {comment.author?.username || 'Unknown User'}
                                    </Typography>
                                    <Typography 
                                        variant="caption"
                                        style={{ color: theme.text.secondary }}
                                    >
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                    </Typography>
                                </Box>
                                <Typography 
                                    variant="body2"
                                    style={{ color: theme.text.secondary }}
                                >
                                    {comment.content}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
        </Card>
    );
};

export default UserEducationPostCard;
