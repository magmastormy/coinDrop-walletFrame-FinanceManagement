import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faTimes } from '@fortawesome/free-solid-svg-icons';
import './styles/imageUpload.css';

const ImageUpload = ({ onImageUpload, onImageRemove, currentImage, imageType }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleImageUpload = async (file) => {
        if (!file) return;
        setUploading(true);
        setError('');

        try {
            await onImageUpload(file);
        } catch (error) {
            setError(error.message);
        } finally {
            setUploading(false);
        }
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            
            try {
                setUploading(true);
                setError('');
                
                await onImageUpload(file);
                
            } catch (error) {
                console.error('Error in image drop handler:', error);
                setError(error.message || 'Failed to upload image');
            } finally {
                setUploading(false);
            }
        }
    }, [onImageUpload]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        },
        maxSize: 5242880 // 5MB
    });

    return (
        <div className="image-upload-container">
            {uploading && <div className="loading-overlay">Uploading...</div>}
            {error && <p className="error-message">{error}</p>}
            <div className="current-image-container">
                {currentImage && (
                    <div className="current-image">
                        <img src={currentImage} alt="Current" />
                        {onImageRemove && (
                            <button 
                                onClick={onImageRemove}
                                className="remove-image"
                                aria-label="Remove image"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        )}
                    </div>
                )}
            </div>
            <div className="upload-section">
                <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    <FontAwesomeIcon icon={faImage} className="upload-icon" />
                    <p>{imageType === 'profile' ? 'Upload profile picture' : 'Drop images or click to select'}</p>
                </div>
            </div>
        </div>
    );
};

export default ImageUpload;