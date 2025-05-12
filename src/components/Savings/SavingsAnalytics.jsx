import React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import useTheme from '@mui/material/styles/useTheme';
import { Line } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faWallet, 
    faPiggyBank, 
    faChartLine, 
    faPercent 
} from '@fortawesome/free-solid-svg-icons';

const SavingsAnalytics = ({ accounts }) => {
    const theme = useTheme();

    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const totalGoals = accounts.reduce((sum, account) => sum + (account.goal || 0), 0);
    const goalProgress = totalGoals > 0 ? (totalBalance / totalGoals) * 100 : 0;

    const analyticsCards = [
        {
            title: 'Total Balance',
            value: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(totalBalance),
            icon: faWallet,
            trend: '+15%',
            trendUp: true
        },
        {
            title: 'Active Accounts',
            value: accounts.length,
            icon: faPiggyBank
        },
        {
            title: 'Total Goals',
            value: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(totalGoals),
            icon: faChartLine
        },
        {
            title: 'Goal Progress',
            value: goalProgress.toFixed(1) + '%',
            icon: faPercent,
            trend: '-5%',
            trendUp: false
        }
    ];

    // Sample data for the line chart
    const chartData = {
        labels: ['Feb 9', 'Feb 10', 'Feb 11', 'Feb 12', 'Feb 13', 'Feb 14', 'Feb 15'],
        datasets: [
            {
                label: 'Balance Trend',
                data: [200, 250, 300, 350, 400, 450, 500],
                fill: true,
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.primary.main + '20',
                tension: 0.4
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    color: theme.palette.divider
                },
                ticks: {
                    color: theme.palette.text.secondary
                }
            },
            y: {
                grid: {
                    color: theme.palette.divider
                },
                ticks: {
                    color: theme.palette.text.secondary
                }
            }
        }
    };

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ mb: 3, color: theme.palette.text.primary }}>
                Savings Analytics
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {analyticsCards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Paper
                            sx={{
                                p: 3,
                                height: '100%',
                                bgcolor: theme.palette.background.paper,
                                borderRadius: 2,
                                boxShadow: theme.shadows[2],
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                                        {card.title}
                                    </Typography>
                                    <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                                        {card.value}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        p: 1,
                                        borderRadius: 1,
                                        bgcolor: theme.palette.primary.main + '20',
                                        color: theme.palette.primary.main,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <FontAwesomeIcon icon={card.icon} />
                                </Box>
                            </Box>
                            {card.trend && (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        mt: 2,
                                        color: card.trendUp ? theme.palette.success.main : theme.palette.error.main
                                    }}
                                >
                                    {card.trend}
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Paper
                sx={{
                    p: 3,
                    bgcolor: theme.palette.background.paper,
                    borderRadius: 2,
                    boxShadow: theme.shadows[2],
                    height: '300px'
                }}
            >
                <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary }}>
                    Balance Trend
                </Typography>
                <Box sx={{ height: 'calc(100% - 40px)' }}>
                    <Line data={chartData} options={chartOptions} />
                </Box>
            </Paper>
        </Box>
    );
};

export default SavingsAnalytics;