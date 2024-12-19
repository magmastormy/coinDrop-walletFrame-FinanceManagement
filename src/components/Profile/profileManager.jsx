import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setError } from '../../slices/profileSlice';
import { getUserProfile } from '../../services/profileService'; // Assuming you have a service to fetch user profile
import UserDetails from './userDetails';
import UserProfileDetails from './userProfile';
import './styles/profileStyles.css';

const ProfileManager = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [activeTab, setActiveTab] = useState('user'); // Default to 'user'
    const [userData, setUserData] = useState(null);
    const [userProfileData, setUserProfileData] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            dispatch(setLoading(true));
            try {
                const profileData = await getUserProfile(user.id); // Fetch user profile data
                setUserData(profileData.user);
                setUserProfileData(profileData.profile);
            } catch (err) {
                dispatch(setError(err.message));
            } finally {
                dispatch(setLoading(false));
            }
        };

        fetchUserData();
    }, [dispatch, user.id]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    return (
        <div className="profile-container">
            <h1>User Profile</h1>
            <div className="tabs">
                <button onClick={() => handleTabChange('user')} className={activeTab === 'user' ? 'active' : ''}>
                    User Details
                </button>
                <button onClick={() => handleTabChange('profile')} className={activeTab === 'profile' ? 'active' : ''}>
                    Profile Details
                </button>
            </div>
            <div className="tab-content">
                {activeTab === 'user' && userData && <UserDetails user={userData} />}
                {activeTab === 'profile' && userProfileData && <UserProfileDetails profile={userProfileData} />}
            </div>
        </div>
    );
};

export default ProfileManager;