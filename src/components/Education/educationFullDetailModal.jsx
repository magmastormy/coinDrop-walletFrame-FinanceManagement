import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHeart, 
    faComment, 
    faTimes,
    faUser,
    faClock,
    faTag,
    faShare
} from '@fortawesome/free-solid-svg-icons';
import EducationRenderer from './educationRenderer';
import CommentModal from './commentModal';
import './styles/educationFullDetailStyles.css';

const EducationFullDetailModal = ({ education, onClose, onLike, isLiked }) => {
    const [showComments, setShowComments] = useState(false);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            y: 20
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 25,
                stiffness: 500
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            y: -20,
            transition: {
                duration: 0.2
            }
        }
    };

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={onClose}
            >
                <motion.div
                    className="education-modal"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={e => e.stopPropagation()}
                >
                    <button className="modal-close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>

                    {education.featuredImage && (
                        <div className="modal-image-container">
                            <img
                                src={education.featuredImage.url}
                                alt={education.title}
                                className="modal-featured-image"
                            />
                        </div>
                    )}

                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">{education.title}</h2>
                            
                            <div className="modal-meta">
                                <div className="meta-item">
                                    <FontAwesomeIcon icon={faUser} />
                                    <span>{education.author.username}</span>
                                </div>
                                <div className="meta-item">
                                    <FontAwesomeIcon icon={faClock} />
                                    <span>{formatDate(education.date)}</span>
                                </div>
                            </div>

                            {education.tags && (
                                <div className="modal-tags">
                                    {education.tags.map((tag, index) => (
                                        <span key={index} className="modal-tag">
                                            <FontAwesomeIcon icon={faTag} />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="modal-body">
                            <div className="education-content">
                                <EducationRenderer content={education.details} />
                            </div>

                            {education.images && education.images.length > 0 && (
                                <div className="modal-gallery">
                                    {education.images.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image.url}
                                            alt={`${education.title} - Image ${index + 1}`}
                                            className="gallery-image"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <div className="modal-actions">
                                <button
                                    className={`action-btn ${isLiked ? 'liked' : ''}`}
                                    onClick={onLike}
                                >
                                    <FontAwesomeIcon icon={faHeart} />
                                    <span>{education.likes?.length || 0} Likes</span>
                                </button>
                                <button
                                    className="action-btn"
                                    onClick={() => setShowComments(true)}
                                >
                                    <FontAwesomeIcon icon={faComment} />
                                    <span>{education.comments?.length || 0} Comments</span>
                                </button>
                                <button className="action-btn">
                                    <FontAwesomeIcon icon={faShare} />
                                    <span>Share</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {showComments && (
                    <CommentModal
                        education={education}
                        onClose={() => setShowComments(false)}
                    />
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
};

export default EducationFullDetailModal;