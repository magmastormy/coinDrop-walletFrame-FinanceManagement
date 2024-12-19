import React from 'react';

const UserProfileDetails = ({ profile }) => {
    return (
        <div className="user-profile-details">
            <h2>Profile Details</h2>
            <p><strong>Bio:</strong> {profile.bio}</p>
            <p><strong>Interests:</strong> {profile.interests.join(', ')}</p>
            <p><strong>Profile Picture:</strong> <img src={profile.profilePicture} alt="Profile" /></p>
            <p><strong>Cover Photo:</strong> <img src={profile.coverPhoto} alt="Cover" /></p>
        </div>
    );
};

export default UserProfileDetails;