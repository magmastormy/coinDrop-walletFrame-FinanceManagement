import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faTimes } from '@fortawesome/free-solid-svg-icons';
import { compressImage } from '../../services/imageService';

const EducationImageUpload = ({ 
    onImageUpload, 
    onImageRemove, 
    currentImages = [], 
    maxImages = 5,
    className = '' 
}) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleImageUpload = async (file) => {
        if (!file) return;
        
        if (currentImages.length >= maxImages) {
            setError(`Maximum ${maxImages} images allowed`);
            return;
        }
    
        setUploading(true);
        setError('');
    
        try {
            const compressedFile = await ImageService.compressImage(file);
            await onImageUpload(compressedFile);
        } catch (error) {
            setError(error.message);
        } finally {
            setUploading(false);
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: async (acceptedFiles) => {
            for (const file of acceptedFiles) {
                if (currentImages.length >= maxImages) break;
                await handleImageUpload(file);
            }
        },
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        },
        maxSize: 5242880, // 5MB
        multiple: true
    });

    return (
        <div className={`education-image-upload ${className}`}>
            <div className="current-images">
                {currentImages.map((image, index) => (
                    <div key={index} className="image-preview">
                        <img src={image.url} alt={`Upload ${index + 1}`} />
                        <button
                            onClick={() => onImageRemove(image._id)}
                            className="remove-image"
                            aria-label="Remove image"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                ))}
            </div>

            {currentImages.length < maxImages && (
                <div {...getRootProps()} className="dropzone">
                    <input {...getInputProps()} />
                    <FontAwesomeIcon icon={faImage} className="upload-icon" />
                    <p>Drop images or click to select</p>
                    <span className="image-limit">
                        {currentImages.length} / {maxImages} images
                    </span>
                </div>
            )}
            
            {error && <p className="error-message">{error}</p>}
            {uploading && <p className="uploading-message">Uploading...</p>}
        </div>
    );
};

export default EducationImageUpload;