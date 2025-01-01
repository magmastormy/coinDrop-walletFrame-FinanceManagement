import React, { useState } from 'react';
import EducationFullDetailModal from './educationFullDetailModal';
import EducationRenderer from './educationRenderer';
import './styles/educationCardStyles.css';

const EducationCard = ({education, onLike, onComment, onEdit, onDelete }) => {
    const [showFullDetail, setShowFullDetail] = useState(false);
    console.log("--> Education containment: ", education);

    const getAuthorName = (author) => {
        if (!author) return 'Unknown';
        return author.username || `${author.firstName} ${author.lastName}` || 'Anonymous';
    };

    return (
        <div className="education-card-container">
            <h3 className="education-card-title">{education.title}</h3>
            <div className="education-card-details">
                <EducationRenderer content={education.details} maxLength={100} />
            </div>
            <div className="education-card-meta">
                <span className="education-card-author">Author: {getAuthorName(education.author)}</span>
                <span className="education-card-date">Date: {new Date(education.date).toLocaleDateString()}</span>
                <span className="education-card-likes">Likes: {education.likes?.length || 0}</span>
            </div>  
            <div className="education-card-actions"> 
                <button onClick={() => setShowFullDetail(true)}>Read</button>
                <button onClick={() => onLike(education._id)}>Like</button>
                <button onClick={() => setShowFullDetail(true)}>Comment</button> 
                {education.isEditable && ( 
                    <>
                        <button onClick={() => onEdit(education)}>Edit</button>
                        <button onClick={() => onDelete(education._id)}>Delete</button>
                    </>
                )}
            </div>
            {showFullDetail && (
                <EducationFullDetailModal
                    education={education}
                    authorName={getAuthorName(education.author)}
                    onComment={onComment}
                    onLike={onLike}
                    onClose={() => {
                        setShowFullDetail(false);
                    }}
                />
            )}
        </div>
    );
};

export default EducationCard;