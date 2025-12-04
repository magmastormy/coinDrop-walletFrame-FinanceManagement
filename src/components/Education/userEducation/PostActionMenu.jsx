import React from 'react';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useTheme } from '../../../theme/ThemeContext';

const PostActionMenu = ({ post, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { theme } = useTheme();

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
      <button
        onClick={handleClick}
        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
        aria-label="more actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {anchorEl && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
          />
          <div className="absolute z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[150px] mt-2">
            <button
              onClick={handleEdit}
              className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-3 text-foreground transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Post</span>
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-3 text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Post</span>
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default PostActionMenu;