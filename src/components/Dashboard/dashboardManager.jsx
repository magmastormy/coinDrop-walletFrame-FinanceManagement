import React from 'react';
import DashboardUserGreetings from './dashboardUser Greetings';
import DashboardQuickNavLinks from './dashboardQuickNavLinks';
import DashboardUserShortAnalytics from './dashboardUser ShortAnalytics';
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
        <DashboardUser ShortAnalytics />
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