import React from 'react';
import './styles/userEducationInformationBarStyles.css';

const UserEducationInformation = ({ totalPosts, user }) => {
    return (
        <div className="user-education-info-bar">
            <div className="user-education-stats-container">
                <div className="user-education-stat-item">
                    <div className="user-education-stat-value">{totalPosts}</div>
                    <div className="user-education-stat-label">Total Posts</div>
                </div>
                <div className="user-education-user-info">
                    <div className="user-education-info-label">Author:</div>
                    <div className="user-education-info-value">{user?.username}</div>
                </div>
            </div>
        </div>
    );
};

export default UserEducationInformation;