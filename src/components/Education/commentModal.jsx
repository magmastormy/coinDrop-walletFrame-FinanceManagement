// src/components/Education/commentModal.jsx
import React, { useState } from 'react';
import './styles/commentModalStyles.css';

const CommentModal = ({ isOpen, onClose, onSubmit }) => {
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!comment.trim()) {
            setError('Comment text is required');
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit({ text: comment.trim() });
            setComment('');
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to add comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="comment-modal-overlay" onClick={(e) => e.target.className === 'comment-modal-overlay' && onClose()}>
            <div className="comment-modal-content">
                <div className="comment-modal-header">
                    <h3 className="comment-modal-title">Add Comment</h3>
                    <button 
                        type="button"
                        className="comment-modal-close-button"
                        onClick={onClose}
                        aria-label="Close"
                    >×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    {error && <div className="comment-modal-error-message">{error}</div>}
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Write your comment..."
                        rows={4}
                        className="comment-modal-input"
                    />
                    <div className="comment-modal-actions">
                        <button type="button" onClick={onClose} className="comment-modal-cancel-btn">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="comment-modal-submit-btn"
                        >
                            {isSubmitting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommentModal;