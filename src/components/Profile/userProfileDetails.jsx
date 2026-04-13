import { useLogger } from '../../hooks/useLogger.jsx';

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Edit, Save, Loader2 } from 'lucide-react';
import ViewProfileDetailsOnly from './userProfileDetailsViewMode';
import ImageUpload from './imageUpload';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
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
                logInfo('[Profile] Profile data:', profileData);

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
            // Prepare the form data for submission
            const profileData = { ...formData };

            // Handle profilePicture validation - could be a string URL or an object with url property
            if (profileData.profilePicture) {
                // If it's an object with a url property, extract just the URL
                if (typeof profileData.profilePicture === 'object' && profileData.profilePicture.url) {
                    profileData.profilePicture = profileData.profilePicture.url;
                }

                // Now validate the URL
                if (typeof profileData.profilePicture === 'string' && !isValidUrl(profileData.profilePicture)) {
                    throw new Error('Profile picture must be a valid URL');
                }
            }

            // Validate interests
            const invalidInterests = profileData.interests.filter(interest => !allowedInterests.includes(interest));
            if (invalidInterests.length > 0) {
                throw new Error(`Invalid interests: ${invalidInterests.join(', ')}`);
            }

            logInfo('[userProfileDetails] Submitting form data:', profileData);
            if (!profile) {
                dispatch(createProfileStart());
                const result = await profileService.createUserProfile(profileData);
                dispatch(createProfileSuccess(result.profile));
            } else {
                dispatch(updateProfileStart());
                const result = await profileService.updateUserProfile(profileData);
                dispatch(updateProfileSuccess(result.profile));
            }
            setIsEditing(false);
        } catch (err) {
            logError('[userProfileDetails] Profile operation error:', err);
            const action = profile ? updateProfileFailure : createProfileFailure;
            dispatch(action(err.message || 'Operation failed. Please try again.'));
        }
    };

    const handleProfileImageUpload = async (file) => {
        try {
            logInfo('[UserProfileDetails] Starting image upload:', file);
            const result = await profileService.uploadProfileImage(file);
            logInfo('[UserProfileDetails] Upload Image result:', result);

            // Check if we have a result with a URL
            if (result && result.url) {
                // Set the profile picture as a string URL
                setFormData(prev => ({
                    ...prev,
                    profilePicture: result.url
                }));

                // Show success message
                dispatch(updateProfileSuccess({
                    ...profile,
                    profilePicture: result.url
                }));
            } else if (result && result.profile && result.profile.profilePicture) {
                // Alternative format - profile object with profilePicture
                setFormData(prev => ({
                    ...prev,
                    profilePicture: result.profile.profilePicture
                }));

                dispatch(updateProfileSuccess(result.profile));
            } else {
                throw new Error('Image upload failed. Please try again.');
            }
        } catch (error) {
            logError('[UserProfileDetails] Image upload error:', error);
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
        <div className="relative">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10 rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}
            {error && (
                <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    {error}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Profile Image */}
                <div className="flex flex-col items-center space-y-4">
                    {isEditing ? (
                        <ImageUpload
                            onImageUpload={handleProfileImageUpload}
                            onImageRemove={handleProfileImageRemove}
                            currentImage={formData.profilePicture}
                            imageType="profile"
                        />
                    ) : (
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                            {formData.profilePicture ? (
                                <img
                                    src={formData.profilePicture}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-4xl text-muted-foreground">
                                    {user?.username?.[0]?.toUpperCase() || 'U'}
                                </span>
                            )}
                        </div>
                    )}
                    {!isEditing && (
                        <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            {profile ? 'Edit Profile' : 'Create Profile'}
                        </Button>
                    )}
                </div>

                {/* Right Column - Profile Information */}
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-semibold text-foreground mb-6">{user?.username}&apos;s Profile</h2>
                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="First Name"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                required
                            />
                            <Input
                                label="Last Name"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                required
                            />
                            <Input
                                label="Email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                disabled
                            />
                            <Input
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                            />
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-3">Interests</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {allowedInterests.map(interest => (
                                        <label key={interest} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.interests.includes(interest)}
                                                onChange={() => handleCheckboxChange(interest)}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                                            />
                                            <span className="text-sm text-foreground capitalize">{interest}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button type="submit" className="flex items-center gap-2">
                                    <Save className="w-4 h-4" />
                                    Save
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsEditing(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <ViewProfileDetailsOnly user={user} profile={profile} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfileDetails;
