import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faTimes } from '@fortawesome/free-solid-svg-icons';
import ImageService from '../../services/imageService';
import { useTheme } from '../../theme/ThemeContext';

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

    const handleImageUpload = async (file) => {
        if (!(file instanceof File)) {
            throw new Error('Invalid file format');
        }
        
        if (currentImages.length >= maxImages) {
            setError(`Maximum ${maxImages} images allowed`);
            return;
        }
    
        setUploading(true);
        setError('');
    
        try {
            const uploadedImage = await ImageService.uploadImage(file, 'education');
            await onImageUpload(uploadedImage);
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
                    <div key={index} className="image-preview" style={{ position: 'relative' }}>
                        <img 
                            src={image.url} 
                            alt={`Upload ${index + 1}`}
                            className="preview-image"
                            loading="lazy"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '4px'
                            }}
                        />
                        <button
                            onClick={() => onImageRemove(image._id)}
                            className="remove-image"
                            aria-label="Remove image"
                            style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                ))}
            </div>

            {currentImages.length < maxImages && (
                <div {...getRootProps()} style={dropzoneStyle}>
                    <input {...getInputProps()} />
                    <FontAwesomeIcon 
                        icon={faImage} 
                        style={{ 
                            fontSize: '2em', 
                            marginBottom: '10px',
                            color: theme.text.secondary 
                        }} 
                    />
                    <p style={{ color: theme.text.primary }}>Drop images or click to select</p>
                    <span style={{ 
                        color: theme.text.secondary,
                        fontSize: '0.9em' 
                    }}>
                        {currentImages.length} / {maxImages} images
                    </span>
                </div>
            )}
            
            {error && <p style={{ color: theme.error, marginTop: '10px' }}>{error}</p>}
            {uploading && <p style={{ color: theme.text.secondary, marginTop: '10px' }}>Uploading...</p>}
        </div>
    );
};

export default EducationImageUpload;