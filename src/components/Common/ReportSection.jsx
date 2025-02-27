import React from 'react';
import { Box, Typography } from '@mui/material';
import ReportButton from './reportButton';

const ReportSection = ({ title, accountId, reportType }) => {
    return (
        <Box 
            sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2,
                p: 2,
                backgroundColor: 'background.paper',
                borderRadius: 1
            }}
        >
            <Typography variant="h6">{title}</Typography>
            <ReportButton 
                accountId={accountId}
                defaultReportType={reportType}
                label={`Export ${title}`}
            />
        </Box>
    );
};

export default ReportSection; 