import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../contexts/authContext';
import { Grid, LayoutGrid, Filter, RefreshCw, ArrowDownAZ } from 'lucide-react';
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
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { cn } from '../../lib/utils';

const EducationManager = () => {
    const dispatch = useDispatch();
    const { educations, loading, error } = useSelector(state => state.education);
    const { user } = useAuth();

    // UI State
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'popular', 'title'
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
    }, [dispatch, user]);

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
        } else if (sortBy === 'title') {
            return (a.title || '').localeCompare(b.title || '');
        }
        return 0;
    });

    const bentoSpanPattern = [
        'md:col-span-3 md:row-span-2',
        'md:col-span-3 md:row-span-1',
        'md:col-span-2 md:row-span-1',
        'md:col-span-4 md:row-span-1',
        'md:col-span-2 md:row-span-2',
        'md:col-span-3 md:row-span-1',
        'md:col-span-3 md:row-span-1'
    ];

    const bentoStylePattern = ['feature', 'standard', 'compact', 'wide', 'tall', 'standard', 'wide'];

    const handleLike = async (postId) => {
        try {
            await educationService.likeEducation(postId);
            fetchEducationPosts();
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleComment = async (postId, comment) => {
        try {
            await educationService.addComment(postId, comment);
            fetchEducationPosts();
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex h-full overflow-hidden">
            {/* Left Sidebar - Navigation */}
            <div className="hidden md:block w-64 p-4 border-r border-white/10 overflow-y-auto">
                <EducationNavBar
                    onCategorySelect={handleCategorySelect}
                    activeCategory={selectedCategory}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden px-4 md:px-6 py-4">
                {/* Header with Search and Filters */}
                <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <h1 className="text-3xl font-bold text-foreground">
                        Education Center
                    </h1>

                    <div className="flex w-full items-center gap-2 sm:w-auto">
                        <div className="flex-1 sm:flex-initial">
                            <EducationSearchBar onSearch={handleSearch} />
                        </div>

                        <div className="relative">
                            <ArrowDownAZ className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <select
                                value={sortBy}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="h-10 rounded-xl border border-white/10 bg-background/70 pl-9 pr-8 text-sm text-foreground outline-none transition-all focus:border-primary/40"
                                aria-label="Sort education posts"
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="popular">Most Popular</option>
                                <option value="title">Title A-Z</option>
                            </select>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleViewModeChange}
                            className="flex-shrink-0"
                        >
                            {viewMode === 'grid' ? <Grid className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleFilters}
                            className={cn(
                                "flex-shrink-0",
                                showFilters && "bg-primary/20 text-primary"
                            )}
                        >
                            <Filter className="w-5 h-5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={fetchEducationPosts}
                            className="flex-shrink-0"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="mb-3 text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{sortedEducations?.length || 0}</span> posts
                </div>

                {/* Filter Options */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <GlassCard className="p-4 mb-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-muted-foreground mr-2">
                                        Sort by:
                                    </span>
                                    {['newest', 'oldest', 'popular', 'title'].map(option => (
                                        <button
                                            key={option}
                                            onClick={() => handleSortChange(option)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                                sortBy === option
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                                            )}
                                        >
                                            {option === 'title'
                                                ? 'Title A-Z'
                                                : option.charAt(0).toUpperCase() + option.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error Alert */}
                {error && (
                    <div className="p-4 mb-4 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-between">
                        <span>{error}</span>
                        <button
                            onClick={() => dispatch(setError(null))}
                            className="text-red-500 hover:text-red-400"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Education Posts Grid/List */}
                <div className="flex-1 overflow-y-auto pr-2">
                    {!sortedEducations || sortedEducations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <h2 className="text-xl font-semibold text-foreground mb-2">
                                No education posts found
                            </h2>
                            <p className="text-muted-foreground max-w-md">
                                {searchQuery ?
                                    `No results found for "${searchQuery}". Try a different search term or browse all posts.` :
                                    "There are no education posts available at the moment. Check back later for new content."}
                            </p>
                        </div>
                    ) : (
                        <div className={cn(
                            "grid gap-5 pb-4 md:gap-6",
                            viewMode === 'list'
                                ? "grid-cols-1"
                                : "grid-cols-1 auto-rows-[minmax(220px,auto)] md:grid-cols-6"
                        )}>
                            <AnimatePresence>
                                {sortedEducations.map((post, index) => (
                                    <motion.div
                                        key={post._id}
                                        layout
                                        className={cn(
                                            "h-full",
                                            viewMode === 'grid' && bentoSpanPattern[index % bentoSpanPattern.length]
                                        )}
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
                                            bentoVariant={bentoStylePattern[index % bentoStylePattern.length]}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EducationManager;

