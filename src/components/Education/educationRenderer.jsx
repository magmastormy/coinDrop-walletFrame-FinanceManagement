// src/components/Education/educationRenderer.jsx 
import React from 'react';
import DOMPurify from 'dompurify';

const EducationRenderer = ({ content, maxLength }) => {
    let displayContent = content;
    if (maxLength && content.length > maxLength) {
        displayContent = content.substring(0, maxLength) + '...';
    }

    const sanitizedContent = DOMPurify.sanitize(displayContent, {
        ADD_TAGS: ['img'],
        ADD_ATTR: ['src', 'alt', 'class']
    });

    return (
        <div 
            className="education-renderer-content"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
    );
};

export default EducationRenderer;