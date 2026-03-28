import React from 'react';
import { Card } from '../ui/Card';
import { Check, Zap, TrendingUp, Clock } from 'lucide-react';

const RecommendationCard = ({ recommendation }) => {
    const getIcon = () => {
        switch(recommendation.type) {
            case 'increase_contribution':
                return <TrendingUp className="w-5 h-5 text-blue-500" />;
            case 'automate_savings':
                return <Zap className="w-5 h-5 text-yellow-500" />;
            case 'early_achievement':
                return <Clock className="w-5 h-5 text-green-500" />;
            default:
                return <Check className="w-5 h-5 text-primary" />;
        }
    };

    return (
        <Card className="p-4 hover:bg-surface-2 transition-colors">
            <div className="flex gap-3 items-start">
                <div className="mt-1">
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">
                        {recommendation.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                        {recommendation.description}
                    </p>
                    {recommendation.action && (
                        <div className="mt-2 text-sm">
                            <button className="text-primary hover:underline">
                                {recommendation.action}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default RecommendationCard;