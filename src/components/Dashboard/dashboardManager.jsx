import React from 'react';
import { motion } from 'framer-motion';
import { Box, Container, Grid, Paper, Typography } from '@mui/material';
import DashboardUserGreetings from './dashboardUserGreetings';
import DashboardUserShortAnalytics from './dashboardUserShortAnalytics';
import DashboardBarChart from './dashboardBarChart';
import DashboardPieChart from './dashboardPieChart';
import DashboardRenderStocksPrices from './dashboardRenderStocksPrices';
import DashboardTables from './dashboardTables';
import DashboardQuickNavLinks from './dashboardQuickNavLinks';
import './styles/dashboardManagerStyles.css';

const DashboardManager = () => {
    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <Grid container spacing={3}>
                    <Grid item xs={12} lg={8}>
                        <Box className="dashboard-section">
                            <Typography variant="h4" className="dashboard-section-title">
                                Financial Overview
                            </Typography>
                            {/* User Greeting */}
                            <Paper 
                                elevation={0} 
                                sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'background.default' }}
                            >
                                <DashboardUserGreetings />
                            </Paper>

                            {/* Analytics Overview */}
                            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                                <DashboardUserShortAnalytics />
                            </Paper>

                            {/* Charts Section */}
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                                        <DashboardBarChart />
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                                        <DashboardPieChart />
                                    </Paper>
                                </Grid>
                            </Grid>

                            {/* Recent Activity */}
                            <Paper sx={{ p: 3, borderRadius: 2 }}>
                                <DashboardTables />
                            </Paper>
                        </Box>
                    </Grid>

                    <Grid item xs={12} lg={4}>
                        <Box className="dashboard-section">
                            <Typography variant="h4" className="dashboard-section-title">
                                Quick Insights
                            </Typography>
                            <Box sx={{ position: 'sticky', top: 24 }}>
                                {/* Crypto Prices Panel */}
                                <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                                    <DashboardRenderStocksPrices />
                                </Paper>

                                {/* Quick Navigation */}
                                <Paper sx={{ p: 3, borderRadius: 2 }}>
                                    <DashboardQuickNavLinks />
                                </Paper>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </motion.div>
        </Container>
    );
};

export default DashboardManager;