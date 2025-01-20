import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ViewProfileDetailsOnly from './userProfileDetailsViewMode';
import ImageUpload from './imageUpload';
import profileService from '../../services/profileService';
import {
    fetchProfileStart,
    fetchProfileSuccess,
    fetchProfileFailure,
    createProfileStart,
    createProfileSuccess,
    createProfileFailure,
    updateProfileStart,
    updateProfileSuccess,
    updateProfileFailure
} from '../../slices/profileSlice';
import './styles/profileStyles.css';

const UserProfileDetails = () => {
    const [isEditing, setIsEditing] = useState(false);
    const dispatch = useDispatch();
    
    const { user } = useSelector(state => state.auth);
    const { profile, loading, error } = useSelector(state => state.profile);

    const [formData, setFormData] = useState({
        bio: '',
        interests: [],
        phone: '',
        profilePicture: '',
        firstName: '',
        lastName: '',
        email: '',
    });

    const allowedInterests = [
        'investing',
        'budgeting',
        'saving',
        'crypto',
        'stocks',
        'real-estate',
        'retirement',
        'taxes',
        'insurance'
    ];

    useEffect(() => {
        if (profile || user) {
            setFormData({
                bio: profile?.bio || '',
                interests: Array.isArray(profile?.interests) ? profile.interests : [],
                phone: profile?.phone || '',
                profilePicture: profile?.profilePicture || '',
                firstName: user?.firstName || '',
                lastName: user?.lastName || '',
                email: user?.email || '',
            });
        }
    }, [profile, user]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!user?.id) return;
            
            try {
                dispatch(fetchProfileStart());
                const profileData = await profileService.getUserProfile(user.id);
                console.log('[Profile] Profile data:', profileData);
                
                if (profileData.profile) {
                    dispatch(fetchProfileSuccess(profileData.profile));
                } else {
                    setIsEditing(true);
                    dispatch(fetchProfileSuccess(null));
                }
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    setIsEditing(true);
                    dispatch(fetchProfileSuccess(null));
                } else {
                    dispatch(fetchProfileFailure(error.message)); 
                }
            }
        };

        fetchUserProfile();
    }, [dispatch, user?.id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'interests') {
            setFormData(prev => ({
                ...prev,
                interests: value ? value.split(',').map(item => item.trim()) : []
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleCheckboxChange = (interest) => {
        setFormData(prev => {
            const interests = prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest];
            return { ...prev, interests };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validate profilePicture field
            if (formData.profilePicture && !isValidUrl(formData.profilePicture)) {
                throw new Error('Profile picture must be a valid URL');
            }

            // Validate interests
            const invalidInterests = formData.interests.filter(interest => !allowedInterests.includes(interest));
            if (invalidInterests.length > 0) {
                throw new Error(`Invalid interests: ${invalidInterests.join(', ')}`);
            }

            console.log('[userProfileDetails] Submitting form data:', formData);
            if (!profile) {
                dispatch(createProfileStart());
                const result = await profileService.createUserProfile(user.id, formData);
                dispatch(createProfileSuccess(result.profile));
            } else {
                dispatch(updateProfileStart());
                const result = await profileService.updateUserProfile(user.id, formData);
                dispatch(updateProfileSuccess(result.profile));
            }
            setIsEditing(false);
        } catch (err) {
            console.error('[userProfileDetails] Profile operation error:', err);
            const action = profile ? updateProfileFailure : createProfileFailure;
            dispatch(action(err.message || 'Operation failed. Please try again.'));
        }
    };

    const handleProfileImageUpload = async (file) => {
        try {
            console.log('[UserProfileDetails] Starting image upload:', file);
            const result = await profileService.uploadProfileImage(user.id, file);
            console.log('[UserProfileDetails] Upload Image result:', result);

            if (result && result.profile) {
                setFormData(prev => ({
                    ...prev,
                    profilePicture: {
                        url: result.profile.profilePicture,
                        publicId: result.profile.publicId
                    }
                }));
            } else {
                throw new Error('Image upload failed. Please try again.');
            }
        } catch (error) {
            console.error('[UserProfileDetails] Image upload error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred';
            dispatch(updateProfileFailure(errorMessage));
        }
    };

    const handleProfileImageRemove = async () => {
        try {
            await profileService.deleteProfileImage();
            setFormData(prev => ({
                ...prev,
                profilePicture: null
            }));
        } catch (error) {
            dispatch(updateProfileFailure(error.message));
        }
    };

    // Helper function to validate URL
    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch (_) {
            return false;
        }
    };

    return (
        <div className="profile-container">
            {loading && <div className="loading-overlay">Loading...</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="profile-content">
                <div className="profile-image-section">
                    {isEditing && (
                        <ImageUpload 
                            onImageUpload={handleProfileImageUpload}
                            onImageRemove={handleProfileImageRemove}
                            currentImage={formData.profilePicture || 'https://placeholder.pics/svg/150'}
                            imageType="profile"
                        />
                    )}
                </div>
                <div className="profile-header">
                    <h2>{user?.username}'s Profile</h2>
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="btn-edit"
                    >
                        {profile ? 'Edit Profile' : 'Create Profile'}
                    </button>
                </div>

                <div className="profile-display">
                    <div className="profile-picture" style={{ width: '150px', height: '150px' }}>
                        <img 
                            src={formData.profilePicture || 'https://placeholder.pics/svg/150'} 
                            alt={`${user?.username}'s profile`} 
                            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                        />
                    </div>

                    <div className="profile-info">
                        {isEditing ? (
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>First Name:</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name:</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone:</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Bio:</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Interests:</label>
                                    {allowedInterests.map(interest => (
                                        <div key={interest}>
                                            <input
                                                type="checkbox"
                                                id={interest}
                                                checked={formData.interests.includes(interest)}
                                                onChange={() => handleCheckboxChange(interest)}
                                            />
                                            <label htmlFor={interest}>{interest}</label>
                                        </div>
                                    ))}
                                </div>

                                <div className="edit-actions">
                                    <button type="submit" className="btn-save">
                                        {profile ? 'Save Changes' : 'Create Profile'}
                                    </button>
                                    {profile && (
                                        <button 
                                            type="button" 
                                            onClick={() => setIsEditing(false)} 
                                            className="btn-cancel"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        ) : (
                            <ViewProfileDetailsOnly user={user} profile={profile} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileDetails;
