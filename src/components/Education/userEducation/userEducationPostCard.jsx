import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHeart, 
    faComment, 
    faImages, 
    faImage, 
    faEye,
    faCheck,
    faChartBar
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';
import { useTheme } from '../../../theme/ThemeContext';
import './styles/userEducationPostCardStyles.css';
import EducationImageGallery from '../educationImageGallery';

// MUI Components
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';

// Icons
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const UserEducationPostCard = ({ post, onLike, onComment, currentUser, onEdit, onDelete, viewMode }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [showImageGallery, setShowImageGallery] = useState(false);
    const [showFullContent, setShowFullContent] = useState(false);
    const [readProgress, setReadProgress] = useState(
        post.readProgress?.[currentUser?.id] || 0
    );
    const { theme } = useTheme();

    if (!post) {
        return null;
    }

    const isAuthor = currentUser?._id === post.user?._id || currentUser?.id === post.user;

    const handleMenuClick = (event) => {
        event.stopPropagation();
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
    
    const handleCardClick = () => {
        setShowFullContent(true);
        setReadProgress(100);
    };
    
    // Calculate analytics data
    const totalViews = post.views || 0;
    const totalLikes = Array.isArray(post.likes) ? post.likes.length : 0;
    const totalComments = Array.isArray(post.comments) ? post.comments.length : 0;
    const engagementRate = totalViews > 0 ? Math.round(((totalLikes + totalComments) / totalViews) * 100) : 0;

    const isLiked = Array.isArray(post.likes) && (post.likes.includes(currentUser?._id) || post.likes.includes(currentUser?.id));
    
    // Calculate how long ago the post was created
    const getTimeAgo = (date) => {
        const now = new Date();
        const postDate = new Date(date);
        const diffInSeconds = Math.floor((now - postDate) / 1000);
        
        if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
        
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        
        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
        
        const diffInYears = Math.floor(diffInMonths / 12);
        return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
    };

    return (
        <Card 
            component={motion.div}
            whileHover={{ 
                scale: 1.02,
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}
            sx={{ 
                backgroundColor: theme.background.primary,
                color: theme.text.primary,
                borderRadius: '12px',
                overflow: 'hidden',
                transition: theme.transition,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}
        >
            <CardActionArea onClick={handleCardClick}>
                <CardMedia
                    component="div"
                    sx={{ 
                        height: { xs: 180, md: 200 },
                        position: 'relative',
                        backgroundColor: theme.background.tertiary
                    }}
                >
                    {post.images && post.images.length > 0 ? (
                        <>
                            <img
                                src={post.images[0].url}
                                alt={post.title}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                                loading="lazy"
                            />
                            {post.images.length > 1 && (
                                <Box 
                                    sx={{
                                        position: 'absolute',
                                        bottom: '10px',
                                        right: '10px',
                                        bgcolor: 'rgba(0,0,0,0.6)',
                                        color: 'white',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <FontAwesomeIcon icon={faImages} />
                                    {post.images.length}
                                </Box>
                            )}
                        </>
                    ) : (
                        <Box sx={{ 
                            bgcolor: theme.background.tertiary, 
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FontAwesomeIcon icon={faImage} size="2x" opacity={0.4} />
                        </Box>
                    )}
                </CardMedia>
                
                <CardContent sx={{ p: 2, pb: 1, flexGrow: 1 }}>
                    {/* Author & Date */}
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 1,
                        justifyContent: 'space-between'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                                src={post.user?.profilePicture} 
                                alt={post.user?.username || 'User'}
                                sx={{ width: 24, height: 24, mr: 1 }}
                            />
                            <Typography 
                                variant="caption"
                                sx={{ 
                                    color: theme.text.secondary,
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                }}
                            >
                                {post.author?.username || 'Anonymous User'}
                                {readProgress === 100 && (
                                    <FontAwesomeIcon icon={faCheck} style={{ color: theme.success }} />
                                )}
                            </Typography>
                        </Box>
                        
                        <Typography 
                            variant="caption"
                            sx={{ color: theme.text.secondary }}
                        >
                            {post.createdAt ? getTimeAgo(post.createdAt) : new Date(post.date).toLocaleDateString()}
                        </Typography>
                        
                        {/* Options Menu for author */}
                        {isAuthor && (
                            <IconButton 
                                onClick={handleMenuClick}
                                size="small"
                                sx={{ 
                                    color: theme.text.secondary,
                                    ml: 1,
                                    p: 0.5
                                }}
                            >
                                <MoreVertIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                    
                    {/* Title */}
                    <Typography 
                        variant="h6" 
                        gutterBottom
                        sx={{ 
                            color: theme.text.heading,
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            lineHeight: 1.3,
                            mb: 1
                        }}
                    >
                        {post.title}
                    </Typography>

                    {/* Content Preview - Exactly 10 lines */}
                    <Box 
                        className="education-content-preview"
                        sx={{ 
                            color: theme.text.secondary,
                            mb: 1,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 10,
                            WebkitBoxOrient: 'vertical',
                            textOverflow: 'ellipsis',
                            lineHeight: '1.4em',
                            maxHeight: 'calc(1.4em * 10)' // Exactly 10 lines
                        }}
                        dangerouslySetInnerHTML={{ __html: post.details }}
                    />
                    
                    {/* Analytics Section */}
                    <Box sx={{ mt: 2, mb: 1 }}>
                        <Box sx={{ 
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 0.5
                        }}>
                            <Typography variant="caption" sx={{ color: theme.text.secondary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <FontAwesomeIcon icon={faChartBar} />
                                Analytics
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.text.secondary }}>
                                {engagementRate}% engagement
                            </Typography>
                        </Box>
                        <Box sx={{ 
                            display: 'flex',
                            gap: 2,
                            justifyContent: 'space-between',
                            mt: 1
                        }}>
                            <Tooltip title="Views">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <FontAwesomeIcon icon={faEye} size="xs" />
                                    <Typography variant="caption">{totalViews}</Typography>
                                </Box>
                            </Tooltip>
                            <Tooltip title="Likes">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <FontAwesomeIcon icon={faHeart} size="xs" />
                                    <Typography variant="caption">{totalLikes}</Typography>
                                </Box>
                            </Tooltip>
                            <Tooltip title="Comments">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <FontAwesomeIcon icon={faComment} size="xs" />
                                    <Typography variant="caption">{totalComments}</Typography>
                                </Box>
                            </Tooltip>
                        </Box>
                    </Box>
                    
                    {/* Read Progress */}
                    {readProgress > 0 && (
                        <Box sx={{ width: '100%', mt: 1 }}>
                            <LinearProgress 
                                variant="determinate" 
                                value={readProgress} 
                                sx={{ 
                                    height: 4, 
                                    borderRadius: 2,
                                    backgroundColor: `${theme.primary}20`,
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: theme.primary
                                    }
                                }}
                            />
                        </Box>
                    )}
                </CardContent>
            </CardActionArea>
            
            <CardActions sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                px: 2,
                py: 1,
                mt: 'auto',
                borderTop: `1px solid ${theme.border}`
            }}>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={isLiked ? "Unlike" : "Like"}>
                        <IconButton 
                            size="small"
                            sx={{ 
                                color: isLiked ? theme.error : theme.text.secondary,
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onLike(post._id);
                            }}
                        >
                            <FontAwesomeIcon icon={isLiked ? faHeart : farHeart} />
                            {Array.isArray(post.likes) && post.likes.length > 0 && (
                                <Typography 
                                    variant="caption" 
                                    component="span"
                                    sx={{ ml: 0.5 }}
                                >
                                    {post.likes.length}
                                </Typography>
                            )}
                        </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Comments">
                        <IconButton 
                            size="small"
                            sx={{ color: theme.text.secondary }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowComments(!showComments);
                            }}
                        >
                            <FontAwesomeIcon icon={faComment} />
                            {Array.isArray(post.comments) && post.comments.length > 0 && (
                                <Typography 
                                    variant="caption" 
                                    component="span"
                                    sx={{ ml: 0.5 }}
                                >
                                    {post.comments.length}
                                </Typography>
                            )}
                        </IconButton>
                    </Tooltip>
                </Box>
                
                {isAuthor && (
                    <Box>
                        <Tooltip title="Edit">
                            <IconButton 
                                size="small"
                                sx={{ color: theme.text.secondary }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(post);
                                }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
            </CardActions>
            
            {/* Comments Section */}
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
                            variant="outlined"
                            sx={{
                                backgroundColor: theme.background.secondary,
                                borderRadius: '8px',
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
                                },
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <Button 
                            type="submit" 
                            variant="contained" 
                            color="primary" 
                            sx={{ mt: 1 }}
                            disabled={!newComment.trim()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            Post
                        </Button>
                    </Box>
                </Box>
            )}
            
            {/* Menu for post actions */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
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

UserEducationPostCard.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    details: PropTypes.string.isRequired,
    createdAt: PropTypes.string,
    user: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string,
        username: PropTypes.string,
        profilePicture: PropTypes.string
      })
    ]),
    author: PropTypes.shape({
      username: PropTypes.string
    }),
    likes: PropTypes.array,
    comments: PropTypes.array,
    images: PropTypes.array
  }).isRequired,
  onLike: PropTypes.func.isRequired,
  onComment: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  currentUser: PropTypes.object
};

export default UserEducationPostCard;
