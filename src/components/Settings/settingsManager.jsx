import React from 'react';
import PageHeader from '../Common/PageHeader';

const SettingsManager = () => {
    return (
        <div className="space-y-8 pb-8">
            <PageHeader title="Settings" />
            <div
                style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-surface-1)',
                    padding: 'var(--spacing-lg)',
                }}
            />
        </div>
    );
};

export default SettingsManager;
