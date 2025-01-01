// src/components/Education/educationRenderer.jsx 
import React from 'react';
import DOMPurify from 'dompurify';

const EducationRenderer = ({ content }) => {
    const sanitizedContent = DOMPurify.sanitize(content, {
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