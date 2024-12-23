import React, { useState, useRef } from 'react';
import './styles/imageUpload.css';

const ImageUpload = ({ onImageSelect }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef();

    const handleFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target.result);
                onImageSelect(file);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please upload an image file');
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    const handleChange = (e) => {
        const file = e.target.files[0];
        handleFile(file);
    };

    return (
        <div className="image-upload-container">
            <div 
                className={`upload-area ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
            >
                {preview ? (
                    <img src={preview} alt="Preview" className="image-preview" />
                ) : (
                    <div className="upload-prompt">
                        <i className="fas fa-cloud-upload-alt"></i>
                        <p>Drag and drop your profile image or click to select</p>
                        <span className="required-note">*Profile image is required</span>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                />
            </div>
        </div>
    );
};

export default ImageUpload;