import React from 'react';
import './styles/educationFullDetailStyles.css';

const EducationFullDetail = ({ education, onComment, onLike}) => {
    return (
        <div className="education-full-detail">
            <h2>{education.title}</h2>
            <p>{education.details}</p>
            <div className="education-meta">
                <span>Author: {education.author}</span>
                <span>Date: {new Date(education.date).toLocaleDateString()}</span>
                <span>Likes: {education.likes?.length || 0}</span>
            </div>
            <div className="education-actions">
                <button onClick={() => onLike(education._id)}>Like</button>
                <button onClick={() => onComment(education._id)}>Comment</button>
            </div>
            <div className="education-comments">
                {education.comments?.map(comment => (
                    <div key={comment._id} className="comment">
                        <p>{comment.text}</p>
                        <span>{new Date(comment.date).toLocaleDateString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default EducationFullDetail;