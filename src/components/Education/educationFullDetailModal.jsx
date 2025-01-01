import React, { useEffect, useState } from 'react';
import EducationRenderer from './educationRenderer';
import './styles/educationFullDetailStyles.css';

const EducationFullDetailModal = ({ education, onClose, onLike, onComment }) => {
    const [readingProgress, setReadingProgress] = useState(0);

    if (!education) {
        return null;
    }
    const { title, details, author, date, likes = [], comments = [] } = education;

    const getAuthorName = (author) => {
        if (!author) return 'Unknown';
        return author.username || `${author.firstName} ${author.lastName}` || 'Anonymous';
    };

    useEffect(() => {
        const handleScroll = (e) => {
            const container = e.target;
            const progress = (container.scrollTop / 
                (container.scrollHeight - container.clientHeight)) * 100;
            setReadingProgress(Math.min(progress, 100));
        };

        const modalContent = document.querySelector('.education-modal-content');
        if (modalContent) {
            modalContent.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (modalContent) {
                modalContent.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    return (
        <div className="edu-modal-overlay">
            <div className="edu-modal">
                <div className="edu-modal-header">
                    <h2 className="edu-modal-title">{education.title}</h2>
                    <button 
                        className="edu-modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >×</button>
                </div>

                <div className="edu-modal-content">
                    <EducationRenderer content={education.details} /> 

                    <div className="edu-modal-meta">
                        <span className="edu-modal-author">Author: {getAuthorName(education.author)}</span>
                        <span className="edu-modal-date">Posted: {new Date(education.date).toLocaleDateString()}</span>
                        <span className="edu-modal-likes">Likes: {education.likes?.length || 0}</span>
                    </div>

                    <div className="edu-modal-actions">
                        <button className="edu-modal-button" onClick={() => onLike(education._id)}>Like</button>
                        <button className="edu-modal-button" onClick={() => onComment(education._id)}>Comment</button>
                    </div>

                    <div className="edu-modal-comments">
                        {comments.map(comment => (
                            comment && (
                                <div key={comment._id || Date.now()} className="edu-modal-comment">
                                    <p className="edu-modal-comment-text">
                                        {comment.text || 'No comment text'}
                                    </p>
                                    <span className="edu-modal-comment-date">
                                        {comment.date ? new Date(comment.date).toLocaleDateString() : 'No date'}
                                    </span>
                                </div>
                            )
                        ))}
                    </div>
                </div>

                <div className="edu-reading-progress-bar">
                    <div
                        className="edu-progress"
                        style={{width: `${readingProgress}%`}} 
                    />
                </div>
            </div>
        </div>
    );
};

export default EducationFullDetailModal;