import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faTimes } from '@fortawesome/free-solid-svg-icons';
import ImageService from '../../services/imageService';
import { useTheme } from '../../theme/ThemeContext';
import './styles/educationImageUploadStyles.css';

const EducationImageUpload = ({ 
    onImageUpload, 
    onImageRemove, 
    currentImages = [], 
    maxImages = 5,
    className = '' 
}) => {
    const { theme } = useTheme();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleImageUpload = async (files) => {
        if (files.length + currentImages.length > maxImages) {
            setError(`Maximum ${maxImages} images allowed`);
            return;
        }
        
        setUploading(true);
        setError('');
        
        try {
            for (const file of files) {
                if (!(file instanceof File)) {
                    throw new Error('Invalid file format');
                }
                
                // Call the parent handler for image upload
                await onImageUpload(file);
            }
        } catch (error) {
            setError(error.message || 'Error uploading image');
            console.error('Image upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: async (acceptedFiles) => {
            handleImageUpload(acceptedFiles);
        },
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif']
        },
        maxSize: 5 * 1024 * 1024 // 5MB
    });

    const containerStyle = {
        backgroundColor: theme.background.secondary,
        color: theme.text.primary,
        padding: '20px',
        borderRadius: '8px',
        transition: theme.transition
    };

    const dropzoneStyle = {
        border: `2px dashed ${theme.border}`,
        backgroundColor: theme.background.primary,
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: theme.transition
    };

    return (
        <div className={`education-image-upload ${className}`} style={containerStyle}>
            <div className="current-images">
                {currentImages.map((image, index) => (
                    <div className="image-preview" key={index}>
                        <img 
                            src={image.preview || image.url} 
                            alt={`Preview ${index + 1}`} 
                        />
                        <button 
                            onClick={() => onImageRemove(index)}
                            className="remove-image"
                            aria-label="Remove image"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                ))}
            </div>

            {currentImages.length < maxImages && (
                <div {...getRootProps()} className="dropzone" style={dropzoneStyle}>
                    <input {...getInputProps()} />
                    <FontAwesomeIcon 
                        icon={faImage} 
                        className="upload-icon"
                    />
                    <p>Drop images or click to select</p>
                    <span className="image-limit">
                        {currentImages.length} / {maxImages} images
                    </span>
                </div>
            )}
            
            {error && <p className="error-message">{error}</p>}
            {uploading && <div className="loading-overlay">Uploading...</div>}
        </div>
    );
};

export default EducationImageUpload;