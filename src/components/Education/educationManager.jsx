import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import educationService from '../../services/educationService';
import { 
    setEducations, 
    setLoading, 
    setError,
} from '../../slices/educationSlice';

// Components
import EducationCard from './educationCard';
import EducationNavBar from './educationNavBar';
import EducationSearchBar from './educationSearchBar';

// MUI Components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';

// Icons
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import RefreshIcon from '@mui/icons-material/Refresh';

import './styles/educationManagerStyles.css';

const EducationManager = () => {
    const dispatch = useDispatch();
    const { educations, loading, error } = useSelector(state => state.education);
    const { user } = useAuth();
    const { theme } = useTheme();
    
    // UI State
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'popular'
    const [showFilters, setShowFilters] = useState(false);

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
    
    const handleSearch = (query) => {
        setSearchQuery(query);
    };
    
    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
    };
    
    const handleSortChange = (sortOption) => {
        setSortBy(sortOption);
    };
    
    const handleViewModeChange = () => {
        setViewMode(viewMode === 'grid' ? 'list' : 'grid');
    };
    
    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    useEffect(() => {
        fetchEducationPosts();
    }, [dispatch, user]); // eslint-disable-line react-hooks/exhaustive-deps
    
    // Filter and sort education posts
    const filteredEducations = educations?.filter(post => {
        // Search filter
        const matchesSearch = searchQuery === '' || 
            post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.details?.toLowerCase().includes(searchQuery.toLowerCase());
            
        // Category filter
        const matchesCategory = selectedCategory === 'all' || 
            post.category === selectedCategory;
            
        return matchesSearch && matchesCategory;
    });
    
    // Sort filtered posts
    const sortedEducations = [...(filteredEducations || [])].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
        } else if (sortBy === 'oldest') {
            return new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date);
        } else if (sortBy === 'popular') {
            const aPopularity = (a.likes?.length || 0) + (a.comments?.length || 0);
            const bPopularity = (b.likes?.length || 0) + (b.comments?.length || 0);
            return bPopularity - aPopularity;
        }
        return 0;
    });

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

    // Loading state with skeleton
    if (loading) {
        return (
            <Box 
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 64px)]',
                    backgroundColor: theme.background.primary,
                    color: theme.text.primary,
                    transition: theme.transition,
                }}
            >
                <Box 
                    sx={{ 
                        display: 'flex',
                        flexGrow: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <CircularProgress 
                        size={40}
                        thickness={4}
                        sx={{ color: theme.primary }}
                    />
                </Box>
            </Box>
        );
    }

    return (
        <Box 
            className="education-manager" 
            sx={{
                display: 'flex',
                height: 'calc(100vh - 64px)', // Subtract header height

                backgroundColor: theme.background.primary,
                color: theme.text.primary,
                transition: theme.transition,
                overflow: 'hidden',
                flexGrow   : 1,
            }}
        >
            {/* Left Sidebar - Navigation */}
            <Box 
                sx={{ 
                    width: { xs: 0, md: 250 },
                    minWidth: { md: 250 },
                    display: { xs: 'none', md: 'block' },
                    p: 2,
                    height: '100%',
                    overflowY: 'auto',
                    borderRight: `1px solid ${theme.border || 'rgba(0,0,0,0.1)'}`
                }}
            >
                <EducationNavBar 
                    onCategorySelect={handleCategorySelect} 
                    activeCategory={selectedCategory}
                />
            </Box>
            
            {/* Main Content Area */}
            <Box 
                sx={{ 
                    flexGrow: 1,
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'hidden',
                    px: { xs: 2, md: 3 },
                    py: 2
                }}
            >
                {/* Header with Search and Filters */}
                <Box 
                    sx={{ 
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'stretch', sm: 'center' },
                        mb: 2,
                        gap: 2
                    }}
                >
                    <Typography 
                        variant="h5" 
                        component="h1"
                        sx={{ 
                            fontWeight: 600,
                            color: theme.text.heading,
                            flexShrink: 0
                        }}
                    >
                        Education Center
                    </Typography>
                    
                    <Box 
                        sx={{ 
                            display: 'flex',
                            gap: 1,
                            alignItems: 'center',
                            width: { xs: '100%', sm: 'auto' },
                        }}
                    >
                        <Box sx={{ flexGrow: 1 }}>
                            <EducationSearchBar onSearch={handleSearch} />
                        </Box>
                        
                        <Tooltip title="Toggle view mode">
                            <IconButton 
                                onClick={handleViewModeChange}
                                sx={{ color: theme.text.secondary }}
                            >
                                {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Filter and sort">
                            <IconButton 
                                onClick={toggleFilters}
                                sx={{ 
                                    color: showFilters ? theme.primary : theme.text.secondary,
                                    backgroundColor: showFilters ? `${theme.primary}10` : 'transparent'
                                }}
                            >
                                <FilterListIcon />
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Refresh">
                            <IconButton 
                                onClick={fetchEducationPosts}
                                sx={{ color: theme.text.secondary }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                
                {/* Filter Options */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Paper 
                                elevation={0} 
                                sx={{ 
                                    p: 2, 
                                    mb: 2, 
                                    backgroundColor: theme.background.secondary,
                                    borderRadius: '12px'
                                }}
                            >
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    <Typography variant="subtitle2" sx={{ mr: 1, alignSelf: 'center' }}>
                                        Sort by:
                                    </Typography>
                                    {['newest', 'oldest', 'popular'].map(option => (
                                        <Chip 
                                            key={option}
                                            label={option.charAt(0).toUpperCase() + option.slice(1)}
                                            onClick={() => handleSortChange(option)}
                                            color={sortBy === option ? 'primary' : 'default'}
                                            variant={sortBy === option ? 'filled' : 'outlined'}
                                            size="small"
                                        />
                                    ))}
                                    
                                    {/* Category filters removed */}
                                </Box>
                            </Paper>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Error Alert */}
                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ mb: 2 }}
                        onClose={() => dispatch(setError(null))}
                    >
                        {error}
                    </Alert>
                )}
                
                {/* Education Posts Grid/List */}
                <Box 
                    sx={{ 
                        flexGrow: 1,
                        overflowY: 'auto',
                        pr: 1, // Space for scrollbar
                        scrollbarWidth: 'thin',
                        '&::-webkit-scrollbar': {
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            borderRadius: '3px',
                        }
                    }}
                >
                    {!sortedEducations || sortedEducations.length === 0 ? (
                        <Box 
                            sx={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                height: '100%',
                                p: 4
                            }}
                        >
                            <Typography variant="h6" sx={{ mb: 1, color: theme.text.heading }}>
                                No education posts found
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.text.secondary, maxWidth: '500px' }}>
                                {searchQuery ? 
                                    `No results found for "${searchQuery}". Try a different search term or browse all posts.` :
                                    "There are no education posts available at the moment. Check back later for new content."}
                            </Typography>
                        </Box>
                    ) : (
                        <Grid 
                            container 
                            spacing={3} 
                            sx={{ 
                                mt: 0.5,
                                width: '100%',
                                mx: 0,
                                // List view adjustments
                                '& .MuiGrid-item': {
                                    width: viewMode === 'list' ? '100%' : 'auto',
                                }
                            }}
                        >
                            <AnimatePresence>
                                {sortedEducations.map(post => (
                                    <Grid 
                                        item 
                                        xs={12} 
                                        sm={viewMode === 'list' ? 12 : 6} 
                                        md={viewMode === 'list' ? 12 : 4} 
                                        lg={viewMode === 'list' ? 12 : 4}
                                        xl={viewMode === 'list' ? 12 : 3}
                                        key={post._id}
                                    >
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <EducationCard
                                                education={post}
                                                onLike={handleLike}
                                                onComment={handleComment}
                                                currentUser={user}
                                                viewMode={viewMode}
                                            />
                                        </motion.div>
                                    </Grid>
                                ))}
                            </AnimatePresence>
                        </Grid>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default EducationManager;