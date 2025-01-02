import React from 'react';
import './styles/userEducationInformationBarStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faFileLines } from '@fortawesome/free-solid-svg-icons';

const UserEducationInformation = ({ totalPosts, user }) => {
    return (
        <div className="user-education-information-bar">
            <div className="user-info">
                <FontAwesomeIcon icon={faUser} className="user-icon" />
                <div className="user-details">
                    <span className="user-name">{user?.username}</span>
                    <span className="user-email">{user?.email}</span>
                </div>
            </div>
            <div className="post-stats">
            <FontAwesomeIcon icon={faFileLines} className="post-icon"/>
                <span className="total-posts">Total Posts: {totalPosts}</span>
            </div>
        </div>
    );
};

export default UserEducationInformation;