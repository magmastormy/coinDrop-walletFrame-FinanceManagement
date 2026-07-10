import { logError, logInfo } from '../../utils/logger';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/authContext';
import aiServiceWrapper from '../../services/aiServiceWrapper';
import './chatbotStyles.css';

const ChatInsightsSidebar = () => {
    const { user } = useAuth();
    const [insights, setInsights] = useState({
        portfolioVelocity: null,
        protectionScore: null,
        linkedAccounts: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch real-time insights from backend
    const fetchInsights = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch account information and insights
            const accountInfo = await aiServiceWrapper.getUserAccountInfo(user.id);
            const proactiveInsights = await aiServiceWrapper.getProactiveInsights(user.id);

            // Process and structure the data
            const portfolioVelocity = {
                value: accountInfo?.portfolioVelocity || '+4.2%',
                description: accountInfo?.portfolioDescription || 'Your investment yield is currently outpacing your target by 4.2%.'
            };

            const protectionScore = {
                value: accountInfo?.protectionScore || '6.4',
                description: accountInfo?.protectionDescription || 'Emergency fund covers 6.4 months of expenses. Optimal level achieved.'
            };

            const linkedAccounts = accountInfo?.linkedAccounts || [
                {
                    id: 1,
                    name: 'Chase Sapphire',
                    type: 'Main Checking',
                    lastFour: '4921',
                    color: 'bg-blue-600',
                    initials: 'Chase'
                },
                {
                    id: 2,
                    name: 'Fidelity Wealth',
                    type: 'Brokerage',
                    lastFour: '8820',
                    color: 'bg-green-700',
                    initials: 'Fid'
                }
            ];

            setInsights({
                portfolioVelocity,
                protectionScore,
                linkedAccounts
            });
        } catch (err) {
            setError('Failed to load insights');
            logError('Error fetching insights:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Fetch insights on mount and when user changes
    useEffect(() => {
        fetchInsights();
    }, [fetchInsights]);

    // Handle link new institution
    const handleLinkNewInstitution = () => {
        // This would typically open a modal or redirect to account linking flow
        logInfo('Linking new institution...');
        // Implementation would connect to account aggregation service
    };

    // Handle account click
    const handleAccountClick = (account) => {
        logInfo('Account clicked:', account);
        // Could open account details modal or navigate to account page
    };

    return (
        <aside className="hidden xl:flex flex-col w-80 h-full bg-surface-container-low/50 border-l border-outline-variant/10 p-6 space-y-6 overflow-y-auto chat-scrollbar">
            {/* Real-time Insights Section */}
            <div>
                <h3 className="text-xs font-bold text-tertiary uppercase tracking-widest mb-4">
                    Real-time Insights
                </h3>
                <div className="space-y-3">
                    {/* Portfolio Velocity Card */}
                    <div className="p-4 rounded-xl bg-surface-container-high/40 border border-outline-variant/5 card-hover cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-8 h-8 rounded-lg bg-secondary-curator/10 flex items-center justify-center text-secondary-curator">
                                <span className="material-symbols-outlined">bolt</span>
                            </div>
                            <span className="text-[10px] font-bold text-secondary-curator bg-secondary-curator/10 px-2 py-0.5 rounded-full">
                                {insights.portfolioVelocity?.value || '+4.2%'}
                            </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">Portfolio Velocity</h4>
                        <p className="text-xs text-tertiary leading-relaxed">
                            {insights.portfolioVelocity?.description || 'Your investment yield is currently outpacing your target by 4.2%.'}
                        </p>
                    </div>

                    {/* Protection Score Card */}
                    <div className="p-4 rounded-xl bg-surface-container-high/40 border border-outline-variant/5 card-hover cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-curator/10 flex items-center justify-center text-primary-curator">
                                <span className="material-symbols-outlined">shield</span>
                            </div>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">Protection Score</h4>
                        <p className="text-xs text-tertiary leading-relaxed">
                            {insights.protectionScore?.description || 'Emergency fund covers 6.4 months of expenses. Optimal level achieved.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Linked Accounts Section */}
            <div>
                <h3 className="text-xs font-bold text-tertiary uppercase tracking-widest mb-4">
                    Linked Accounts
                </h3>
                <div className="space-y-2">
                    {insights.linkedAccounts.map((account) => (
                        <div 
                            key={account.id}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container transition-colors cursor-pointer group"
                            onClick={() => handleAccountClick(account)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${account.color} flex items-center justify-center text-white font-bold text-xs`}>
                                    {account.initials}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{account.name}</p>
                                    <p className="text-[10px] text-tertiary">{account.type} • ****{account.lastFour}</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-tertiary text-sm">chevron_right</span>
                        </div>
                    ))}
                </div>

                {/* Link New Institution Button */}
                <button
                    type="button"
                    onClick={handleLinkNewInstitution}
                    className="w-full mt-3 py-3 border border-dashed border-outline-variant/30 rounded-xl text-xs font-bold text-tertiary hover:text-primary-curator hover:border-primary-curator/50 transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Link New Institution
                </button>
            </div>

            {/* Promotional Asset */}
            <div className="mt-auto relative rounded-2xl overflow-hidden aspect-[4/5] group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-curator/30 to-secondary-curator/30" />
                <div className="absolute inset-0 bg-surface-container/80" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-primary-curator/50">account_balance</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[10px] text-primary-curator font-bold uppercase tracking-widest mb-1">Premium Feature</p>
                    <p className="text-sm font-bold text-white leading-snug">Unlock predictive tax loss harvesting alerts</p>
                </div>
            </div>
        </aside>
    );
};

export default ChatInsightsSidebar;
