import React from 'react';
import UserProfileDetails from './userProfileDetails';

const Profile = () => {
    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Your Profile</h1>
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <UserProfileDetails />
            </div>
        </div>
    );
};

export default Profile;
