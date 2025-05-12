import React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import { MoreVert, Edit, Delete } from '@mui/icons-material';
import { useTheme } from '../../../theme/ThemeContext';

const PostActionMenu = ({ post, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { isDarkMode } = useTheme();
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit(post);
    handleClose();
  };

  const handleDelete = () => {
    onDelete(post._id);
    handleClose();
  };

  return (
    <>
      <IconButton 
        aria-label="more" 
        aria-controls="post-menu" 
        aria-haspopup="true"
        onClick={handleClick}
        size="small"
      >
        <MoreVert />
      </IconButton>
      <Menu
        id="post-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? 'background.paper' : 'white',
            boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit Post" />
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete Post" sx={{ color: 'error.main' }} />
        </MenuItem>
      </Menu>
    </>
  );
};

export default PostActionMenu; 