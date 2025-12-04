import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faTimes } from '@fortawesome/free-solid-svg-icons';


const EducationImageGallery = ({ images, initialIndex = 0, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    if (!images || images.length === 0) return null;

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowRight') handleNext(e);
        if (e.key === 'ArrowLeft') handlePrev(e);
        if (e.key === 'Escape') onClose();
    };

    return (
        <div
            className="image-gallery-overlay"
            onClick={onClose}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            <motion.div
                className="image-gallery-content"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
            >
                <button className="close-button" onClick={onClose}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>

                <div className="image-container">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={currentIndex}
                            src={images[currentIndex].url}
                            alt={`Gallery image ${currentIndex + 1}`}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ duration: 0.2 }}
                        />
                    </AnimatePresence>
                </div>

                {images.length > 1 && (
                    <>
                        <button
                            className="nav-button prev"
                            onClick={handlePrev}
                            aria-label="Previous image"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <button
                            className="nav-button next"
                            onClick={handleNext}
                            aria-label="Next image"
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                        <div className="image-counter">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </>
                )}

                <div className="thumbnail-container">
                    {images.map((image, index) => (
                        <motion.div
                            key={index}
                            className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => setCurrentIndex(index)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <img
                                src={image.url}
                                alt={`Thumbnail ${index + 1}`}
                                loading="lazy"
                            />
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default EducationImageGallery;
