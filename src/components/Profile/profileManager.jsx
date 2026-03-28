import React from 'react';
import UserProfileDetails from './userProfileDetails';
import PageHeader from '../Common/PageHeader';

const Profile = () => {
    return (
        <div className="space-y-6 pb-6">
            <PageHeader title="Profile" />
            <div
                style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-1)',
                    padding: 'var(--card-pad-md, 16px)',
                }}
            >
                <UserProfileDetails />
            </div>
        </div>
    );
};

export default Profile;
