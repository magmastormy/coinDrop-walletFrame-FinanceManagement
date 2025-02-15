import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faComment, faBookOpen } from '@fortawesome/free-solid-svg-icons';
import EducationRenderer from './educationRenderer';
import EducationFullDetailModal from './educationFullDetailModal';
import './styles/educationCardStyles.css';

const EducationCard = ({ education }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(education.isLiked);
  const [isHovered, setIsHovered] = useState(false);

  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <motion.div
        className="education-card"
        onClick={() => setIsModalOpen(true)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {education.featuredImage && (
          <div className="card-image-container">
            <img 
              src={education.featuredImage.url} 
              alt={education.title} 
              className="card-image"
            />
            <div className="image-overlay">
              <FontAwesomeIcon icon={faBookOpen} />
            </div>
          </div>
        )}
        
        <div className="card-content">
          <div className="card-meta">
            <div className="author">
              {education.author.profileImage ? (
                <img 
                  src={education.author.profileImage} 
                  alt={education.author.username} 
                  className="author-avatar"
                />
              ) : (
                <div className="author-initial">
                  {education.author.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span>{education.author.username}</span>
            </div>
            <span className="date">{formatDate(education.date)}</span>
          </div>

          <motion.h3 
            className="card-title"
            animate={{ scale: isHovered ? 1.01 : 1 }}
          >
            {education.title}
          </motion.h3>
          
          <div className="card-excerpt">
            <EducationRenderer content={education.details} maxLength={100} />
          </div>

          <div className="card-footer">
            <div className="interaction-stats">
              <motion.button 
                className={`stat-button ${isLiked ? 'liked' : ''}`}
                onClick={handleLike}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FontAwesomeIcon icon={faHeart} />
                <span>{education.likes?.length || 0}</span>
              </motion.button>
              <div className="stat-item">
                <FontAwesomeIcon icon={faComment} />
                <span>{education.comments?.length || 0}</span>
              </div>
            </div>
            
            <motion.button
              className="read-more-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
            >
              Read More
            </motion.button>
          </div>
        </div>
      </motion.div>

      <EducationFullDetailModal
        education={education}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLike={handleLike}
      />
    </>
  );
};

export default EducationCard;