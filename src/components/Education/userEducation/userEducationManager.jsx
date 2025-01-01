import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CreateEducationPost from './createEditEducationPost';
import EducationPostList from './listUserEducationPost';
import UserEducationInformation from './userEducationInformationBar';
import educationService from '../../../services/educationService';
import { 
    setEducations, 
    setLoading, 
    setError,
    addEducation,
    updateEducation,
    deleteEducation,
    addLike,
    addComment 
} from '../../../slices/educationSlice';
import CommentModal from '../commentModal';
import './styles/userEducationManagerStyles.css';

const UserEducationManager = () => {
    const dispatch = useDispatch();
    const { educations =[], loading, error } = useSelector(state => state.education);
    const { user } = useSelector(state => state.auth);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCommentModal, setShowCommentModal] = useState(false);

    useEffect(() => {
        fetchUserEducations();
    }, []);

    const fetchUserEducations = async () => {
        dispatch(setLoading(true));
        try {
            const response = await educationService.getUserEducations(user.id);
            dispatch(setEducations(response));
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleCreateEducation = async (newEducation) => {
        dispatch(setLoading(true));
        console.log('Create New Education:', newEducation);
        try {
            const response = await educationService.createEducation(newEducation);
            dispatch(addEducation(response));
            setShowCreateModal(false);
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleEditEducation = async (education) => {
        dispatch(setLoading(true));
        try {
            const educationData = {
                title: education.title,
                details: education.details,
                images: education.images || []
            };

            const response = await educationService.updateEducation(education._id, educationData);
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

    return (
        <div className="education-manager-container">
            <div className="manager-header">
                <h1 className="manager-title">My Education Posts</h1>
                <button 
                    className="create-post-btn"
                    onClick={() => setShowCreateModal(true)}
                >
                    Create New Post
                </button>
            </div>

            <UserEducationInformation 
                totalPosts={educations.length || 0}
                user={user}
            />

            {loading ? (
                <div className="loading-state">Loading...</div>
            ) : error ? (
                <div className="error-state">Error: {error}</div>
            ) : (
                <EducationPostList 
                    educations={educations || []}
                    onEdit={handleEditEducation}
                    onDelete={handleDeleteEducation}
                    onLike={handleLike}
                    onComment={handleCommentClick}
                />
            )}

            {showCreateModal && (
                <CreateEducationPost 
                    onCreateEducation={handleCreateEducation}
                    onClose={() => setShowCreateModal(false)}
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

export default UserEducationManager;