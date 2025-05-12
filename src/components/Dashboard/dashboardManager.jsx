import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import DashboardUserGreetings from './dashboardUserGreetings';
import DashboardUserShortAnalytics from './dashboardUserShortAnalytics';
import DashboardQuickNavLinks from './dashboardQuickNavLinks';
import './styles/dashboardManagerStyles.css';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

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
    
    // Use Material-UI's responsive hooks
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

    // Use a staggered approach to rendering components
    useEffect(() => {
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
        <Container maxWidth="xl" sx={{ py: 3, px: isMobile ? 1 : 3 }}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isVisible ? 1 : 0 }}
                transition={{ duration: 0.3 }}
            >
                <Grid container spacing={isMobile ? 2 : 3}>
                    <Grid item xs={12} lg={8}>
                        <Box className="dashboard-section">
                            <Typography variant="h4" className="dashboard-section-title" sx={{ 
                                fontSize: isMobile ? '1.5rem' : '2rem',
                                mb: isMobile ? 1 : 2 
                            }}>
                                Financial Overview
                            </Typography>
                            {/* User Greeting */}
                            <Paper 
                                elevation={0} 
                                sx={{ 
                                    p: isMobile ? 2 : 3, 
                                    mb: isMobile ? 2 : 3, 
                                    borderRadius: 2, 
                                    bgcolor: 'background.default' 
                                }}
                            >
                                <DashboardUserGreetings />
                            </Paper>

                            {/* Analytics Overview */}
                            <Paper sx={{ p: isMobile ? 2 : 3, mb: isMobile ? 2 : 3, borderRadius: 2 }}>
                                <DashboardUserShortAnalytics />
                            </Paper>

                            {/* Charts Section */}
                            {showCharts && (
                                <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: isMobile ? 2 : 3 }}>
                                    <Grid item xs={12} md={6}>
                                        <Paper sx={{ p: isMobile ? 2 : 3, height: '100%', borderRadius: 2 }}>
                                            <Suspense fallback={<ComponentLoader />}>
                                                <DashboardBarChart />
                                            </Suspense>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Paper sx={{ p: isMobile ? 2 : 3, height: '100%', borderRadius: 2 }}>
                                            <Suspense fallback={<ComponentLoader />}>
                                                <DashboardPieChart />
                                            </Suspense>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            )}

                            {/* Recent Activity */}
                            {showTables && (
                                <Paper sx={{ p: isMobile ? 2 : 3, borderRadius: 2 }}>
                                    <Suspense fallback={<ComponentLoader />}>
                                        <DashboardTables />
                                    </Suspense>
                                </Paper>
                            )}
                        </Box>
                    </Grid>

                    <Grid item xs={12} lg={4}>
                        <Box className="dashboard-section">
                            <Typography variant="h4" className="dashboard-section-title" sx={{ 
                                fontSize: isMobile ? '1.5rem' : '2rem',
                                mb: isMobile ? 1 : 2 
                            }}>
                                Quick Insights
                            </Typography>
                            <Box sx={{ 
                                position: isTablet || isMobile ? 'static' : 'sticky', 
                                top: 24 
                            }}>
                                {/* Crypto Prices Panel */}
                                {showCharts && (
                                    <Paper sx={{ p: isMobile ? 2 : 3, mb: isMobile ? 2 : 3, borderRadius: 2 }}>
                                        <Suspense fallback={<ComponentLoader />}>
                                            <DashboardRenderStocksPrices />
                                        </Suspense>
                                    </Paper>
                                )}

                                {/* Quick Navigation */}
                                <Paper sx={{ p: isMobile ? 2 : 3, borderRadius: 2 }}>
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