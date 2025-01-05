import React from 'react';
import { motion } from 'framer-motion';
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
        <motion.div
            className="dashboard-container p-6 space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Greetings Section */}
            <DashboardUserGreetings />

            {/* Analytics Cards */}
            <DashboardUserShortAnalytics />

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardBarChart />
                <DashboardPieChart />
            </div>

            {/* Crypto Prices and Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardRenderStocksPrices />
                <DashboardTables />
            </div>

            {/* Quick Navigation */}
            <DashboardQuickNavLinks />
        </motion.div>
    );
};

export default DashboardManager;