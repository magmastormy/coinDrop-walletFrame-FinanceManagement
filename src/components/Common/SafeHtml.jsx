import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';

const SANITIZE_CONFIG = {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
        'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
        'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'span', 'img'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class'],
    FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload']
};

const SafeHtml = ({ html, className = 'safe-html', as: Component = 'div', onClick }) => {
    const sanitized = useMemo(
        () => DOMPurify.sanitize(html || '', SANITIZE_CONFIG),
        [html]
    );

    return (
        <Component
            className={className}
            onClick={onClick}
            dangerouslySetInnerHTML={{ __html: sanitized }}
        />
    );
};

SafeHtml.propTypes = {
    html: PropTypes.string,
    className: PropTypes.string,
    as: PropTypes.elementType,
    onClick: PropTypes.func
};

export default SafeHtml;
