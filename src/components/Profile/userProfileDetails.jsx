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
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

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
        <Paper sx={{ p: 2, position: 'relative' }}>
            {loading && <Box position="absolute" inset={0} display="flex" justifyContent="center" alignItems="center" bgcolor="rgba(255,255,255,0.7)"><CircularProgress/></Box>}
            {error && <Alert severity="error">{error}</Alert>}
            <Grid container spacing={2}>
                <Grid item xs={12} md={4} display="flex" flexDirection="column" alignItems="center">
                    {isEditing ? (
                        <ImageUpload onImageUpload={handleProfileImageUpload} onImageRemove={handleProfileImageRemove} currentImage={formData.profilePicture} imageType="profile" />
                    ) : (
                        <Avatar src={formData.profilePicture || ''} sx={{ width: 120, height: 120 }} />
                    )}
                    {!isEditing && (
                        <Button startIcon={<EditIcon />} onClick={() => setIsEditing(true)} sx={{ mt: 2 }}>
                            {profile ? 'Edit Profile' : 'Create Profile'}
                        </Button>
                    )}
                </Grid>
                <Grid item xs={12} md={8}>
                    <Typography variant="h5" gutterBottom>{user?.username}'s Profile</Typography>
                    {isEditing ? (
                        <Box component="form" onSubmit={handleSubmit} display="grid" gap={2}>
                            <TextField label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} required fullWidth />
                            <TextField label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} required fullWidth />
                            <TextField label="Email" name="email" value={formData.email} onChange={handleInputChange} required fullWidth disabled />
                            <TextField label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} fullWidth />
                            <TextField label="Bio" name="bio" value={formData.bio} onChange={handleInputChange} multiline rows={3} fullWidth />
                            <FormGroup row>
                                {allowedInterests.map(interest => (
                                    <FormControlLabel key={interest} control={<Checkbox checked={formData.interests.includes(interest)} onChange={() => handleCheckboxChange(interest)} />} label={interest} />
                                ))}
                            </FormGroup>
                            <Box display="flex" gap={2}>
                                <Button type="submit" variant="contained" startIcon={<SaveIcon />}>Save</Button>
                                <Button variant="outlined" onClick={() => setIsEditing(false)}>Cancel</Button>
                            </Box>
                        </Box>
                    ) : (
                        <ViewProfileDetailsOnly user={user} profile={profile} />
                    )}
                </Grid>
            </Grid>
        </Paper>
    );
};

export default UserProfileDetails;
