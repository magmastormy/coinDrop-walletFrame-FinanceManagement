import React from 'react';
import './chatbotStyles.css';

const ChatHeader = ({ onClearThread }) => {
    return (
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/20">
            {/* Left side - AI Avatar and Title */}
            <div className="flex items-center gap-4">
                {/* AI Avatar */}
                <div className="w-12 h-12 rounded-xl primary-gradient flex items-center justify-center shadow-lg shadow-primary-curator/20">
                    <span className="material-symbols-outlined text-white text-2xl filled">auto_awesome</span>
                </div>
                
                {/* Title and Status */}
                <div>
                    <h1 className="text-2xl font-extrabold text-white font-headline tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        Curator AI
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-secondary-curator pulse-indicator"></span>
                        <span className="text-xs text-tertiary font-medium uppercase tracking-widest">Active Intelligence</span>
                    </div>
                </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onClearThread}
                    className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-sm font-medium transition-all duration-200"
                >
                    Clear Thread
                </button>
                <button
                    type="button"
                    className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-all duration-200"
                    aria-label="More options"
                >
                    <span className="material-symbols-outlined text-lg">more_vert</span>
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
