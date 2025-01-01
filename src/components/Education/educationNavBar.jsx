import React from 'react';
import './styles/educationNavBarStyles.css';
/*The goal of this to to just render certain categories of the education posts.*/
//so basically this is a filter
const EducationNavBar = () => {
    return (
        <nav className="education-navbar">
            <h1>Education Posts</h1>
            {/* Add more navigation items if needed */}
        </nav>
    );
};

export default EducationNavBar;