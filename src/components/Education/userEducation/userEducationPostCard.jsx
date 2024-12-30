import React from 'react';
import './styles/userEducationPostCardStyles.css';

const UserEducationPostCard = ({ education, onEdit, onDelete, onLike, onComment}) => {
    return (
        <div className="user-education-card">
            <h3>{education.title}</h3>
            <p>{education.details.substring(0, 100)}...</p>
            <div className="education-meta">
                <span>Author: {education.author}</span>
                <span>Date: {new Date(education.date).toLocaleDateString()}</span>
                <span>Likes: {education.likes?.length || 0}</span>
                <span>Comments: {education.comments?.length || 0}</span>
            </div>
            <div className="education-actions">
                <button onClick={() => onLike(education._id)}>Like</button>
                <button onClick={() => onComment(education._id)}>Comment</button>
                <button onClick={() => onEdit(education)}>Edit</button>
                <button onClick={() => onDelete(education._id)}>Delete</button>
            </div>
        </div>
    );
};

export default UserEducationPostCard;
