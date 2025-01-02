import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch, 
    faPlus, 
    faFilter,
    faSort,
    faBookOpen
} from '@fortawesome/free-solid-svg-icons';
import EducationNavBar from './educationNavBar';
import EducationSearchBar from './educationSearchBar';
import EducationGrid from './educationPostsGrid';
import educationService from '../../services/educationService';
import { 
    setEducations, 
    setLoading, 
    setError,
    addEducation,
    updateEducation,
    deleteEducation,
    addLike,
    removeLike,
    addComment,
    deleteComment 
} from '../../slices/educationSlice';
import CommentModal from './commentModal';
import './styles/educationManagerStyles.css';

const EducationManager = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { educations, loading, error } = useSelector(state => state.education);
    const [filteredEducation, setFilteredEducation] = useState([]);
    const [userEducationInfo, setUserEducationInfo] = useState(null);
    const {user} = useSelector(state => state.auth);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [selectedEducationId, setSelectedEducationId] = useState(null);
    const [sortBy, setSortBy] = useState('date'); // 'date', 'likes', 'comments'
    const [filterBy, setFilterBy] = useState('all'); // 'all', 'mine', 'liked'
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchEducationPosts();
        fetchUserEducationInfo();
    }, []);

    useEffect(() => {
        applyFiltersAndSort();
    }, [educations, sortBy, filterBy, searchQuery]);

    const fetchEducationPosts = async () => {
        dispatch(setLoading(true));
        try {
            const response = await educationService.getEducations();
            dispatch(setEducations(response));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const fetchUserEducationInfo = async () => {
        try {
            const response = await educationService.getUserEducations(user.id);
            setUserEducationInfo(response.data);
        } catch (err) {
            console.error('Error fetching user education info:', err);
        }
    };

    const handleNavigateToUserEducation = () => {
        navigate('/user-education');
    };

    const handleCreateEducation = async (postData) => {
        dispatch(setLoading(true));
        try {
            const response = await educationService.createEducation(postData);
            dispatch(addEducation(response));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleUpdateEducation = async (id, postData) => {
        dispatch(setLoading(true));
        try {
            const response = await educationService.updateEducation(id, postData);
            dispatch(updateEducation(response));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleDeleteEducation = async (id) => {
        try {
            await educationService.deleteEducation(id);
            dispatch(deleteEducation(id));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleLike = async (educationId) => {
        try {
            await educationService.likeEducation(educationId);
            dispatch(addLike({ educationId, userId: user.id }));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleUnlike = async (educationId) => {
        try {
            await educationService.unlikeEducation(educationId);
            dispatch(removeLike({ educationId, userId: user.id }));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleComment = async (educationId, commentData) => {
        try {
            const response = await educationService.addComment(educationId, commentData);
            dispatch(addComment({ educationId, comment: response }));
            setShowCommentModal(false);
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleDeleteComment = async (educationId, commentId) => {
        try {
            await educationService.deleteComment(educationId, commentId);
            dispatch(deleteComment({ educationId, commentId }));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const applyFiltersAndSort = () => {
        let filtered = [...educations];

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(edu => 
                edu.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                edu.details.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply category filter
        switch (filterBy) {
            case 'mine':
                filtered = filtered.filter(edu => edu.author?._id === user.id);
                break;
            case 'liked':
                filtered = filtered.filter(edu => edu.likes?.includes(user.id));
                break;
            default:
                break;
        }

        // Apply sorting
        switch (sortBy) {
            case 'date':
                filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'likes':
                filtered.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
                break;
            case 'comments':
                filtered.sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0));
                break;
            default:
                break;
        }

        setFilteredEducation(filtered);
    };

    return (
        <div className="education-manager">
            <header className="education-header">
                <div className="education-title">
                    <FontAwesomeIcon icon={faBookOpen} />
                    <h1>Education Hub</h1>
                </div>
                <motion.button
                    className="create-education-btn"
                    onClick={handleNavigateToUserEducation}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>My Education Dashboard</span>
                </motion.button>
            </header>

            <div className="education-controls">
                <div className="search-filter-container">
                    <div className="search-bar">
                        <FontAwesomeIcon icon={faSearch} />
                        <input
                            type="text"
                            placeholder="Search education posts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <motion.button
                        className="filter-toggle"
                        onClick={() => setShowFilters(!showFilters)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FontAwesomeIcon icon={faFilter} />
                        <span>Filters</span>
                    </motion.button>

                    <motion.button
                        className="sort-toggle"
                        onClick={() => setSortBy(current => {
                            const options = ['date', 'likes', 'comments'];
                            const currentIndex = options.indexOf(current);
                            return options[(currentIndex + 1) % options.length];
                        })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FontAwesomeIcon icon={faSort} />
                        <span>Sort by {sortBy}</span>
                    </motion.button>
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div 
                            className="filters-panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                        >
                            <div className="filter-options">
                                <button 
                                    className={`filter-btn ${filterBy === 'all' ? 'active' : ''}`}
                                    onClick={() => setFilterBy('all')}
                                >
                                    All Posts
                                </button>
                                <button 
                                    className={`filter-btn ${filterBy === 'mine' ? 'active' : ''}`}
                                    onClick={() => setFilterBy('mine')}
                                >
                                    My Posts
                                </button>
                                <button 
                                    className={`filter-btn ${filterBy === 'liked' ? 'active' : ''}`}
                                    onClick={() => setFilterBy('liked')}
                                >
                                    Liked Posts
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {error && (
                <motion.div 
                    className="error-message"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {error}
                </motion.div>
            )}

            <EducationGrid 
                educations={filteredEducation}
                onLike={handleLike}
                onUnlike={handleUnlike}
                onComment={(id) => {
                    setSelectedEducationId(id);
                    setShowCommentModal(true);
                }}
                onEdit={handleUpdateEducation}
                onDelete={handleDeleteEducation}
                loading={loading}
                currentUserId={user.id}
            />

            <AnimatePresence>
                {showCommentModal && selectedEducationId && (
                    <CommentModal
                        educationId={selectedEducationId}
                        onClose={() => {
                            setShowCommentModal(false);
                            setSelectedEducationId(null);
                        }}
                        onSubmit={handleComment}
                        onDelete={handleDeleteComment}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default EducationManager;