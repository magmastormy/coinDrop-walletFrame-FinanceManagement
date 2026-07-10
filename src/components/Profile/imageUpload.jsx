import { logError } from '../../utils/logger';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image, X, Loader } from 'lucide-react';
import { cn } from '../../lib/utils';

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
                logError('Error in image drop handler:', error);
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
        <div className="relative space-y-3">
            {uploading && (
                <div
                    className="absolute inset-0 flex items-center justify-center z-10 rounded-lg"
                    style={{ background: 'rgba(0,0,0,0.55)' }}
                >
                    <Loader className="w-6 h-6 animate-spin text-primary" strokeWidth={1.5} />
                </div>
            )}

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                    {error}
                </div>
            )}

            {currentImage && (
                <div className="relative inline-block">
                    <img
                        src={currentImage}
                        alt="Current"
                        className="w-32 h-32 rounded-lg object-cover"
                        style={{ border: '1px solid var(--color-border)' }}
                    />
                    {onImageRemove && (
                        <button
                            onClick={onImageRemove}
                            className={cn(
                                "absolute top-2 right-2 p-2 rounded-full",
                                "bg-red-500/90 hover:bg-red-500 transition-colors"
                            )}
                            aria-label="Remove image"
                        >
                            <X className="w-[18px] h-[18px] text-white" strokeWidth={1.5} />
                        </button>
                    )}
                </div>
            )}

            <div
                {...getRootProps()}
                className={cn(
                    "p-8 border-2 border-dashed rounded-lg",
                    "transition-all cursor-pointer",
                    "flex flex-col items-center gap-3"
                )}
                style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-surface-1)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-surface-2)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--color-surface-1)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
            >
                <input {...getInputProps()} />
                <Image className="w-12 h-12 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-muted-foreground text-center">
                    {imageType === 'profile' ? 'Upload profile picture' : 'Drop images or click to select'}
                </p>
                <p className="text-xs text-muted-foreground">
                    Max size: 5MB
                </p>
            </div>
        </div>
    );
};

export default ImageUpload;
