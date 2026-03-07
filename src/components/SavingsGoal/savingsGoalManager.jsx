import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import SavingsGoalCard from './savingsGoalCard';
import NewGoalCard from './NewGoalCard';
import savingsGoalService from '../../services/savingsGoalService';
import walletService from '../../services/walletService';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Loader2 } from 'lucide-react';
import ReportSection from '../Common/ReportSection';
import { GlassCard } from '../ui/GlassCard';

const SavingsGoalManager = () => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [goals, setGoals] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (user?.id) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [goalsData, walletsData] = await Promise.all([
                savingsGoalService.getSavingsGoals(),
                walletService.getAllWallets()
            ]);
            setGoals(Array.isArray(goalsData) ? goalsData : []);
            setWallets(Array.isArray(walletsData) ? walletsData : []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGoal = async (goalData) => {
        try {
            await savingsGoalService.createSavingsGoal(goalData);
            fetchData();
        } catch (error) {
            console.error('Failed to create goal:', error);
        }
    };

    const handleUpdateGoal = async (goalId, updates) => {
        try {
            await savingsGoalService.updateSavingsGoal(goalId, updates);
            fetchData();
        } catch (error) {
            console.error('Failed to update goal:', error);
        }
    };

    const handleDeleteGoal = async (goalId) => {
        if (window.confirm('Are you sure you want to delete this goal?')) {
            try {
                await savingsGoalService.deleteSavingsGoal(goalId);
                fetchData();
            } catch (error) {
                console.error('Failed to delete goal:', error);
            }
        }
    };

    const handleContribute = async (goalId, amount, walletId) => {
        try {
            const result = await savingsGoalService.contributeToGoal(goalId, {
                amount,
                sourceType: 'wallet',
                sourceId: walletId
            });
            const updatedGoal = result?.savingsGoal;
            if (updatedGoal && updatedGoal.currentAmount >= updatedGoal.targetAmount) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
            }
            fetchData();
        } catch (error) {
            console.error('Failed to contribute:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
                        <Target className="w-8 h-8 text-primary" />
                        Savings Goals
                    </h2>
                    <p className="text-muted-foreground mt-1">Track and achieve your financial targets</p>
                </div>
            </div>

            {/* Summary Section */}
            <GlassCard className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Total Saved</p>
                        <p className="text-2xl font-bold text-foreground">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                                .format(goals.reduce((sum, g) => sum + g.currentAmount, 0))}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Total Target</p>
                        <p className="text-2xl font-bold text-foreground">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                                .format(goals.reduce((sum, g) => sum + g.targetAmount, 0))}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Goals</p>
                        <p className="text-2xl font-bold text-foreground">{goals.length}</p>
                    </div>
                    <div className="text-center">
                        <ReportSection title="Savings Report" accountId={user?.id} reportType="savings-report" />
                    </div>
                </div>
            </GlassCard>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <NewGoalCard onCreate={handleCreateGoal} />
                {goals.map(goal => (
                    <SavingsGoalCard
                        key={goal._id}
                        goal={goal}
                        onUpdate={handleUpdateGoal}
                        onDelete={handleDeleteGoal}
                        onContribute={handleContribute}
                        wallets={wallets}
                    />
                ))}
            </div>

            {/* Confetti celebration */}
            {showConfetti && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={500}
                />
            )}
        </div>
    );
};

export default SavingsGoalManager;

