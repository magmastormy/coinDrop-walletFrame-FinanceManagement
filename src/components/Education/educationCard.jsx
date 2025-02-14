import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faComment, faBookOpen, faClock, faUser, faTag } from '@fortawesome/free-solid-svg-icons';
import EducationRenderer from './educationRenderer';
import './styles/educationCardStyles.css';

const EducationCard = ({ education }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(education.isLiked);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      className="education-card"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {education.featuredImage && (
        <div className="education-card-image-container">
          <img src={education.featuredImage.url} alt={education.title} className="education-card-image" />
        </div>
      )}
      
      <div className="education-card-content">
        <div className="education-card-header">
          <div className="education-card-meta">
            <div className="education-card-author">
              <FontAwesomeIcon icon={faUser} />
              <span>{education.author.username || `${education.author.firstName} ${education.author.lastName}` || 'Anonymous'}</span>
            </div>
            <div className="education-card-date">
              <FontAwesomeIcon icon={faClock} />
              <span>{formatDate(education.date)}</span>
            </div>
          </div>
        </div>

        <h2 className="education-card-title">{education.title}</h2>
        
        {education.tags && (
          <div className="education-card-tags">
            {education.tags.map((tag, index) => (
              <span key={index} className="education-tag">
                <FontAwesomeIcon icon={faTag} />
                {tag}
              </span>
            ))}
          </div>
        )}

        <AnimatePresence>
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="education-card-full-content"
            >
              <div className="education-content-wrapper">
                <EducationRenderer content={education.details} />
              </div>
            </motion.div>
          ) : (
            <motion.div className="education-card-excerpt">
              <EducationRenderer content={education.details} maxLength={150} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="education-card-footer">
          <div className="education-card-stats">
            <button 
              className={`stat-item like-btn ${isLiked ? 'liked' : ''}`}
              onClick={handleLike}
            >
              <FontAwesomeIcon icon={faHeart} />
              <span>{education.likes?.length + (isLiked ? 1 : 0)}</span>
            </button>
            <div className="stat-item">
              <FontAwesomeIcon icon={faComment} />
              <span>{education.comments?.length || 0}</span>
            </div>
          </div>

          <button 
            className="read-more-btn"
            onClick={toggleExpand}
          >
            <FontAwesomeIcon icon={faBookOpen} />
            {isExpanded ? 'Show Less' : 'Read More'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default EducationCard;