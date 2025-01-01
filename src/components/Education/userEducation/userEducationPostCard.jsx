import React from 'react';
import './styles/userEducationPostCardStyles.css';

const UserEducationPostCard = ({ education, onEdit, onDelete, onLike, onComment}) => {
    const getAuthorName = (author) => {
        //because author has 3 objects id, _id and username
        if (!author) return 'Unknown';
        return author.username || `${author.firstName} ${author.lastName}` || 'Anonymous';
    };

    return (
        <div className="user-education-card">
          <div className="card-header">
            <h3 className="post-title">{education.title}</h3>
            <div className="post-meta">
              <span>Posted {new Date(education.date).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="card-content">
            <div className="content-preview" 
                 dangerouslySetInnerHTML={{ __html: education.details.substring(0, 200) + '...' }} 
            />
          </div>
    
          <div className="card-footer">
            <div className="interaction-stats">
              <span>{education.likes?.length || 0} Likes</span>
              <span>{education.comments?.length || 0} Comments</span>
            </div>
            
            <div className="action-buttons">
              <button className="btn-primary" onClick={() => onLike(education._id)}>
                Like
              </button>
              <button className="btn-secondary" onClick={() => onComment(education._id)}>
                Comment
              </button>
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
