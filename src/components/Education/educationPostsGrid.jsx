import React from 'react';
import EducationCard from './educationCard';


const EducationGrid = ({ educations = [], onEdit, onDelete, onLike, onComment }) => {
    if (!Array.isArray(educations)) {
        console.warn('EducationGrid: educations prop is not an array');
        return null;
    }

    const validEducations = educations.filter(education =>
        education && typeof education === 'object' && education._id
    );

    if (!educations.length) {
        return <div className="education-grid__empty-state">No education posts available</div>;
    }


    if (!validEducations.length) {
        return <div className="education-grid__empty-state">No education posts available</div>;
    }

    return (
        <div className="education-grid__container">
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