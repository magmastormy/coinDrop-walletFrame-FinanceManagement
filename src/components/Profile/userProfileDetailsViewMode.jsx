import React from 'react';




const UserProfileDetailsViewMode = ({ user, profile }) => {
    return (
        <div>
            <div className="info-group">

                <label>Name:</label>
                <span>{`${user?.firstName} ${user?.lastName}`}</span>
            </div>
            <div className="info-group">
                <label>Email:</label>
                <span>{user?.email}</span>
            </div>
            <div className="info-group">
                <label>Phone:</label>
                <span>{profile?.phone || 'Not provided'}</span>
            </div>
            <div className="info-group">
                <label>Bio:</label>
                <p>{profile?.bio || 'No bio available'}</p>
            </div>
            <div className="info-group">
                <label>Interests:</label>
                <p>{profile?.interests?.join(', ') || 'No interests listed'}</p>
            </div>
            <div className="info-group">
                <label>Followers:</label>
                <span>{profile?.followers?.length || 0}</span>
            </div>
            <div className="info-group">
                <label>Following:</label>
                <span>{profile?.following?.length || 0}</span>
            </div>
        </div>
    )
};

export default UserProfileDetailsViewMode;