import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const ImageUploadPreview = ({ images, onRemove }) => {
    return (
        <div className="image-preview-container">
            <AnimatePresence>
                {images.map((image, index) => (
                    <motion.div
                        key={image._id || index}
                        className="image-preview-item"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        layout
                    >
                        <img 
                            src={image.url || URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="preview-image"
                        />
                        <button
                            className="remove-image-btn"
                            onClick={() => onRemove(image._id || index)}
                            aria-label="Remove image"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ImageUploadPreview; 