import React from 'react';
import './styles/userEducationInformationBarStyles.css';

const UserEducationInformation = ({ totalPosts, user }) => {
    return (
        <div className="info-bar">
            <div className="stats-container">
                <div className="stat-item">
                    <div className="stat-value">{totalPosts}</div>
                    <div className="stat-label">Total Posts</div>
                </div>
                <div className="user-info">
                    <div className="info-label">Author:</div>
                    <div className="info-value">{user?.username}</div>
                </div>
            </div>
        </div>
    );
};

export default UserEducationInformation;