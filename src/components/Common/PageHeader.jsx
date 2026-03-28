import React from 'react';

const PageHeader = ({ title, actions, compact = false }) => {
    return (
        <header
            className="page-header"
            style={{
                minHeight: compact ? '60px' : '72px',
                padding: compact ? '0 24px' : '0 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-bg-primary)',
                flexShrink: 0,
                gap: '16px',
                flexWrap: 'wrap',
            }}
        >
            <h1
                className="page-header-title"
                style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: compact ? '22px' : 'clamp(20px, 2.5vw, 28px)',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    lineHeight: 1.2,
                    flex: '0 1 auto',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {title}
            </h1>
            
            {actions && (
                <div 
                    className="page-header-actions"
                    style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        flex: '0 0 auto',
                        minWidth: 0,
                        maxWidth: '100%',
                    }}
                >
                    {actions}
                </div>
            )}
        </header>
    );
};

export default PageHeader;
