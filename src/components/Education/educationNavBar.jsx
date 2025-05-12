import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../theme/ThemeContext';
import { useSelector } from 'react-redux';

// MUI Components
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';

// Icons
import SchoolIcon from '@mui/icons-material/School';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CreateIcon from '@mui/icons-material/Create';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HistoryIcon from '@mui/icons-material/History';

import './styles/educationNavBarStyles.css';

const EducationNavBar = ({ onCategorySelect, activeCategory }) => {
    const { theme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const { educations } = useSelector(state => state.education);
    
    const [newContentCount, setNewContentCount] = useState(0);
    const [savedCount, setSavedCount] = useState(0);
    const [myPostsCount, setMyPostsCount] = useState(0);
    
    // Determine if we're in the user education section
    const isUserEducation = location.pathname.includes('/user-education');
    
    useEffect(() => {
        // Calculate counts for badges
        if (educations && educations.length > 0) {
            // Count new posts (less than 7 days old)
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            const newPosts = educations.filter(post => 
                new Date(post.createdAt) > oneWeekAgo
            ).length;
            
            setNewContentCount(newPosts);
            
            // Count saved posts
            const saved = educations.filter(post => 
                post.bookmarkedBy?.includes(user?.id)
            ).length;
            
            setSavedCount(saved);
            
            // Count user's own posts
            const userPosts = educations.filter(post => 
                post.user === user?.id || post.user?._id === user?.id
            ).length;
            
            setMyPostsCount(userPosts);
        }
    }, [educations, user]);
    
    const handleNavigation = (path) => {
        navigate(path);
    };
    
    const navItems = [
        // General Education Section
        {
            title: 'All Education',
            icon: <SchoolIcon />,
            path: '/education',
            section: 'general'
        },
        
        // User Education Section
        {
            title: 'My Education Posts',
            icon: <CreateIcon />,
            path: '/user-education',
            count: myPostsCount,
            section: 'user'
        },
        {
            title: 'Liked Posts',
            icon: <FavoriteIcon />,
            path: '/user-education?filter=liked',
            section: 'user'
        },
    ];

    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="education-navbar"
            sx={{
                backgroundColor: theme.background.secondary,
                color: theme.text.primary,
                borderRadius: '12px',
                padding: '16px 8px',
                height: '100%',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                transition: theme.transition,
                overflow: 'hidden'
            }}
        >
            <Typography 
                variant="h6" 
                sx={{ 
                    px: 2, 
                    py: 1, 
                    fontWeight: 600,
                    color: theme.text.heading
                }}
            >
                Education Center
            </Typography>
            
            <List component="nav" sx={{ width: '100%', pt: 1 }}>
                <Typography 
                    variant="overline" 
                    sx={{ 
                        px: 2, 
                        opacity: 0.7,
                        fontWeight: 500,
                        display: 'block'
                    }}
                >
                    Explore
                </Typography>
                
                {navItems
                    .filter(item => item.section === 'general')
                    .map((item, index) => (
                        <ListItem key={index} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                            <Tooltip title={item.title} placement="right" arrow>
                                <ListItemButton
                                    onClick={() => handleNavigation(item.path)}
                                    selected={location.pathname + location.search === item.path}
                                    sx={{
                                        minHeight: 48,
                                        px: 2.5,
                                        borderRadius: '8px',
                                        mx: 1,
                                        '&.Mui-selected': {
                                            backgroundColor: `${theme.primary}20`,
                                            color: theme.primary,
                                            '&:hover': {
                                                backgroundColor: `${theme.primary}30`,
                                            },
                                            '& .MuiListItemIcon-root': {
                                                color: theme.primary,
                                            }
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            mr: 2,
                                            justifyContent: 'center',
                                            color: location.pathname + location.search === item.path ? 
                                                theme.primary : theme.text.secondary,
                                        }}
                                    >
                                        {item.count ? (
                                            <Badge badgeContent={item.count} color="primary">
                                                {item.icon}
                                            </Badge>
                                        ) : item.icon}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={item.title} 
                                        primaryTypographyProps={{
                                            fontSize: 14,
                                            fontWeight: location.pathname + location.search === item.path ? 600 : 400
                                        }}
                                    />
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                    ))
                }
                
                <Divider sx={{ my: 2, opacity: 0.6 }} />
                
                <Typography 
                    variant="overline" 
                    sx={{ 
                        px: 2, 
                        opacity: 0.7,
                        fontWeight: 500,
                        display: 'block'
                    }}
                >
                    My Content
                </Typography>
                
                {navItems
                    .filter(item => item.section === 'user')
                    .map((item, index) => (
                        <ListItem key={index} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                            <Tooltip title={item.title} placement="right" arrow>
                                <ListItemButton
                                    onClick={() => handleNavigation(item.path)}
                                    selected={location.pathname + location.search === item.path}
                                    sx={{
                                        minHeight: 48,
                                        px: 2.5,
                                        borderRadius: '8px',
                                        mx: 1,
                                        '&.Mui-selected': {
                                            backgroundColor: `${theme.primary}20`,
                                            color: theme.primary,
                                            '&:hover': {
                                                backgroundColor: `${theme.primary}30`,
                                            },
                                            '& .MuiListItemIcon-root': {
                                                color: theme.primary,
                                            }
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            mr: 2,
                                            justifyContent: 'center',
                                            color: location.pathname + location.search === item.path ? 
                                                theme.primary : theme.text.secondary,
                                        }}
                                    >
                                        {item.count ? (
                                            <Badge badgeContent={item.count} color="primary">
                                                {item.icon}
                                            </Badge>
                                        ) : item.icon}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={item.title} 
                                        primaryTypographyProps={{
                                            fontSize: 14,
                                            fontWeight: location.pathname + location.search === item.path ? 600 : 400
                                        }}
                                    />
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                    ))
                }
            </List>
        </Box>
    );
};

export default EducationNavBar;