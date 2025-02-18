import React, { useState } from 'react';
import { Card, CardContent, CardMedia, Typography, Box, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faComment, faShare } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../theme/ThemeContext';
import EducationRenderer from './educationRenderer';
import EducationFullDetailModal from './educationFullDetailModal';
import './styles/educationCardStyles.css';

const EducationCard = ({ education }) => {
    const { theme } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(education.isLiked);

    const cardStyle = {
        backgroundColor: theme.background.secondary,
        color: theme.text.primary,
        transition: theme.transition,
        borderRadius: '12px',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
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
                onClick={() => setIsModalOpen(true)}
            >
                {education.images && education.images.length > 0 && (
                    <CardMedia
                        component="img"
                        height="200"
                        image={education.images[0].url}
                        alt={education.title}
                        style={{ objectFit: 'cover' }}
                    />
                )}
                
                <CardContent>
                    <Typography 
                        variant="h6" 
                        gutterBottom
                        style={{ color: theme.text.heading }}
                    >
                        {education.title}
                    </Typography>

                    <Box 
                        style={{ 
                            color: theme.text.secondary,
                            marginBottom: '1rem'
                        }}
                    >
                        <EducationRenderer content={education.details} maxLength={100} />
                    </Box>

                    <Box 
                        sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 2
                        }}
                    >
                        <Typography 
                            variant="caption"
                            style={{ color: theme.text.secondary }}
                        >
                            {formatDate(education.date)}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                                size="small"
                                style={{ 
                                    color: isLiked ? '#e91e63' : theme.button.base,
                                    backgroundColor: theme.button.base + '10'
                                }}
                                onClick={handleLike}
                            >
                                <FontAwesomeIcon icon={faHeart} />
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
                            <IconButton 
                                size="small"
                                style={{ 
                                    color: theme.button.base,
                                    backgroundColor: theme.button.base + '10'
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
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <EducationFullDetailModal
                education={education}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onLike={handleLike}
            />
        </>
    );
};

export default EducationCard;