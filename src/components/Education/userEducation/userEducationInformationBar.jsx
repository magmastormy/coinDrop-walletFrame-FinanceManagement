import React from 'react';
import { Plus, User, FileText } from 'lucide-react';
import { Button } from '../../ui/Button';

const UserEducationInformation = ({ totalPosts, user, onCreateClick }) => {

    return (
        <div
            className="flex items-center justify-between p-6"
            style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-1)',
            }}
        >
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pr-6" style={{ borderRight: '1px solid var(--color-border)' }}>
                    <User className="w-[18px] h-[18px] text-primary" strokeWidth={1.5} />
                    <div>
                        <p className="text-foreground font-medium">{user?.username}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <FileText className="w-[18px] h-[18px] text-primary" strokeWidth={1.5} />
                    <p className="text-foreground font-medium">Total Posts: {totalPosts}</p>
                </div>
            </div>
            <Button onClick={onCreateClick}>
                <Plus className="w-[18px] h-[18px] mr-2" strokeWidth={1.5} />
                Create Post
            </Button>
        </div>
    );
};

export default UserEducationInformation;
