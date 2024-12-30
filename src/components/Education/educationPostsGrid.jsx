import React from 'react';
import EducationCard from './educationCard';
import './styles/educationGridStyles.css';

const EducationGrid = ({ educations = [], onEdit, onDelete, onLike, onComment }) => {
    if (!Array.isArray(educations)) {
        console.warn('EducationGrid: educations prop is not an array');
        return null;
    }
    
    if (!educations.length) {
        return <div className="empty-state">No education posts available</div>;
    }

    return (
        <div className="education-grid">
            {educations.map(education => (
                <EducationCard
                    key={education._id}
                    education={education}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onLike={onLike}
                    onComment={onComment}
                />
            ))}
        </div>
    );
};
export default EducationGrid;