// src/components/Education/userEducation/listUserEducationPost.jsx
import UserEducationCard from './userEducationPostCard';
import React from 'react';
import './styles/listUserEducationPostStyles.css';

const ListUserEducationPost = ({ 
    educations,
    onEdit,
    onDelete,
    onLike,
    onComment 
}) => {
    if (!educations.length) {
        return <div className="empty-state">No education posts available</div>;
    }

    return (
        <div className="user-education-list">
            {educations.map(education => (
                <UserEducationCard 
                    key={education._id}
                    education={education}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onLike={onLike}
                    onComment={onComment}
                />
            ))}
        </div>
    );
};

export default ListUserEducationPost;