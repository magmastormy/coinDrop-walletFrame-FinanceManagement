import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CreateEducationPost from './createEditEducationPost';
import EducationPostList from './listUserEducationPost';
import UserEducationInformation from './userEducationInformationBar';
import educationService from '../../../services/educationService';
import { 
    setEducations, 
    setLoading, 
    setError,
    addEducation 
} from '../../../slices/educationSlice';
import './styles/userEducationManagerStyles.css';

const UserEducationManager = () => {
    const dispatch = useDispatch();
    const { educations =[], loading, error } = useSelector(state => state.education);
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        fetchUserEducations();
    }, []);

    const fetchUserEducations = async () => {
        dispatch(setLoading(true));
        try {
            const response = await educationService.getUserEducations(user.id);
            dispatch(setEducations(response.data));
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
        } catch (err) {
            dispatch(setError(err.message));
        }
    };

    const handleEditEducation = async (id, educationData) => {
        dispatch(setLoading(true));
        try {
            const response = await educationService.updateEducation(id, educationData);
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

    return (
        <div className="education-manager-container">
            <div className="manager-header">
                <h1 className="manager-title">My Education Posts</h1>
                <CreateEducationPost onCreateEducation={handleCreateEducation} />
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
                    onComment={handleComment}
                />
            )}
        </div>
    );
};

export default UserEducationManager;