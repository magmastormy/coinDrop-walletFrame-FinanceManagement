import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image, X, Loader } from 'lucide-react';
import ImageService from '../../services/imageService';
import { useTheme } from '../../theme/ThemeContext';
import { cn } from '../../lib/utils';

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

    return (
        <div className={cn("space-y-4", className)}>
            {uploading && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10">
                    <Loader className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-foreground">Uploading...</span>
                </div>
            )}

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-3 gap-3">
                {currentImages.map((image, index) => (
                    <div className="relative group" key={index}>
                        <img
                            src={image.preview || image.url}
                            alt={`Preview ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-lg border border-white/10"
                        />
                        <button
                            onClick={() => onImageRemove(index)}
                            className={cn(
                                "absolute top-2 right-2 p-1.5 rounded-full",
                                "bg-red-500/90 hover:bg-red-500 transition-colors",
                                "opacity-0 group-hover:opacity-100"
                            )}
                            aria-label="Remove image"
                        >
                            <X className="w-3 h-3 text-white" />
                        </button>
                    </div>
                ))}
            </div>

            {currentImages.length < maxImages && (
                <div
                    {...getRootProps()}
                    className={cn(
                        "p-8 border-2 border-dashed border-white/20 rounded-lg",
                        "hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer",
                        "flex flex-col items-center gap-3"
                    )}
                >
                    <input {...getInputProps()} />
                    <Image className="w-12 h-12 text-muted-foreground" />
                    <p className="text-muted-foreground text-center">Drop images or click to select</p>
                    <span className="text-xs text-muted-foreground">
                        {currentImages.length} / {maxImages} images
                    </span>
                </div>
            )}
        </div>
    );
};

export default EducationImageUpload;
