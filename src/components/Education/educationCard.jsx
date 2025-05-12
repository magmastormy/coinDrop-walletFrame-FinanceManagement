import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHeart, 
    faComment, 
    faShare, 
    faImages, 
    faImage, 
    faBookmark,
    faEye,
    faCheck
} from '@fortawesome/free-solid-svg-icons';
import { faBookmark as farBookmark, faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';
import { useTheme } from '../../theme/ThemeContext';
import EducationRenderer from './educationRenderer';
import EducationFullDetailModal from './educationFullDetailModal';

// MUI Components
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActionArea from '@mui/material/CardActionArea';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';

import './styles/educationCardStyles.css';

const EducationCard = ({ education, onLike, onComment, onBookmark, currentUser }) => {
    const { theme } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(
        education.likes?.includes(currentUser?._id) || 
        education.likes?.includes(currentUser?.id)
    );
    // Removed bookmarked state
    const [readProgress, setReadProgress] = useState(
        education.readProgress?.[currentUser?.id] || 0
    );

    const cardStyle = {
        backgroundColor: theme.background.secondary,
        color: theme.text.primary,
        transition: theme.transition,
        borderRadius: '12px',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleLike = (e) => {
        e.stopPropagation();
        setIsLiked(!isLiked);
        if (onLike) {
            onLike(education._id);
        }
    };
    
    // Removed bookmark handler
    
    const handleReadMore = () => {
        // Update progress to 100% when opening the full article
        setReadProgress(100);
        setIsModalOpen(true);
    };
    
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
        <>
            <Card 
                component={motion.div}
                whileHover={{ 
                    scale: 1.02,
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                }}
                style={cardStyle}
            >
                {/* No New Content Badge or Bookmark Button */}
                
                <CardActionArea onClick={handleReadMore}>
                    <CardMedia
                        component="div"
                        className="card-image-container"
                        sx={{ 
                            height: { xs: 180, md: 200 },
                            position: 'relative'
                        }}
                    >
                        {education.images && education.images.length > 0 ? (
                            <>
                                <img
                                    src={education.images[0].url}
                                    alt={education.title}
                                    className="card-image"
                                    loading="lazy"
                                />
                                {education.images.length > 1 && (
                                    <Box 
                                        className="image-counter"
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
                                        {education.images.length}
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
                    
                    <CardContent sx={{ p: 2, pb: 1 }}>
                        {/* Author & Date */}
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mb: 1,
                            justifyContent: 'space-between'
                        }}>
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
                                {education.author?.username || 'WalletFrame'}
                                {readProgress === 100 && (
                                    <FontAwesomeIcon icon={faCheck} style={{ color: theme.success }} />
                                )}
                            </Typography>
                            
                            <Typography 
                                variant="caption"
                                sx={{ color: theme.text.secondary }}
                            >
                                {education.createdAt ? getTimeAgo(education.createdAt) : formatDate(education.date)}
                            </Typography>
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
                            {education.title}
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
                        >
                            <EducationRenderer content={education.details} />
                        </Box>
                        
                        {/* Read Progress */}
                        {readProgress > 0 && (
                            <Box sx={{ width: '100%', mt: 1 }}>
                                <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 0.5
                                }}>
                                    <Typography variant="caption" sx={{ color: theme.text.secondary }}>
                                        <FontAwesomeIcon icon={faEye} style={{ marginRight: '4px' }} />
                                        {readProgress === 100 ? 'Read' : 'Continue reading'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: theme.text.secondary }}>
                                        {readProgress}%
                                    </Typography>
                                </Box>
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
                    borderTop: `1px solid ${theme.border}`
                }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title={isLiked ? "Unlike" : "Like"}>
                            <IconButton 
                                size="small"
                                sx={{ 
                                    color: isLiked ? theme.error : theme.text.secondary,
                                }}
                                onClick={handleLike}
                            >
                                <FontAwesomeIcon icon={isLiked ? faHeart : farHeart} />
                                {education.likes?.length > 0 && (
                                    <Typography 
                                        variant="caption" 
                                        component="span"
                                        sx={{ ml: 0.5 }}
                                    >
                                        {education.likes.length}
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
                                    handleReadMore();
                                }}
                            >
                                <FontAwesomeIcon icon={faComment} />
                                {education.comments?.length > 0 && (
                                    <Typography 
                                        variant="caption" 
                                        component="span"
                                        sx={{ ml: 0.5 }}
                                    >
                                        {education.comments.length}
                                    </Typography>
                                )}
                            </IconButton>
                        </Tooltip>
                    </Box>
                    
                    {/* Comment button with count */}
                    <Tooltip title="Comments">
                        <IconButton 
                            size="small"
                            sx={{ color: theme.text.secondary }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleReadMore();
                            }}
                        >
                            <FontAwesomeIcon icon={faComment} />
                            {education.comments?.length > 0 && (
                                <Typography 
                                    variant="caption" 
                                    component="span"
                                    sx={{ ml: 0.5 }}
                                >
                                    {education.comments.length}
                                </Typography>
                            )}
                        </IconButton>
                    </Tooltip>
                </CardActions>
            </Card>

            <EducationFullDetailModal
                education={education}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onLike={handleLike}
                // onBookmark removed
                onComment={onComment}
                currentUser={currentUser}
            />
        </>
    );
};

export default EducationCard;