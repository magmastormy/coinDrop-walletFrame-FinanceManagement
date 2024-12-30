import React, { useState } from 'react';
import './styles/educationSearchBarStyles.css';

const EducationSearchBar = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = () => {
        onSearch(searchTerm);
    };

    return (
        <div className="education-search-bar">
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search education posts..."
            />
            <button onClick={handleSearch}>Search</button>
        </div>
    );
};

export default EducationSearchBar;