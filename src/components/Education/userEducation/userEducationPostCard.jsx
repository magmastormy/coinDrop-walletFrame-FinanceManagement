import React, { useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import './styles/userEducationPostCardStyles.css';
import EducationImageGallery from '../educationImageGallery';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';

import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CommentIcon from '@mui/icons-material/Comment';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const UserEducationPostCard = ({ post, onLike, onComment, currentUser, onEdit, onDelete }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [showImageGallery, setShowImageGallery] = useState(false);
    const { theme } = useTheme();

    if (!post) {
        return null;
    }

    const isAuthor = currentUser?._id === post.user?._id || currentUser?.id === post.user;

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleEditClick = () => {
        handleMenuClose();
        onEdit(post);
    };

    const handleDeleteClick = () => {
        handleMenuClose();
        onDelete(post._id);
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            onComment(post._id, newComment);
            setNewComment('');
        }
    };

    const isLiked = Array.isArray(post.likes) && post.likes.includes(currentUser?._id);

    return (
        <Card elevation={3} sx={{ 
            backgroundColor: theme.background.primary,
            color: theme.text.primary,
            borderRadius: '12px',
            overflow: 'hidden',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
            },
            position: 'relative'
        }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    mb: 2
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                            src={post.user?.profilePicture} 
                            alt={post.user?.username || 'User'}
                            sx={{ width: 40, height: 40, mr: 1 }}
                        />
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {post.author?.username || 'Anonymous User'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.text.secondary }}>
                                {new Date(post.createdAt).toLocaleDateString()}
                            </Typography>
                        </Box>
                    </Box>
                    
                    {/* Options Menu - Make this more visible */}
                    {isAuthor && (
                        <>
                            <IconButton 
                                onClick={handleMenuClick}
                                size="small"
                                sx={{ 
                                    color: theme.text.secondary,
                                    border: `1px solid ${theme.border}`,
                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0,0,0,0.1)'
                                    }
                                }}
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
                                    onClick={handleEditClick}
                                    style={{ color: theme.text.primary }}
                                >
                                    <EditIcon fontSize="small" style={{ marginRight: 8 }} />
                                    Edit
                                </MenuItem>
                                <MenuItem 
                                    onClick={handleDeleteClick}
                                    style={{ color: theme.error }}
                                >
                                    <DeleteIcon fontSize="small" style={{ marginRight: 8 }} />
                                    Delete
                                </MenuItem>
                            </Menu>
                        </>
                    )}
                </Box>

                <Typography variant="h6" sx={{ mb: 2 }}>{post.title}</Typography>

                <div 
                    className="post-content" 
                    dangerouslySetInnerHTML={{ __html: post.details }}
                    style={{ 
                        color: theme.text.primary,
                        marginBottom: '16px',
                        wordBreak: 'break-word'
                    }}
                />

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
                            <Box key={`${post._id}-comment-${index}`} sx={{ mb: 2 }}>
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
            </CardContent>

            {showImageGallery && (
                <EducationImageGallery
                    images={post.images}
                    initialIndex={0}
                    onClose={() => setShowImageGallery(false)}
                />
            )}
        </Card>
    );
};

export default UserEducationPostCard;
