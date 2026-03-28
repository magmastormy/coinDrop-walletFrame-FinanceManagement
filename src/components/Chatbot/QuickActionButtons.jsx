import React from 'react';
import './chatbotStyles.css';

const QuickActionButtons = ({ onSendMessage, quickPrompts = [] }) => {
    // Default quick actions if no prompts provided
    const defaultActions = [
        { icon: 'analytics', label: 'Analyze my spending', message: 'Analyze my spending patterns' },
        { icon: 'trending_up', label: 'Check savings progress', message: 'How am I doing with my savings goals?' },
        { icon: 'update', label: 'Update budget', message: 'Help me update my budget' },
    ];

    // Use quick prompts from context if available, otherwise use defaults
    const actions = quickPrompts.length > 0 
        ? quickPrompts.slice(0, 3).map((prompt, idx) => ({
            icon: defaultActions[idx]?.icon || 'chat',
            label: prompt.length > 30 ? `${prompt.slice(0, 30)}...` : prompt,
            message: prompt
        }))
        : defaultActions;

    const handleClick = (message) => {
        if (onSendMessage) {
            onSendMessage(message);
        }
    };

    return (
        <div className="flex flex-wrap gap-2 px-6 pb-4">
            {actions.map((action, index) => (
                <button
                    key={`${action.label}-${index}`}
                    type="button"
                    onClick={() => handleClick(action.message)}
                    className="px-4 py-2 rounded-full glass-panel hover:bg-surface-container-highest transition-all duration-200 text-xs font-semibold text-primary-curator border border-primary-curator/20 flex items-center gap-2 group"
                    title={action.message}
                >
                    <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">
                        {action.icon}
                    </span>
                    {action.label}
                </button>
            ))}
        </div>
    );
};

export default QuickActionButtons;
