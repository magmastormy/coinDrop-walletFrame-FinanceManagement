import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, Image as ImageIcon } from 'lucide-react';
import { useTheme } from '../../../theme/ThemeContext';
import { Button } from '../../ui/Button';


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
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            backgroundColor: `${theme.background.primary}CC`,
            isolation: 'isolate'
          }}
          onClick={handleBackdropClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-card border border-border rounded-xl shadow-2xl relative overflow-hidden w-[90%] max-w-3xl max-h-[90vh] flex flex-col"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">{post.title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 education-modal-content">
              {/* Author Info */}
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mr-4">
                  {post.author?.profilePicture ? (
                    <img
                      src={post.author.profilePicture}
                      alt={post.author?.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-primary font-semibold">
                      {(post.author?.name || 'A')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{post.author?.name || 'Anonymous User'}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</p>
                </div>
              </div>

              {/* Content */}
              <div
                className="prose dark:prose-invert max-w-none mb-6"
                style={{
                  '--tw-prose-body': theme.text.primary,
                  '--tw-prose-headings': theme.text.heading
                }}
                dangerouslySetInnerHTML={{ __html: post.details }}
              />

              <hr className="border-border my-6" />

              {/* Actions */}
              <div className="flex gap-3 mb-6">
                <Button
                  variant="outline"
                  onClick={handleLike}
                  className={isLiked ? 'border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20' : ''}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? 'Liked' : 'Like'} {post.likes?.length > 0 && `(${post.likes.length})`}
                </Button>
              </div>

              {/* Comments Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Comments {post.comments?.length > 0 && `(${post.comments.length})`}
                </h3>

                <form onSubmit={handleCommentSubmit} className="mb-6">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-3"
                  />
                  <Button
                    type="submit"
                    disabled={!newComment.trim()}
                  >
                    Post Comment
                  </Button>
                </form>

                {post.comments && post.comments.length > 0 ? (
                  <div className="space-y-4">
                    {post.comments.map((comment, index) => (
                      <div
                        key={comment._id || index}
                        className="p-4 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mr-3">
                            {comment.author?.profilePicture ? (
                              <img
                                src={comment.author.profilePicture}
                                alt={comment.author?.name || 'User'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-primary font-semibold text-sm">
                                {(comment.author?.name || 'A')[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{comment.author?.name || 'Anonymous User'}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                          </div>
                        </div>
                        <p className="text-sm text-foreground ml-11">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-sm">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>
            </div>
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
