import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../contexts/authContext';
import { Grid, LayoutGrid, RefreshCw, ArrowDownAZ } from 'lucide-react';
import educationService from '../../services/educationService';
import {
    setEducations,
    setLoading,
    setError,
} from '../../slices/educationSlice';

// Components
import EducationCard from './educationCard';
import EducationSearchBar from './educationSearchBar';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';
import PageHeader from '../Common/PageHeader';

const EducationManager = () => {
    const dispatch = useDispatch();
    const { educations, loading, error } = useSelector(state => state.education);
    const { user } = useAuth();

    // UI State
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'popular', 'title'
    const fetchEducationPosts = async () => {
        dispatch(setLoading(true));
        try {
            const response = await educationService.getEducations();
            // Extract data from axios response, handling both axios response and plain data
            const educationsData = response?.data || response || [];
            dispatch(setEducations(educationsData));
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
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <PageHeader
                title="Education"
                actions={(
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1', minWidth: '200px', maxWidth: '300px' }}>
                            <EducationSearchBar onSearch={handleSearch} />
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ position: 'relative' }}>
                                <ArrowDownAZ style={{
                                    position: 'absolute',
                                    left: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '14px',
                                    height: '14px',
                                    color: 'var(--color-text-muted)',
                                    pointerEvents: 'none'
                                }} />
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    style={{
                                        height: '36px',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-surface-2)',
                                        paddingLeft: '32px',
                                        paddingRight: '24px',
                                        fontSize: '13px',
                                        color: 'var(--color-text-primary)',
                                        outline: 'none',
                                        fontFamily: 'var(--font-body)',
                                        minWidth: '100px'
                                    }}
                                    aria-label="Sort education posts"
                                >
                                    <option value="newest">Newest</option>
                                    <option value="oldest">Oldest</option>
                                    <option value="popular">Popular</option>
                                    <option value="title">A-Z</option>
                                </select>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleViewModeChange}
                                style={{ flexShrink: 0 }}
                                title="Toggle view"
                            >
                                {viewMode === 'grid' ? <Grid className="w-4 h-4" strokeWidth={1.5} /> : <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />}
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={fetchEducationPosts}
                                style={{ flexShrink: 0 }}
                                title="Refresh"
                            >
                                <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                        </div>
                    </div>
                )}
            />

            {/* Chip Filter Bar Below Header */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '16px 32px',
                borderBottom: '1px solid var(--color-border)',
                flexWrap: 'wrap'
            }}>
                <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--color-text-secondary)',
                    marginRight: '8px'
                }}>Category:</span>
                {['all', 'budgeting', 'saving', 'investing', 'debt', 'retirement'].map(category => (
                    <button
                        key={category}
                        onClick={() => handleCategorySelect(category)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: '13px',
                            fontWeight: 500,
                            border: '1px solid var(--color-border)',
                            background: selectedCategory === category ? 'var(--color-gold)' : 'var(--color-surface-1)',
                            color: selectedCategory === category ? 'white' : 'var(--color-text-primary)',
                            cursor: 'pointer',
                            transition: 'all 150ms',
                            fontFamily: 'var(--font-body)'
                        }}
                        onMouseEnter={e => {
                            if (selectedCategory !== category) {
                                e.target.style.background = 'var(--color-surface-2)';
                            }
                        }}
                        onMouseLeave={e => {
                            if (selectedCategory !== category) {
                                e.target.style.background = 'var(--color-surface-1)';
                            }
                        }}
                    >
                        {category === 'all' ? 'All Posts' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                ))}
            </div>

            <div style={{ margin: '12px 32px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                Showing <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{sortedEducations?.length || 0}</span> posts
            </div>

            {/* Error Alert */}
            {error && (
                <div style={{
                    margin: '0 32px 16px',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'rgba(239, 68, 68, 0.9)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span>{error}</span>
                    <button
                        onClick={() => dispatch(setError(null))}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(239, 68, 68, 0.9)',
                            fontSize: '20px',
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Education Posts Grid/List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px' }}>
                {!sortedEducations || sortedEducations.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        textAlign: 'center',
                        padding: '64px'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: 'var(--radius-xl)',
                            background: 'rgba(212, 175, 55, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '24px',
                            color: 'var(--color-gold)'
                        }}>
                            <Grid className="w-10 h-10" />
                        </div>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            color: 'var(--color-text-primary)',
                            marginBottom: '12px',
                            fontFamily: 'var(--font-display)'
                        }}>
                            {searchQuery ? 'No Results Found' : 'No Education Posts Yet'}
                        </h2>
                        <p style={{
                            fontSize: '16px',
                            color: 'var(--color-text-secondary)',
                            maxWidth: '480px',
                            lineHeight: 1.6,
                            fontFamily: 'var(--font-body)'
                        }}>
                            {searchQuery ?
                                `No results found for "${searchQuery}". Try a different search term or browse all posts.` :
                                "Education content is being prepared. Check back soon for helpful financial tips and guides."}
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gap: '20px',
                        paddingBottom: '16px',
                        gridTemplateColumns: viewMode === 'list' ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))'
                    }}>
                        <AnimatePresence>
                            {sortedEducations.map((post, index) => (
                                <motion.div
                                    key={post._id}
                                    layout
                                    style={{ height: '100%' }}
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
                                        bentoVariant={viewMode === 'grid' ? bentoStylePattern[index % bentoStylePattern.length] : 'standard'}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EducationManager;

