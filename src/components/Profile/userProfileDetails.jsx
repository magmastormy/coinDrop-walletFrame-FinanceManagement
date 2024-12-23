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

    useEffect(() => {
        // Update form data when profile or user data changes
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
                
                if (!profileData.profile) {
                    console.log('No profile found, enabling edit mode');
                    setIsEditing(true);
                    dispatch(fetchProfileSuccess(null));
                } else {
                    console.log('Profile found:', profileData.profile);
                    dispatch(fetchProfileSuccess(profileData.profile));
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
                if (err.response?.status === 404) {
                    setIsEditing(true);
                    dispatch(fetchProfileSuccess(null));
                } else {
                    dispatch(fetchProfileFailure(err.message));
                }
            }
        };

        if (user?.id && !profile) {
            fetchUserProfile();
        }
    }, [dispatch, user?.id, profile]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validate profilePicture field
            if (formData.profilePicture && !isValidUrl(formData.profilePicture)) {
                throw new Error('Profile picture must be a valid URL');
            }

            console.log('Submitting form data:', formData);
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
            console.error('Profile operation error:', err);
            const action = profile ? updateProfileFailure : createProfileFailure;
            dispatch(action(
                err.response?.status === 401 
                    ? 'Your session has expired. Please log in again.'
                    : err.message || 'Operation failed. Please try again.'
            ));
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
            <div className="form-group">
                <ImageUpload 
                    onImageSelect={(file) => {
                        //TODO: Handle the file upload here
                        const reader = new FileReader();
                        reader.onload = () => {
                            setFormData(prev => ({
                                ...prev,
                                profilePicture: reader.result
                            }));
                        };
                        reader.readAsDataURL(file);
                    }} 
                />
            </div>
                <div className="profile-header">
                <div className="profile-header">
                    <h2>{user?.username}'s Profile</h2>
                    {/* Show Edit button if there's a profile and not in edit mode */}
                    {!isEditing && profile && (
                        <button 
                            onClick={() => setIsEditing(true)} 
                            className="btn-edit"
                        >
                            Edit Profile
                        </button>
                    )}
                    {/* Show Create Profile button if there's no profile and not in edit mode */}
                    {!isEditing && !profile && (
                        <button 
                            onClick={() => setIsEditing(true)} 
                            className="btn-edit"
                        >
                            Create Profile
                        </button>
                    )}
                </div>

                <div className="profile-display">
                    <div className="profile-picture">
                        <img 
                            src={profile?.profilePicture || 'default-avatar.png'} 
                            alt={`${user?.username}'s profile`} 
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
                                    <input
                                        type="text"
                                        name="interests"
                                        value={Array.isArray(formData.interests) ? formData.interests.join(', ') : ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter interests separated by commas"
                                    />
                                </div>


                                <div className="edit-actions">
                                    <button type="submit" className="btn-save">
                                        {profile ? 'Save Changes' : 'Create Profile'}
                                    </button>
                                    {/* Only show Cancel if we have an existing profile */}
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
        </div>
    );
};

export default UserProfileDetails;
