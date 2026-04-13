import { useLogger } from './hooks/useLogger';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes,
    faTrash,
    faPaperPlane,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';


const CommentModal = ({ educationId, onClose, onSubmit, onDelete }) => {
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        fetchComments();
    }, [educationId]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/education/${educationId}/comments`);
            const data = await response.json();
            setComments(data);
        } catch (error) {
            logError('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        setSubmitting(true);
        try {
            await onSubmit(educationId, { text: comment });
            setComment('');
            await fetchComments();
        } catch (error) {
            logError('Error submitting comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId) => {
        try {
            await onDelete(educationId, commentId);
            await fetchComments();
        } catch (error) {
            logError('Error deleting comment:', error);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.8
        },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
            }
        },
        exit: {
            opacity: 0,
            scale: 0.8,
            transition: {
                duration: 0.2
            }
        }
    };

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={onClose}
            >
                <motion.div
                    className="comment-modal"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <h2>Comments</h2>
                        <button className="close-btn" onClick={onClose}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    <div className="comments-container">
                        {loading ? (
                            <div className="loading-spinner">
                                <FontAwesomeIcon icon={faSpinner} spin />
                                <span>Loading comments...</span>
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="no-comments">
                                <p>No comments yet. Be the first to comment!</p>
                            </div>
                        ) : (
                            <motion.div
                                className="comments-list"
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.1
                                        }
                                    }
                                }}
                            >
                                {comments.map(comment => (
                                    <motion.div
                                        key={comment._id}
                                        className="comment"
                                        variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            visible: { opacity: 1, y: 0 }
                                        }}
                                    >
                                        <div className="comment-header">
                                            <div className="comment-author">
                                                <img
                                                    src={comment.author?.avatar || '/default-avatar.png'}
                                                    alt={comment.author?.name}
                                                />
                                                <div className="author-info">
                                                    <h4>{comment.author?.name || 'Anonymous'}</h4>
                                                    <span>{formatDate(comment.createdAt)}</span>
                                                </div>
                                            </div>
                                            {comment.author?._id === user.id && (
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDelete(comment._id)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="comment-text">{comment.text}</p>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    <form className="comment-form" onSubmit={handleSubmit}>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Write a comment..."
                            rows="3"
                        />
                        <motion.button
                            type="submit"
                            className="submit-btn"
                            disabled={submitting || !comment.trim()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {submitting ? (
                                <FontAwesomeIcon icon={faSpinner} spin />
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                    <span>Post</span>
                                </>
                            )}
                        </motion.button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CommentModal;
