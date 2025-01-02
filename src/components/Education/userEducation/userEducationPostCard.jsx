import React from 'react';
import './styles/userEducationPostCardStyles.css';

const UserEducationPostCard = ({ education, onEdit, onDelete, onLike, onComment}) => {
    const getAuthorName = (author) => {
        //because author has 3 objects id, _id and username
        if (!author) return 'Unknown';
        return author.username || `${author.firstName} ${author.lastName}` || 'Anonymous';
    };

    return (
        <div className="user-education-post-card">
          <div className="user-education-post-card-header">
            <h3 className="user-education-post-title">{education.title}</h3>
            <div className="user-education-post-meta">
              <span className="user-education-post-date">Posted {new Date(education.date).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="user-education-post-card-content">
            <div className="user-education-post-content-preview" 
                 dangerouslySetInnerHTML={{ __html: education.details.substring(0, 200) + '...' }} 
            />
          </div>
    
          <div className="user-education-post-card-footer">
            <div className="user-education-post-interaction-stats">
              <span className="user-education-post-likes">{education.likes?.length || 0} Likes</span>
              <span className="user-education-post-comments">{education.comments?.length || 0} Comments</span>
            </div>
            
            <div className="user-education-post-action-buttons">
              <button className="btn-edit" onClick={() => onEdit(education)}>
                Edit
              </button>
              <button className="btn-delete" onClick={() => onDelete(education._id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
    );
};

export default UserEducationPostCard;
