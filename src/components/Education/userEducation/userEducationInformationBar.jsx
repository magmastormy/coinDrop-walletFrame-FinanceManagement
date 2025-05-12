import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Add as AddIcon } from '@mui/icons-material';
import { useTheme } from '../../../theme/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faFileLines } from '@fortawesome/free-solid-svg-icons';
import './styles/userEducationInformationBarStyles.css';

const UserEducationInformation = ({ totalPosts, user, onCreateClick }) => {
    const { theme } = useTheme();

    return (
        <Box 
            className="user-education-information-bar"
            style={{
                backgroundColor: theme.background.secondary,
                color: theme.text.primary,
                borderColor: theme.border
            }}
        >
            <Box className="user-info">
                <FontAwesomeIcon icon={faUser} className="user-icon" style={{ color: theme.text.primary }} />
                <div className="user-details">
                    <Typography 
                        variant="body1" 
                        component="span"
                        style={{ color: theme.text.primary }}
                    >
                        {user?.username}
                    </Typography>
                    <Typography 
                        variant="body2" 
                        component="span"
                        style={{ color: theme.text.secondary }}
                    >
                        {user?.email}
                    </Typography>
                </div>
            </Box>
            <Box className="post-stats">
                <FontAwesomeIcon icon={faFileLines} className="post-icon" style={{ color: theme.text.primary }} />
                <Typography 
                    variant="body1" 
                    component="span"
                    style={{ color: theme.text.primary }}
                >
                    Total Posts: {totalPosts}
                </Typography>
            </Box>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onCreateClick}
                className="create-button"
                style={{
                    backgroundColor: theme.button.base,
                    color: theme.button.text
                }}
            >
                Create Post
            </Button>
        </Box>
    );
};

export default UserEducationInformation;