import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHeart, 
    faComment, 
    faBook, 
    faEdit, 
    faTrash,
    faUser,
    faCalendar
} from '@fortawesome/free-solid-svg-icons';
import EducationFullDetailModal from './educationFullDetailModal';
import EducationRenderer from './educationRenderer';
import './styles/educationCardStyles.css';

const EducationCard = ({education, onLike, onComment, onEdit, onDelete }) => {
    const [showFullDetail, setShowFullDetail] = useState(false);
    const [isLiked, setIsLiked] = useState(education.isLiked);

    const getAuthorName = (author) => {
        if (!author) return 'Unknown';
        return author.username || `${author.firstName} ${author.lastName}` || 'Anonymous';
    };

    const handleLike = () => {
        setIsLiked(!isLiked);
        onLike(education._id);
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        },
        hover: {
            y: -5,
            transition: {
                duration: 0.2
            }
        }
    };

    const buttonVariants = {
        hover: {
            scale: 1.05,
            transition: {
                duration: 0.2
            }
        },
        tap: {
            scale: 0.95
        }
    };

    return (
        <motion.div 
            className="education-card-container"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            role="article"
            aria-label={`Education post: ${education.title}`}
        >
            <h3 className="education-card-title">
                {education.title}
            </h3>
            
            <div 
                className="education-card-details"
                role="region"
                aria-label="Post content"
            >
                <EducationRenderer content={education.details} maxLength={100} />
            </div>

            <div className="education-card-meta">
                <span className="education-card-author">
                    <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                    <span className="meta-text">
                        {getAuthorName(education.author)}
                    </span>
                </span>
                <span className="education-card-date">
                    <FontAwesomeIcon icon={faCalendar} aria-hidden="true" />
                    <span className="meta-text">
                        {new Date(education.date).toLocaleDateString()}
                    </span>
                </span>
                <span className="education-card-likes" aria-label={`${education.likes?.length || 0} likes`}>
                    <FontAwesomeIcon 
                        icon={faHeart} 
                        className={isLiked ? 'liked' : ''} 
                        aria-hidden="true" 
                    />
                    <span className="meta-text">
                        {education.likes?.length || 0}
                    </span>
                </span>
            </div>  

            <div 
                className="education-card-actions"
                role="group"
                aria-label="Post actions"
            > 
                <button 
                    className="education-card-btn-read"
                    onClick={() => setShowFullDetail(true)}
                >
                    <FontAwesomeIcon icon={faBook} aria-hidden="true" />
                    <span>Read</span>
                </button>

                <button 
                    className="education-card-btn-like"
                    onClick={() => onLike(education._id)}
                >
                    <FontAwesomeIcon icon={faHeart} aria-hidden="true" />
                    <span>{isLiked ? 'Liked' : 'Like'}</span>
                </button>

                <button 
                    className="education-card-btn-comment"
                    onClick={() => onComment(education._id)}
                >
                    <FontAwesomeIcon icon={faComment} aria-hidden="true" />
                    <span>Comment</span>
                </button>

                {education.isEditable && (
                    <>
                        <button 
                            className="education-card-btn-edit"
                            onClick={() => onEdit(education)}
                        >
                            <FontAwesomeIcon icon={faEdit} aria-hidden="true" />
                            <span>Edit</span>
                        </button>

                        <button 
                            className="education-card-btn-delete"
                            onClick={() => onDelete(education._id)}
                        >
                            <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                            <span>Delete</span>
                        </button>
                    </>
                )}
            </div>

            <AnimatePresence>
                {showFullDetail && (
                    <EducationFullDetailModal
                        education={education}
                        authorName={getAuthorName(education.author)}
                        onComment={onComment}
                        onLike={handleLike}
                        onClose={() => setShowFullDetail(false)}
                        isLiked={isLiked}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default EducationCard;