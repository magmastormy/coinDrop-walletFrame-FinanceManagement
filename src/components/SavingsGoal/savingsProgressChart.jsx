import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';
import { useTheme } from '../../theme/ThemeContext';

const SavingsProgressChart = ({ goals = [], projectionPeriod = 3, onMilestoneDetected = () => {} }) => {
    const { isDarkMode } = useTheme();
    const textColor = isDarkMode ? '#ffffff' : '#000000';
    const gridColor = isDarkMode ? '#333333' : '#eeeeee';

    // Validate goals array
    const validGoals = Array.isArray(goals) ? goals.filter(goal => {
        return goal && 
               typeof goal === 'object' && 
               goal._id && 
               goal.name && 
               typeof goal.currentAmount === 'number' && 
               typeof goal.targetAmount === 'number';
    }) : [];

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

    // Generate projection data
    const generateProjectionData = () => {
        const months = Array.from({ length: projectionPeriod }, (_, i) => i + 1);
        
        return months.map(month => {
            const monthData = { name: `Month ${month}` };
            
            validGoals.forEach(goal => {
                const monthlyContribution = calculateMonthlyContribution(goal);
                const projectedAmount = Math.min(
                    goal.currentAmount + (monthlyContribution * month),
                    goal.targetAmount
                );
                
                monthData[goal._id] = projectedAmount;
                
                // Check for milestones
                [0.25, 0.5, 0.75].forEach(threshold => {
                    const thresholdAmount = goal.targetAmount * threshold;
                    if (
                        projectedAmount >= thresholdAmount && 
                        (goal.currentAmount + (monthlyContribution * (month - 1))) < thresholdAmount
                    ) {
                        onMilestoneDetected({
                            goalId: goal._id,
                            milestone: `${threshold * 100}%`,
                            amount: thresholdAmount,
                            month: month
                        });
                    }
                });
            });
            
            return monthData;
        });
    };

    const data = generateProjectionData();

    return (
        <Card className="p-4 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis 
                        dataKey="name" 
                        stroke={textColor}
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                        stroke={textColor}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip 
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']}
                        labelFormatter={(label) => `${label}`}
                    />
                    <Legend />
                    {validGoals.map((goal, index) => (
                        <Line
                            key={goal._id}
                            type="monotone"
                            dataKey={goal._id}
                            name={goal.name}
                            stroke={`hsl(${index * 360 / validGoals.length}, 70%, 50%)`}
                            activeDot={{ r: 6 }}
                            strokeWidth={2}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
};

export default SavingsProgressChart;