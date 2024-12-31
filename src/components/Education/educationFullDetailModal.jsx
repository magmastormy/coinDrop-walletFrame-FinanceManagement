import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './styles/educationFullDetailStyles.css';

const EducationFullDetailModal = ({ education, onClose, onLike, onComment }) => {
    const [readingProgress, setReadingProgress] = useState(0);

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
        <div className="education-modal-overlay">
            <div className="education-modal">
                <div className="education-modal-header">
                    <h2>{education.title}</h2>
                    <button 
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >×</button>
                </div>

                <div className="education-modal-content">
                    <ReactMarkdown>{education.details}</ReactMarkdown>

                    <div className="education-meta">
                        <span>Author: {education.author}</span>
                        <span>Posted: {new Date(education.date).toLocaleDateString()}</span>
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

                <div className="reading-progress-bar">
                    <div 
                        className="progress" 
                        style={{width: `${readingProgress}%`}} 
                    />
                </div>
            </div>
        </div>
    );
};

export default EducationFullDetailModal;