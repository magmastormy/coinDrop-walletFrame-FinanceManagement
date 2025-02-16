import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag, faPlus } from '@fortawesome/free-solid-svg-icons';
import { setSavingsGoals, setLoading, setError } from '../../slices/savingsGoalSlice';
import { savingsGoalService } from '../../services/savingsGoalService';
import SavingsGoalCard from './savingsGoalCard';
import NewGoalDialog from './newGoalDialog';
import EmptyState from '../../pages/emptyState';
import './styles/savingsGoalsListStyles.css';

const SavingsGoalList = () => {
    const dispatch = useDispatch();
    const { goals, loading, error } = useSelector((state) => state.savingsGoal);
    const { user } = useSelector((state) => state.auth);
    const [showNewGoalDialog, setShowNewGoalDialog] = useState(false);

    useEffect(() => {
        const fetchGoals = async () => {
            try {
                dispatch(setLoading(true));
                const data = await savingsGoalService.getSavingsGoals(user.id);
                dispatch(setSavingsGoals(data));
            } catch (err) {
                dispatch(setError(err.message));
            } finally {
                dispatch(setLoading(false));
            }
        };

        if (user) {
            fetchGoals();
        }
    }, [dispatch, user]);

    const handleAddGoal = () => {
        setShowNewGoalDialog(true);
    };

    const handleGoalCreated = () => {
        setShowNewGoalDialog(false);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!goals.length) {
        return (
            <EmptyState
                icon={<FontAwesomeIcon icon={faFlag} size="3x" aria-hidden="true" />}
                title="No Savings Goals Yet"
                description="Create your first savings goal to start tracking your progress"
                action={
                    <button 
                        className="add-goal-button"
                        onClick={handleAddGoal}
                        aria-label="Create new savings goal"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        <span>Add Goal</span>
                    </button>
                }
            />
        );
    }

    return (
        <div className="savings-goals-container">
            <div className="goals-header">
                <h3>Savings Goals</h3>
                <button 
                    className="add-goal-button"
                    onClick={handleAddGoal}
                    aria-label="Create new savings goal"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Add Goal</span>
                </button>
            </div>

            <AnimatePresence>
                <motion.div className="goals-grid">
                    {goals.map((goal) => (
                        <SavingsGoalCard
                            key={goal._id}
                            goal={goal}
                        />
                    ))}
                </motion.div>
            </AnimatePresence>

            {showNewGoalDialog && (
                <NewGoalDialog
                    open={showNewGoalDialog}
                    onClose={() => setShowNewGoalDialog(false)}
                    onComplete={handleGoalCreated}
                />
            )}
        </div>
    );
};

export default SavingsGoalList;
