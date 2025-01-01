// src/components/Education/userEducation/listUserEducationPost.jsx
import UserEducationCard from './userEducationPostCard';
import React, {useState} from 'react';
import './styles/listUserEducationPostStyles.css';

const ListUserEducationPost = ({ educations, onEdit, onDelete, onLike, onComment }) => {
    const [sortBy, setSortBy] = useState('date');
    const [filterText, setFilterText] = useState('');

    const sortedAndFilteredEducations = educations
        .filter(edu => 
        edu.title.toLowerCase().includes(filterText.toLowerCase()) ||
        edu.details.toLowerCase().includes(filterText.toLowerCase())
        )
        .sort((a, b) => {
        if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'likes') return (b.likes?.length || 0) - (a.likes?.length || 0);
        return 0;
    });

    if (!educations.length) {
        return <div className="listUserEducationPost-emptyState">No education posts available</div>;
    }
    
    if (!Array.isArray(educations)) {
        console.error('Invalid educations prop:', educations);
        return <div className="listUserEducationPost-errorState">Error: Invalid data format</div>;
    }
    

    return (
        <div className="education-list-container">
          <div className="list-controls">
            <input
              type="text"
              placeholder="Search posts..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="listUserEducationPost-searchInput"
            />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="listUserEducationPost-sortSelect"
            >
              <option value="date">Latest First</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>
    
          <div className="posts-grid">
            {sortedAndFilteredEducations.map(education => (
              <UserEducationCard
                key={education._id}
                education={education}
                onEdit={onEdit}
                onDelete={onDelete}
                onLike={onLike}
                onComment={onComment}
              />
            ))}
          </div>
        </div>
      );
    };

export default ListUserEducationPost;