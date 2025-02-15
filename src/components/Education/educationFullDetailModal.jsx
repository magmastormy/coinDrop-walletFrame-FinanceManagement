import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faHeart, faComment } from '@fortawesome/free-solid-svg-icons';
import EducationRenderer from './educationRenderer';
import './styles/educationModalStyles.css';

const EducationFullDetailModal = ({ education, isOpen, onClose, onLike }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-backdrop"
        onClick={handleBackdropClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="modal-content"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
        >
          <div className="modal-header">
            <h2>{education.title}</h2>
            <button className="close-button" onClick={onClose}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {education.featuredImage && (
            <div className="modal-image">
              <img src={education.featuredImage.url} alt={education.title} />
            </div>
          )}

          <div className="modal-meta">
            <div className="author-info">
              {education.author.profileImage && (
                <img 
                  src={education.author.profileImage} 
                  alt={education.author.username} 
                  className="author-avatar"
                />
              )}
              <span>{education.author.username}</span>
            </div>
            <div className="post-date">
              {new Date(education.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          <div className="modal-body">
            <EducationRenderer content={education.details} />
          </div>

          <div className="modal-footer">
            <div className="interaction-stats">
              <button 
                className={`like-button ${education.isLiked ? 'liked' : ''}`}
                onClick={() => onLike(education.id)}
              >
                <FontAwesomeIcon icon={faHeart} />
                <span>{education.likes?.length || 0}</span>
              </button>
              <div className="comment-count">
                <FontAwesomeIcon icon={faComment} />
                <span>{education.comments?.length || 0}</span>
              </div>
            </div>
            {education.tags && (
              <div className="modal-tags">
                {education.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EducationFullDetailModal;