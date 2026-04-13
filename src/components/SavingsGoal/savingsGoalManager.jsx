import { useLogger } from '../../hooks/useLogger.jsx';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/authContext';
import savingsGoalService from '../../services/savingsGoalService';
import walletService from '../../services/walletService';
import Select from '../ui/Select';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import SavingsProgressChart from './savingsProgressChart';
import SavingsRecommendations from './savingsRecommendations';
import RecommendationCard from './recommendationCard';
import NewGoalCard from './NewGoalCard';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Loader2 } from 'lucide-react';
import ReportSection from '../Common/ReportSection';
import PageHeader from '../Common/PageHeader';
import LoadingState from '../ui/LoadingState';

const SavingsGoalManager = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const [activeTab, setActiveTab] = useState('goals');
    const [projectionPeriod, setProjectionPeriod] = useState(3); // months
    const [recommendations, setRecommendations] = useState([]);
    const [milestones, setMilestones] = useState([]);
    const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('All');

    // Calculate monthly contribution needed for a goal
    const calculateMonthlyContribution = (goal) => {
        if (!goal.deadline) return 0;
        
        const now = new Date();
        const deadline = new Date(goal.deadline);
        const monthsDiff = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
        
        if (monthsDiff <= 0) return 0;
        
        const remainingAmount = goal.targetAmount - goal.currentAmount;
        if (remainingAmount <= 0) return 0;
        
        return remainingAmount / monthsDiff;
    };

    // Calculate projected growth over a period
    const calculateProjectedGrowth = (periodMonths = 3) => {
        return goals.reduce((totalGrowth, goal) => {
            const monthlyContribution = calculateMonthlyContribution(goal);
            const growth = monthlyContribution * periodMonths;
            return totalGrowth + growth;
        }, 0);
    };

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
            logError('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGoal = async (goalData) => {
        try {
            await savingsGoalService.createSavingsGoal(goalData);
            fetchData();
        } catch (error) {
            logError('Failed to create goal:', error);
        }
    };

    const handleUpdateGoal = async (goalId, updates) => {
        try {
            await savingsGoalService.updateSavingsGoal(goalId, updates);
            fetchData();
        } catch (error) {
            logError('Failed to update goal:', error);
        }
    };

    const handleDeleteGoal = async (goalId) => {
        if (window.confirm('Are you sure you want to delete this goal?')) {
            try {
                await savingsGoalService.deleteSavingsGoal(goalId);
                fetchData();
            } catch (error) {
                logError('Failed to delete goal:', error);
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
            logError('Failed to contribute:', error);
        }
    };

    if (isLoading) {
        return <LoadingState loading={isLoading} height="md" />;
    }

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }} className="space-y-8 pb-8">
            <div className="flex justify-between items-center w-full px-8 h-16 sticky top-0 bg-[#131b2e] z-40">
                <div className="flex items-center gap-8">
                    <h1 className="text-xl font-bold text-white tracking-tighter">Savings Goals</h1>
                    <nav className="hidden lg:flex items-center gap-6">
                        <button 
                            onClick={() => setActiveTab('goals')}
                            className={`text-sm font-semibold pb-1 transition-colors ${activeTab === 'goals' ? 'text-[#b6c4ff] border-b-2 border-[#b6c4ff]' : 'text-[#c6c6cd] hover:text-white'}`}
                        >
                            Overview
                        </button>
                        <button 
                            onClick={() => setActiveTab('progress')}
                            className={`text-sm font-semibold pb-1 transition-colors ${activeTab === 'progress' ? 'text-[#b6c4ff] border-b-2 border-[#b6c4ff]' : 'text-[#c6c6cd] hover:text-white'}`}
                        >
                            Analytics
                        </button>
                        <button 
                            onClick={() => setActiveTab('recommendations')}
                            className={`text-sm font-semibold pb-1 transition-colors ${activeTab === 'recommendations' ? 'text-[#b6c4ff] border-b-2 border-[#b6c4ff]' : 'text-[#c6c6cd] hover:text-white'}`}
                        >
                            Recommendations
                        </button>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-full">
                        <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
                        <input 
                            className="bg-transparent border-none text-sm focus:ring-0 text-white w-32 xl:w-48" 
                            placeholder="Search goals..." 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all">
                            <span className="material-symbols-outlined">settings</span>
                        </button>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant/30">
                        <img 
                            alt="User Profile Avatar" 
                            className="w-full h-full object-cover" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1obIeyMBB4dItyntXEm65Mq4z7LraIclEvuozFX92X5vU9JdVEqWnZEu6LPtOBCYAmnzWy81YK5cIwfDukv8V7MhcxQVPQpVP5OfFxMvb95m9y6E_5lsbWH3tzC0qzQ59cGOrjcujg_m_IKxn2j8w2KYWk4LLLAY2FWVbWr89-Uv7M4Ot2oQXEH0I0mTPrh3LmpCaF-c6MYxL-eKg2PLZgpuNvV1zjuU8NVMimOWIXnigATd3zxbdpuWPPf7cHs9ypnX5cUv8z9nr"
                        />
                    </div>
                </div>
            </div>

            {/* Hero Summary Section (Bento Style) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Total Progress Card */}
                <div className="lg:col-span-8 bg-surface-container-low rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h3 className="text-on-tertiary-container font-medium mb-1">Total Savings Progress</h3>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-5xl font-extrabold tracking-tight text-white font-headline">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                                            .format(goals.reduce((sum, g) => sum + g.currentAmount, 0))}
                                    </span>
                                    <span className="text-secondary font-semibold">+12.4%</span>
                                </div>
                                <p className="text-on-tertiary-container text-sm mt-2">
                                    Target: <span className="text-on-surface">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                                            .format(goals.reduce((sum, g) => sum + g.targetAmount, 0))}
                                    </span>
                                </p>
                            </div>
                            <button 
                                className="bg-gradient-to-r from-primary to-on-primary-container text-on-primary px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all"
                                onClick={() => setIsCreateGoalOpen(true)}
                            >
                                Create New Goal
                            </button>
                        </div>
                        {/* Progress Visualization (Asymmetric) */}
                        <div className="space-y-6">
                            <div className="flex items-end gap-1.5 h-32">
                                <div className="flex-1 bg-surface-container-highest rounded-t-lg h-[40%] hover:h-[45%] transition-all duration-500"></div>
                                <div className="flex-1 bg-surface-container-highest rounded-t-lg h-[55%] hover:h-[60%] transition-all duration-500"></div>
                                <div className="flex-1 bg-surface-container-highest rounded-t-lg h-[48%] hover:h-[53%] transition-all duration-500"></div>
                                <div className="flex-1 bg-surface-container-highest rounded-t-lg h-[65%] hover:h-[70%] transition-all duration-500"></div>
                                <div className="flex-1 bg-primary/80 rounded-t-lg h-[75%] shadow-[0_-8px_24px_rgba(182,196,255,0.2)]"></div>
                                <div className="flex-1 bg-surface-container-highest rounded-t-lg h-[62%]"></div>
                                <div className="flex-1 bg-surface-container-highest rounded-t-lg h-[78%]"></div>
                                <div className="flex-1 bg-surface-container-highest rounded-t-lg h-[85%]"></div>
                                <div className="flex-1 bg-secondary/80 rounded-t-lg h-[92%] shadow-[0_-8px_24px_rgba(78,222,163,0.2)]"></div>
                                <div className="flex-1 bg-surface-container-highest rounded-t-lg h-[70%]"></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-on-tertiary-container uppercase tracking-widest font-bold">
                                <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span><span>JUL</span><span>AUG</span><span>SEP</span><span>OCT</span>
                            </div>
                        </div>
                    </div>
                    {/* Background Decoration */}
                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px]"></div>
                </div>
                {/* Snapshot Stats */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="flex-1 bg-surface-container p-6 rounded-[2rem] border-0">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                                <span className="material-symbols-outlined" style={{fontVariationSettings: 'FILL 1'}}>trending_up</span>
                            </div>
                            <span className="text-sm font-semibold text-on-tertiary-container">Projected Growth</span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-2">
                            +{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                .format(calculateProjectedGrowth(3))}
                        </div>
                        <p className="text-xs text-on-tertiary-container">Estimated increase over next 3 months based on required contribution rates.</p>
                    </div>
                    <div className="flex-1 bg-surface-container-high p-6 rounded-[2rem] relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined" style={{fontVariationSettings: 'FILL 1'}}>auto_awesome</span>
                            </div>
                            <span className="text-sm font-semibold text-on-tertiary-container">Smart Saver Tip</span>
                        </div>
                        <p className="text-sm text-on-surface leading-relaxed">Increase your <span className="text-primary font-bold">Rainy Day</span> fund by $40/mo to reach your goal 3 months early.</p>
                        <div className="absolute bottom-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <span className="material-symbols-outlined text-6xl">lightbulb</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Goals Filter */}
            <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-bold tracking-tight text-white font-headline">Active Goals</h2>
                <div className="flex gap-2">
                            <button 
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                    selectedFilter === 'All' 
                                        ? 'bg-surface-container-highest text-white' 
                                        : 'text-on-tertiary-container hover:text-white'
                                }`}
                                onClick={() => setSelectedFilter('All')}
                            >
                                All
                            </button>
                            <button 
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                    selectedFilter === 'Personal' 
                                        ? 'bg-surface-container-highest text-white' 
                                        : 'text-on-tertiary-container hover:text-white'
                                }`}
                                onClick={() => setSelectedFilter('Personal')}
                            >
                                Personal
                            </button>
                            <button 
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                    selectedFilter === 'Shared' 
                                        ? 'bg-surface-container-highest text-white' 
                                        : 'text-on-tertiary-container hover:text-white'
                                }`}
                                onClick={() => setSelectedFilter('Shared')}
                            >
                                Shared
                            </button>
                        </div>
            </div>

            {activeTab === 'goals' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Goals List (Left 2/3) */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="space-y-4">
                            {goals
                                .filter(goal => {
                                    // Add type field if not present (temporary for demo)
                                    const goalType = goal.type || 'Personal';
                                    
                                    // Filter by search term
                                    const matchesSearch = goal.name.toLowerCase().includes(searchTerm.toLowerCase());
                                    
                                    // Filter by selected filter
                                    const matchesFilter = selectedFilter === 'All' || goalType === selectedFilter;
                                    
                                    return matchesSearch && matchesFilter;
                                })
                                .map(goal => (
                                    <SavingsGoalCard
                                        key={goal._id}
                                        goal={goal}
                                        onUpdate={handleUpdateGoal}
                                        onDelete={handleDeleteGoal}
                                        onContribute={handleContribute}
                                        wallets={wallets}
                                        milestones={milestones.filter(m => m.goalId === goal._id)}
                                    />
                                ))}
                        </div>
                    </div>
                    {/* Recommendations (Right 1/3) */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 px-2">
                            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: 'FILL 1'}}>recommend</span>
                            <h2 className="text-2xl font-bold tracking-tight text-white font-headline">For You</h2>
                        </div>
                        <div className="flex flex-col gap-4">
                            {/* Recommendation 1 */}
                            <div className="p-6 bg-surface-container rounded-[1.5rem] relative overflow-hidden group">
                                <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/5 rounded-full blur-3xl"></div>
                                <div className="flex flex-col gap-4">
                                    <div className="px-2 py-1 bg-secondary/20 text-secondary text-[10px] font-black uppercase tracking-widest rounded self-start">High Yield</div>
                                    <h5 className="font-bold text-white">Move Emergency Fund to curator+</h5>
                                    <p className="text-sm text-on-tertiary-container leading-relaxed">Earn up to 4.85% APY by switching your rainy day fund to a Curator Plus account.</p>
                                    <button className="text-primary font-bold text-sm flex items-center gap-2 mt-2 hover:translate-x-1 transition-transform">
                                        Explore Account <span className="material-symbols-outlined text-base">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                            {/* Recommendation 2 */}
                            <div className="p-6 bg-surface-container rounded-[1.5rem] border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                                <div className="flex gap-4 items-start">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-primary">schedule_send</span>
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-white mb-1">Set up Auto-Stash</h5>
                                        <p className="text-xs text-on-tertiary-container leading-relaxed">Users who automate their savings reach goals 40% faster. Enable weekly transfers?</p>
                                    </div>
                                </div>
                            </div>
                            {/* Recommendation 3 */}
                            <div className="p-6 bg-surface-container-high rounded-[1.5rem] relative group cursor-pointer overflow-hidden">
                                <img 
                                    alt="Investment Recommendation" 
                                    className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-700" 
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0SM4LNXy3v-SLsybTyDnFRR3zn8GuSsekTAe_a9Wr9evynIlP64nqELFz2jQ8G20C0pwPwrGckJKLeNh4rmyqqQLQP-JCU3pWRabaFSPLWEREX4x0WTJ3WnFTtMz8JxI-0AgMiEeMYpOBzoMXdBKxPLHk2XePoWQ4biROeTSJ47C6imUOL8w7K34KdHHmA3q6XSCgqfjvFYCp_oFA69FJ_QFONbSUIo4msayd5fOmqb4mhDIFnvhqb2yZWvPXWUZUwBCJOnv8Vldp"
                                />
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-xs font-bold text-primary-fixed-dim">NEW OPPORTUNITY</span>
                                        <span className="material-symbols-outlined text-white">star</span>
                                    </div>
                                    <h5 className="font-bold text-white text-lg">Diversify Your Large Goal</h5>
                                    <p className="text-xs text-white/70 mb-4">Your "First Home" fund is large enough for short-term bonds. Maximize your return.</p>
                                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-1/3"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'progress' && (
                <div className="flex-1 overflow-auto">
                    <Card className="p-6 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold">Savings Progress</h3>
                            <Select
                                value={projectionPeriod}
                                onChange={(e) => setProjectionPeriod(Number(e.target.value))}
                                options={[
                                    { value: 1, label: '1 Month' },
                                    { value: 3, label: '3 Months' },
                                    { value: 6, label: '6 Months' },
                                    { value: 12, label: '1 Year' }
                                ]}
                            />
                        </div>
                        <SavingsProgressChart
                            goals={goals}
                            projectionPeriod={projectionPeriod}
                            onMilestoneDetected={(ms) => setMilestones([...milestones, ms])}
                        />
                    </Card>
                </div>
            )}

            {activeTab === 'recommendations' && (
                <div className="flex-1 overflow-auto">
                    <Card className="p-6 h-full">
                        <h3 className="text-xl font-semibold mb-6">Savings Recommendations</h3>
                        <SavingsRecommendations 
                            goals={goals}
                            wallets={wallets}
                            onRecommendationsGenerated={setRecommendations}
                        />
                        {recommendations.length > 0 && (
                            <div className="mt-6 space-y-4">
                                {recommendations.map((rec, i) => (
                                    <RecommendationCard key={i} recommendation={rec} />
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* Create Goal Modal */}
            <Modal
                isOpen={isCreateGoalOpen}
                onClose={() => setIsCreateGoalOpen(false)}
                title="Create New Goal"
                maxWidth="max-w-md"
            >
                <NewGoalCard 
                    onCreate={(goalData) => {
                        handleCreateGoal(goalData);
                        setIsCreateGoalOpen(false);
                    }} 
                />
            </Modal>

            {/* Confetti celebration */}
            {showConfetti && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={500}
                />
            )}

            {/* Mobile Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#131b2e] flex justify-around items-center px-4 z-50">
                <a className="flex flex-col items-center gap-1 text-[#738296]" href="#">
                    <span className="material-symbols-outlined">dashboard</span>
                    <span className="text-[10px]">Home</span>
                </a>
                <a className="flex flex-col items-center gap-1 text-[#738296]" href="#">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                    <span className="text-[10px]">Wallets</span>
                </a>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center -mt-8 shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-on-primary">add</span>
                </div>
                <a className="flex flex-col items-center gap-1 text-[#b6c4ff]" href="#">
                    <span className="material-symbols-outlined" style={{fontVariationSettings: 'FILL 1'}}>savings</span>
                    <span className="text-[10px]">Savings</span>
                </a>
                <a className="flex flex-col items-center gap-1 text-[#738296]" href="#">
                    <span className="material-symbols-outlined">person</span>
                    <span className="text-[10px]">Profile</span>
                </a>
            </nav>
        </div>
    );
};

export default SavingsGoalManager;

