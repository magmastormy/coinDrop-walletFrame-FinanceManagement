// src/Dashboard.js

import React from 'react';
import { Grid, Paper, Typography, Box, Avatar, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const Dashboard = () => {
  const portfolioValue = 25684.23;
  const dailyChange = 5.2;
  
  const cryptoHoldings = [
    { name: 'Bitcoin', symbol: 'BTC', amount: 0.45, value: 15420, change: 2.4 },
    { name: 'Ethereum', symbol: 'ETH', amount: 3.2, value: 6240, change: -1.2 },
    { name: 'Solana', symbol: 'SOL', amount: 45.5, value: 4024, change: 8.7 }
  ];

  const recentTransactions = [
    { type: 'Buy', crypto: 'BTC', amount: 0.05, value: 1850, date: '2024-01-15' },
    { type: 'Sell', crypto: 'ETH', amount: 1.2, value: 2340, date: '2024-01-14' },
    { type: 'Buy', crypto: 'SOL', amount: 12.5, value: 1120, date: '2024-01-13' }
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 2, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <AccountBalanceWalletIcon sx={{ fontSize: 40, color: '#1976d2' }} />
              <Box>
                <Typography variant="h6" color="textSecondary">Total Portfolio Value</Typography>
                <Typography variant="h3">${portfolioValue.toLocaleString()}</Typography>
                <Chip
                  icon={dailyChange > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  label={`${dailyChange > 0 ? '+' : ''}${dailyChange}% Today`}
                  color={dailyChange > 0 ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Your Crypto</Typography>
            {cryptoHoldings.map((crypto) => (
              <Box key={crypto.symbol} sx={{ 
                p: 2, 
                mb: 2, 
                borderRadius: 1,
                backgroundColor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: '#1976d2' }}>{crypto.symbol[0]}</Avatar>
                  <Box>
                    <Typography variant="subtitle1">{crypto.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {crypto.amount} {crypto.symbol}
                    </Typography>
                  </Box>
                </Box>
                <Box textAlign="right">
                  <Typography variant="subtitle1">${crypto.value.toLocaleString()}</Typography>
                  <Chip
                    size="small"
                    label={`${crypto.change > 0 ? '+' : ''}${crypto.change}%`}
                    color={crypto.change > 0 ? 'success' : 'error'}
                  />
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Transactions</Typography>
            {recentTransactions.map((tx, index) => (
              <Box key={index} sx={{ 
                p: 2, 
                mb: 2, 
                borderRadius: 1,
                backgroundColor: '#f8f9fa'
              }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Chip
                    label={tx.type}
                    size="small"
                    color={tx.type === 'Buy' ? 'success' : 'error'}
                  />
                  <Typography variant="body2" color="textSecondary">
                    {tx.date}
                  </Typography>
                </Box>
                <Box mt={1}>
                  <Typography variant="subtitle2">
                    {tx.amount} {tx.crypto}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    ${tx.value.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;