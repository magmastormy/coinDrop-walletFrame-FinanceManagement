import { logError } from '../../utils/logger';

import React, { useEffect } from 'react';
import savingsGoalService from '../../services/savingsGoalService';
import { Loader2 } from 'lucide-react';

const SavingsRecommendations = ({ goals, wallets, onRecommendationsGenerated }) => {
    useEffect(() => {
        const generateRecommendations = async () => {
            try {
                const recommendations = await savingsGoalService.generateRecommendations({
                    goals,
                    wallets
                });
                onRecommendationsGenerated(recommendations || []);
            } catch (error) {
                logError('Failed to generate recommendations:', error);
                onRecommendationsGenerated([]);
            }
        };

        if (goals.length > 0 && wallets.length > 0) {
            generateRecommendations();
        }
    }, [goals, wallets]);

    return (
        <div className="space-y-4">
            {!goals || !goals.length || goals.length === 0 ? (
                <p className="text-muted-foreground">No savings goals to analyze</p>
            ) : !wallets || !wallets.length || wallets.length === 0 ? (
                <p className="text-muted-foreground">No wallets available for analysis</p>
            ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating recommendations...</span>
                </div>
            )}
        </div>
    );
};

export default SavingsRecommendations;