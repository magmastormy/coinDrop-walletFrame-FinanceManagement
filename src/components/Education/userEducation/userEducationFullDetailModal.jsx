import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faHeart, faComment, faImage } from '@fortawesome/free-solid-svg-icons';
import { faHeart as farHeart } from '@fortawesome/free-regular-svg-icons';
import { useTheme } from '../../../theme/ThemeContext';

// MUI Components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

import '../styles/educationModalStyles.css';

// Create a portal container for the modal
let portalRoot = document.getElementById('modal-root');
if (!portalRoot) {
  portalRoot = document.createElement('div');
  portalRoot.id = 'modal-root';
  document.body.appendChild(portalRoot);
}

const UserEducationFullDetailModal = ({ post, isOpen, onClose, onLike, onComment, currentUser }) => {
  const { theme } = useTheme();
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [modalElement] = useState(() => document.createElement('div'));
  
  // Update like state when post changes
  useEffect(() => {
    if (post && currentUser) {
      setIsLiked(post.likes?.some(like => like === currentUser?._id || like === currentUser?.id) || false);
    }
  }, [post, currentUser]);
  
  // Set up portal for modal
  useEffect(() => {
    if (isOpen) {
      portalRoot.appendChild(modalElement);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      if (portalRoot.contains(modalElement)) {
        portalRoot.removeChild(modalElement);
      }
      // Restore body scrolling when modal is closed
      document.body.style.overflow = '';
    };
  }, [isOpen, modalElement]);
  
  if (!isOpen || !post) return null;

  const handleBackdropClick = (e) => {
    // Only close if clicking directly on the backdrop
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    if (onLike) {
      onLike(post._id);
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim() && onComment) {
      onComment(post._id, newComment);
      setNewComment('');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Use ReactDOM.createPortal to render the modal outside the normal DOM hierarchy
  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          onClick={handleBackdropClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ 
            backgroundColor: `${theme.background.primary}CC`,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            willChange: 'opacity',
            isolation: 'isolate'
          }}
        >
        <motion.div
          className="modal-content"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            backgroundColor: theme.background.secondary,
            color: theme.text.primary,
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            position: 'relative',
            overflow: 'hidden',
            willChange: 'transform, opacity'
          }}
        >
          <Box className="modal-header" sx={{ 
            p: 3, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.border || 'rgba(0,0,0,0.1)'}` 
          }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: theme.text.heading }}>
              {post.title}
            </Typography>
            <IconButton 
              className="close-button" 
              onClick={onClose}
              sx={{ color: theme.text.secondary }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </IconButton>
          </Box>

          <Box className="modal-body" sx={{ 
            p: 3, 
            maxHeight: 'calc(90vh - 180px)', 
            overflowY: 'auto',
            '& img': {
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '8px',
              margin: '16px 0'
            }
          }}>
            <Box className="author-info" sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2 
            }}>
              <Avatar 
                src={post.author?.profilePicture} 
                alt={post.author?.name || 'User'}
                sx={{ width: 40, height: 40, mr: 1.5 }}
              />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {post.author?.name || 'Anonymous User'}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.text.secondary }}>
                  {formatDate(post.createdAt)}
                </Typography>
              </Box>
            </Box>

            <Box 
              className="post-content" 
              sx={{ 
                my: 3,
                '& p': { mb: 2 },
                '& h1, & h2, & h3, & h4, & h5, & h6': { 
                  color: theme.text.heading,
                  mt: 3,
                  mb: 2
                }
              }}
              dangerouslySetInnerHTML={{ __html: post.details }}
            />

            <Divider sx={{ my: 3 }} />

            <Box className="post-actions" sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button 
                variant="outlined" 
                startIcon={<FontAwesomeIcon icon={isLiked ? faHeart : farHeart} />}
                onClick={handleLike}
                sx={{ 
                  color: isLiked ? theme.error : theme.text.secondary,
                  borderColor: isLiked ? theme.error : theme.text.secondary,
                  '&:hover': {
                    borderColor: theme.error,
                    backgroundColor: `${theme.error}10`
                  }
                }}
              >
                {isLiked ? 'Liked' : 'Like'} {post.likes?.length > 0 && `(${post.likes.length})`}
              </Button>
            </Box>

            <Box className="comments-section">
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Comments {post.comments?.length > 0 && `(${post.comments.length})`}
              </Typography>
              
              <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Add a comment..."
                  variant="outlined"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.background.primary,
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.primary
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.primary
                      }
                    }
                  }}
                />
                <Button 
                  type="submit"
                  variant="contained"
                  disabled={!newComment.trim()}
                  sx={{ 
                    backgroundColor: theme.primary,
                    '&:hover': {
                      backgroundColor: theme.primaryDark || theme.primary
                    }
                  }}
                >
                  Post Comment
                </Button>
              </Box>

              {post.comments && post.comments.length > 0 ? (
                <Box className="comments-list" sx={{ mt: 2 }}>
                  {post.comments.map((comment, index) => (
                    <Box 
                      key={comment._id || index} 
                      sx={{ 
                        mb: 2, 
                        p: 2, 
                        backgroundColor: theme.background.primary,
                        borderRadius: '8px'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar 
                          src={comment.author?.profilePicture} 
                          alt={comment.author?.name || 'User'}
                          sx={{ width: 32, height: 32, mr: 1 }}
                        />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                            {comment.author?.name || 'Anonymous User'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.text.secondary }}>
                            {formatDate(comment.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ ml: 5 }}>
                        {comment.text}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: theme.text.secondary, fontStyle: 'italic' }}>
                  No comments yet. Be the first to comment!
                </Typography>
              )}
            </Box>
          </Box>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>,
    modalElement
  );
};

UserEducationFullDetailModal.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    details: PropTypes.string.isRequired,
    author: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      profilePicture: PropTypes.string
    }),
    createdAt: PropTypes.string,
    likes: PropTypes.array,
    comments: PropTypes.array
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onLike: PropTypes.func,
  onComment: PropTypes.func,
  currentUser: PropTypes.object
};

export default UserEducationFullDetailModal;
