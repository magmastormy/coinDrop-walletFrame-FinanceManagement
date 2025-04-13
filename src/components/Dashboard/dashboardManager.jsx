import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Box, Container, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import DashboardUserGreetings from './dashboardUserGreetings';
import DashboardUserShortAnalytics from './dashboardUserShortAnalytics';
import DashboardQuickNavLinks from './dashboardQuickNavLinks';
import './styles/dashboardManagerStyles.css';

// Lazy load less critical components
const DashboardBarChart = lazy(() => import('./dashboardBarChart'));
const DashboardPieChart = lazy(() => import('./dashboardPieChart'));
const DashboardRenderStocksPrices = lazy(() => import('./dashboardRenderStocksPrices'));
const DashboardTables = lazy(() => import('./dashboardTables'));

// Loading fallback component
const ComponentLoader = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress size={40} color="primary" />
    </Box>
);

const DashboardManager = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [showCharts, setShowCharts] = useState(false);
    const [showTables, setShowTables] = useState(false);

    // Use a staggered approach to rendering components
    useEffect(() => {
        // Show the dashboard immediately
        setIsVisible(true);
        
        // Delay loading charts slightly
        const chartsTimer = setTimeout(() => {
            setShowCharts(true);
        }, 100);
        
        // Delay loading tables more
        const tablesTimer = setTimeout(() => {
            setShowTables(true);
        }, 500);
        
        return () => {
            clearTimeout(chartsTimer);
            clearTimeout(tablesTimer);
        };
    }, []);

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isVisible ? 1 : 0 }}
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
                            {showCharts && (
                                <Grid container spacing={3} sx={{ mb: 3 }}>
                                    <Grid item xs={12} md={6}>
                                        <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                                            <Suspense fallback={<ComponentLoader />}>
                                                <DashboardBarChart />
                                            </Suspense>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                                            <Suspense fallback={<ComponentLoader />}>
                                                <DashboardPieChart />
                                            </Suspense>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            )}

                            {/* Recent Activity */}
                            {showTables && (
                                <Paper sx={{ p: 3, borderRadius: 2 }}>
                                    <Suspense fallback={<ComponentLoader />}>
                                        <DashboardTables />
                                    </Suspense>
                                </Paper>
                            )}
                        </Box>
                    </Grid>

                    <Grid item xs={12} lg={4}>
                        <Box className="dashboard-section">
                            <Typography variant="h4" className="dashboard-section-title">
                                Quick Insights
                            </Typography>
                            <Box sx={{ position: 'sticky', top: 24 }}>
                                {/* Crypto Prices Panel */}
                                {showCharts && (
                                    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                                        <Suspense fallback={<ComponentLoader />}>
                                            <DashboardRenderStocksPrices />
                                        </Suspense>
                                    </Paper>
                                )}

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