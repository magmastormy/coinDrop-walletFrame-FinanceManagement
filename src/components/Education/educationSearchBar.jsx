import React, { useState } from 'react';
import './styles/educationSearchBarStyles.css';

const EducationSearchBar = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = () => {
        onSearch(searchTerm);
    };

    return (
        <div className="educationSearchBar">
            <input className="educationSearchInput"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Posts..."
            />
            <button className="educationSearchButton" onClick={handleSearch}>Search</button>
        </div>
    );
};

export default EducationSearchBar;