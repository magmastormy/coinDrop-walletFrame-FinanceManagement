import React from 'react';
import { Box, Paper, Typography, Grid, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPiggyBank, 
    faChartLine, 
    faWallet,
    faArrowTrendUp
} from '@fortawesome/free-solid-svg-icons';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const StatCard = ({ title, value, icon, color, trend }) => {
    const theme = useTheme();
    
    return (
        <Paper
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{
                p: 3,
                height: '100%',
                bgcolor: theme.palette.mode === 'dark' ? '#2d3748' : theme.palette.background.paper,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FontAwesomeIcon 
                    icon={icon} 
                    style={{ 
                        color: color,
                        fontSize: '1.5rem'
                    }} 
                />
                {trend && (
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: trend >= 0 ? theme.palette.success.main : theme.palette.error.main,
                        gap: 0.5
                    }}>
                        <FontAwesomeIcon 
                            icon={faArrowTrendUp} 
                            style={{ 
                                transform: trend >= 0 ? 'none' : 'rotate(180deg)',
                                fontSize: '0.875rem'
                            }} 
                        />
                        <Typography variant="body2">
                            {Math.abs(trend)}%
                        </Typography>
                    </Box>
                )}
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {title}
            </Typography>
        </Paper>
    );
};

const SavingsAnalytics = ({ accounts }) => {
    const theme = useTheme();

    // Calculate total balance
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    
    // Calculate total goals
    const totalGoals = accounts.reduce((sum, account) => sum + (account.goal || 0), 0);
    
    // Calculate progress towards goals
    const goalProgress = totalGoals > 0 ? (totalBalance / totalGoals) * 100 : 0;

    // Generate mock data for the chart (last 7 days)
    const generateChartData = () => {
        const dates = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        // Mock balance progression
        const balances = [totalBalance * 0.85, totalBalance * 0.88, totalBalance * 0.9, 
                         totalBalance * 0.92, totalBalance * 0.95, totalBalance * 0.97, totalBalance];

        return {
            labels: dates,
            datasets: [{
                label: 'Total Balance',
                data: balances,
                fill: true,
                backgroundColor: theme.palette.primary.main + '20',
                borderColor: theme.palette.primary.main,
                tension: 0.4
            }]
        };
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: {
                    color: theme.palette.divider
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Savings Analytics
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Balance"
                        value={`$${totalBalance.toFixed(2)}`}
                        icon={faWallet}
                        color={theme.palette.primary.main}
                        trend={15}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Active Accounts"
                        value={accounts.length}
                        icon={faPiggyBank}
                        color={theme.palette.info.main}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Goals"
                        value={`$${totalGoals.toFixed(2)}`}
                        icon={faChartLine}
                        color={theme.palette.success.main}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Goal Progress"
                        value={`${goalProgress.toFixed(1)}%`}
                        icon={faArrowTrendUp}
                        color={theme.palette.warning.main}
                        trend={goalProgress - 85}
                    />
                </Grid>
            </Grid>

            <Paper 
                sx={{ 
                    p: 3,
                    bgcolor: theme.palette.mode === 'dark' ? '#2d3748' : theme.palette.background.paper,
                    borderRadius: 2
                }}
            >
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Balance Trend
                </Typography>
                <Box sx={{ height: 300 }}>
                    <Line data={generateChartData()} options={chartOptions} />
                </Box>
            </Paper>
        </Box>
    );
};

export default SavingsAnalytics;