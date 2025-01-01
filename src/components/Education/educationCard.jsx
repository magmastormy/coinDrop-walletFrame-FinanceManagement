import React, { useState } from 'react';
import EducationFullDetail from './educationFullDetailModal';
import './styles/educationCardStyles.css';

const EducationCard = ({education, onLike, onComment, onEdit, onDelete }) => {
    const [showFullDetail, setShowFullDetail] = useState(false);
    console.log("--> Education containment: ", education);

    const getAuthorName = (author) => {
        //because author has 3 objects id, _id and username
        if (!author) return 'Unknown';
        return author.username || `${author.firstName} ${author.lastName}` || 'Anonymous';
    };

    return (
        <div className="education-card">
            <h3>{education.title}</h3>
            <p>{education.details.substring(0, 100)}...</p>
            <div className="education-meta">
                <span>Author: {getAuthorName(education.author)}</span>
                <span>Date: {new Date(education.date).toLocaleDateString()}</span>
                <span>Likes: {education.likes?.length || 0}</span>
            </div>
            <div className="education-actions">
                <button onClick={() => onLike(education._id)}>Like</button>
                <button onClick={() => onComment(education._id)}>Comment</button>
                {education.isAuthor && (
                    <>
                        <button onClick={() => onEdit(education)}>Edit</button>
                        <button onClick={() => onDelete(education._id)}>Delete</button>
                    </>
                )}
            </div>
            {showFullDetail && (
                <EducationFullDetail
                    education={{
                        ...education,
                        author: getAuthorName(education.author)
                    }}
                    onComment={onComment}
                    onLike={onLike}
                />
            )}
        </div>
    );
};

export default EducationCard;