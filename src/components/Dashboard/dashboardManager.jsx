import React from 'react';
import DashboardUserGreetings from './dashboardUserGreetings';
import DashboardQuickNavLinks from './dashboardQuickNavLinks';
import DashboardUserShortAnalytics from './dashboardUserShortAnalytics';
import DashboardBarChart from './dashboardBarChart';
import DashboardPieChart from './dashboardPieChart';
import DashboardTables from './dashboardTables';
import DashboardRenderStocksPrices from './dashboardRenderStocksPrices';
import './styles/dashboardManagerStyles.css';

const DashboardManager = () => {
  return (
    <div className="dashboard-container">
      <DashboardUserGreetings />
      <DashboardQuickNavLinks />
      <div className="dashboard-analytics">
        <DashboardUserShortAnalytics />
        <div className="dashboard-charts">
          <DashboardBarChart />
          <DashboardPieChart />
        </div>
      </div>
      <div className="dashboard-tables-stocks">
        <DashboardTables />
        <DashboardRenderStocksPrices />
      </div>
    </div>
  );
};

export default DashboardManager;