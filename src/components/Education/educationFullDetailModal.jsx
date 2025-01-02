import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes, 
    faHeart, 
    faComment,
    faUser,
    faCalendar,
    faShare,
    faBookmark
} from '@fortawesome/free-solid-svg-icons';
import EducationRenderer from './educationRenderer';
import './styles/educationFullDetailStyles.css';

const EducationFullDetailModal = ({ education, onClose, onLike, onComment, isLiked }) => {
    const [readingProgress, setReadingProgress] = useState(0);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const modalRef = useRef(null);
    const contentRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.addEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return;
            
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
            setReadingProgress(Math.min(progress, 100));
        };

        const contentElement = contentRef.current;
        if (contentElement) {
            contentElement.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (contentElement) {
                contentElement.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    const getAuthorName = (author) => {
        if (!author) return 'Unknown';
        return author.username || `${author.firstName} ${author.lastName}` || 'Anonymous';
    };

    const handleBookmark = () => {
        setIsBookmarked(!isBookmarked);
        // TODO: Implement bookmark functionality
    };

    const handleShare = () => {
        // TODO: Implement share functionality
        navigator.clipboard.writeText(window.location.href);
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: {
                duration: 0.2,
                ease: "easeOut"
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            transition: {
                duration: 0.15,
                ease: "easeIn"
            }
        }
    };

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    };

    if (!education) return null;

    return (
        <AnimatePresence>
            <motion.div 
                className="edu-modal-overlay"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <motion.div 
                    className="edu-modal"
                    variants={modalVariants}
                    ref={modalRef}
                >
                    <header className="edu-modal-header">
                        <h2 
                            id="modal-title"
                            className="edu-modal-title"
                        >
                            {education.title}
                        </h2>
                        <div className="edu-modal-actions">
                            <motion.button
                                className="edu-action-button"
                                onClick={handleBookmark}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                            >
                                <FontAwesomeIcon 
                                    icon={faBookmark} 
                                    className={isBookmarked ? 'active' : ''} 
                                />
                            </motion.button>
                            <motion.button
                                className="edu-action-button"
                                onClick={handleShare}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                aria-label="Share post"
                            >
                                <FontAwesomeIcon icon={faShare} />
                            </motion.button>
                            <motion.button 
                                className="edu-modal-close"
                                onClick={onClose}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                aria-label="Close modal"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </motion.button>
                        </div>
                    </header>

                    <div 
                        className="edu-modal-content"
                        ref={contentRef}
                        role="article"
                    >
                        <div className="edu-modal-meta">
                            <span className="edu-modal-author">
                                <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                                {getAuthorName(education.author)}
                            </span>
                            <span className="edu-modal-date">
                                <FontAwesomeIcon icon={faCalendar} aria-hidden="true" />
                                {new Date(education.date).toLocaleDateString()}
                            </span>
                            <span className="edu-modal-likes">
                                <FontAwesomeIcon 
                                    icon={faHeart} 
                                    className={isLiked ? 'liked' : ''} 
                                    aria-hidden="true" 
                                />
                                {education.likes?.length || 0}
                            </span>
                        </div>

                        <div className="edu-modal-body">
                            <EducationRenderer content={education.details} />
                        </div>

                        <div className="edu-modal-interaction">
                            <motion.button 
                                className={`edu-interaction-button ${isLiked ? 'liked' : ''}`}
                                onClick={onLike}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                aria-label={isLiked ? "Unlike post" : "Like post"}
                            >
                                <FontAwesomeIcon icon={faHeart} />
                                <span>{isLiked ? 'Liked' : 'Like'}</span>
                            </motion.button>
                            <motion.button 
                                className="edu-interaction-button"
                                onClick={onComment}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                aria-label="Add comment"
                            >
                                <FontAwesomeIcon icon={faComment} />
                                <span>Comment</span>
                            </motion.button>
                        </div>

                        <div className="edu-modal-comments">
                            <h3>Comments</h3>
                            {education.comments?.length > 0 ? (
                                education.comments.map(comment => (
                                    comment && (
                                        <motion.div 
                                            key={comment._id || Date.now()} 
                                            className="edu-modal-comment"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="comment-header">
                                                <span className="comment-author">
                                                    <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                                                    {comment.author?.username || 'Anonymous'}
                                                </span>
                                                <span className="comment-date">
                                                    {comment.date ? 
                                                        new Date(comment.date).toLocaleDateString() : 
                                                        'No date'
                                                    }
                                                </span>
                                            </div>
                                            <p className="comment-text">
                                                {comment.text || 'No comment text'}
                                            </p>
                                        </motion.div>
                                    )
                                ))
                            ) : (
                                <p className="no-comments">No comments yet. Be the first to comment!</p>
                            )}
                        </div>
                    </div>

                    <div 
                        className="edu-reading-progress-bar"
                        role="progressbar"
                        aria-valuenow={readingProgress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-label="Reading progress"
                    >
                        <motion.div
                            className="edu-progress"
                            initial={{ width: "0%" }}
                            animate={{ width: `${readingProgress}%` }}
                            transition={{ duration: 0.2 }}
                        />
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default EducationFullDetailModal;