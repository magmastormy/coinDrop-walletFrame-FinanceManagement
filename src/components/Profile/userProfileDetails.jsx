import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileModal from './profileModal';
import ViewProfileDetailsOnly from './userProfileDetailsViewMode';
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
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const dispatch = useDispatch();
    
    const { user } = useSelector(state => state.auth);
    const { profile, loading, error } = useSelector(state => state.profile);

    const [formData, setFormData] = useState({
        bio: profile?.bio || '',
        interests: Array.isArray(profile?.interests) ? profile?.interests : [],
        phone: profile?.phone || '',
        profilePicture: profile?.profilePicture || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
    });

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                dispatch(fetchProfileStart());
                const profileData = await profileService.getUserProfile(user.id);
                dispatch(fetchProfileSuccess(profileData.profile));
                if (!profileData.profile) {
                    setShowCreateModal(true);
                }
            } catch (err) {
                dispatch(fetchProfileFailure(err.message));
            }
        };

        if (user?.id) {
            fetchUserProfile();
        }
    }, [dispatch, user?.id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Special handling for interests
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

    const handleCreateProfile = async (e) => {
        e.preventDefault();
        try {
            dispatch(createProfileStart());
            const result = await profileService.createUserProfile(user.id, formData);
            dispatch(createProfileSuccess(result.profile));
            setShowCreateModal(false);
        } catch (err) {
            dispatch(createProfileFailure(err.message));
        }
    };

    const handleUpdateProfile = async () => {
        try {
            dispatch(updateProfileStart());
            const result = await profileService.updateUserProfile(user.id, formData);
            dispatch(updateProfileSuccess(result.profile));
            setIsEditing(false);
        } catch (err) {
            dispatch(updateProfileFailure(err.message));
        }
    };

    return (
        <div className="profile-container">
            {loading && <div className="loading-overlay">Loading...</div>}
            {error && <div className="error-message">{error}</div>}

            <ProfileModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Complete Your Profile"
            >
                <form onSubmit={handleCreateProfile} className="profile-form">
                    <h3>Basic Information</h3>
                    <div className="form-row">
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
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={user?.email}
                            disabled
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
                            placeholder="Tell us about yourself"
                        />
                    </div>
                    <button type="submit" className="btn-primary">
                        Create Profile
                    </button>
                </form>
            </ProfileModal>

            <div className="profile-content">
                <div className="profile-header">
                    <h2>{user?.username}'s Profile</h2>
                    {!isEditing && !showCreateModal && (
                        <button onClick={() => setIsEditing(true)} className="btn-edit">
                            Edit Profile
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
                            // Edit Mode
                            <form onSubmit={handleUpdateProfile}>
                                <div className="form-group">
                                    <label>First Name:</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name:</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
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
                                    <button type="submit" className="btn-save">Save Changes</button>
                                    <button type="button" onClick={() => setIsEditing(false)} className="btn-cancel">Cancel</button>
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