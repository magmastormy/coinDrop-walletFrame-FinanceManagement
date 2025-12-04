import React from 'react';
import { Plus, User, FileText } from 'lucide-react';
import { useTheme } from '../../../theme/ThemeContext';
import { Button } from '../../ui/Button';
import { GlassCard } from '../../ui/GlassCard';

const UserEducationInformation = ({ totalPosts, user, onCreateClick }) => {
    const { theme } = useTheme();

    return (
        <GlassCard className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                        <p className="text-foreground font-medium">{user?.username}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <p className="text-foreground font-medium">Total Posts: {totalPosts}</p>
                </div>
            </div>
            <Button onClick={onCreateClick}>
                <Plus className="w-4 h-4 mr-2" />
                Create Post
            </Button>
        </GlassCard>
    );
};

export default UserEducationInformation;