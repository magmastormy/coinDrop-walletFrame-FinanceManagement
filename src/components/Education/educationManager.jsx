import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
    
    useEffect(() => {
        fetchEducationPosts();
        fetchUserEducationInfo();
    }, []);

    const handleNavigateToUserEducation = () => {
        navigate('/user-education');
    };

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

    const handleLike = async (educationId, userId) => {
        try {
            await educationService.likeEducation(educationId);
            dispatch(addLike({ educationId, userId }));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleComment = async (educationId, commentData) => {
        try {
            const response = await educationService.addComment(educationId, commentData);
            dispatch(addComment({ educationId, comment: response }));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleCommentClick = (educationId) => {
        setSelectedEducationId(educationId);
        setShowCommentModal(true);
    };

    const handleCommentSubmit = async (commentData) => {
        try {
            const response = await educationService.addComment(selectedEducationId, commentData);
            dispatch(addComment({ educationId: selectedEducationId, comment: response }));
            setShowCommentModal(false);
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleSearch = (searchTerm) => {
        if (!searchTerm) {
            setFilteredEducation([]);
            return;
        }
        const results = educations.filter(post =>
            education.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            education.details.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPosts(results);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="education-manager">
            <div className="education-header">
                <EducationNavBar />
                <button 
                    className="create-education-btn"
                    onClick={handleNavigateToUserEducation}
                >
                    My Education Posts ({userEducationInfo?.posts?.length || 0})
                </button>
            </div>
            <EducationSearchBar onSearch={handleSearch} />
            {loading ? (
                <div>Loading...</div>
            ) : error ? (
                <div>Error: {error}</div>
            ) : (
                <EducationGrid 
                    educations={filteredEducation.length ? filteredEducation : educations}
                    onDelete={handleDeleteEducation}
                    onUpdate={handleUpdateEducation}
                    onLike={handleLike}
                    onComment={handleCommentClick}
                />
            )}

            {showCommentModal && (
                <CommentModal
                    isOpen={showCommentModal}
                    onClose={() => setShowCommentModal(false)}
                    onSubmit={handleCommentSubmit}
                />
            )}
        </div>
    );
};

export default EducationManager;