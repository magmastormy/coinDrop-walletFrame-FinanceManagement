import React from 'react';
import UserProfileDetails from './userProfileDetails';
import { Box, Typography, Paper } from '@mui/material';

const Profile = () => {
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>Your Profile</Typography>
            <Paper sx={{ p: 2 }}>
                <UserProfileDetails />
            </Paper>
        </Box>
    );
};

export default Profile;
