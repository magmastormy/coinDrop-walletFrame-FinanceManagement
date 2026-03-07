// src/components/Education/educationRenderer.jsx 
import React from 'react';
import SafeHtml from '../common/SafeHtml';

const EducationRenderer = ({ content, maxLength }) => {
    const sourceContent = content || '';
    let displayContent = sourceContent;
    if (maxLength && sourceContent.length > maxLength) {
        displayContent = sourceContent.substring(0, maxLength) + '...';
    }

    return (
        <SafeHtml
            as="span"
            html={displayContent}
            className="education-renderer-content"
        />
    );
};

export default EducationRenderer;
