import { useEffect } from 'react';
import PropTypes from 'prop-types';
import './styles/profileModal.css';

const ProfileModal = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            <div className="profile-modal-overlay" onClick={onClose} />
            <div className="profile-modal">
                <div className="profile-modal-header">
                    <h2>{title}</h2>
                    <button 
                        className="profile-modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
                <div className="profile-modal-content">
                    {children}
                </div>
            </div>
        </>
    );
};

ProfileModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired
};

export default ProfileModal;