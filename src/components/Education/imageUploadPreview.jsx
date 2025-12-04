import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const ImageUploadPreview = ({ images, onRemove }) => {
    return (
        <div className="flex flex-wrap gap-3">
            <AnimatePresence>
                {images.map((image, index) => (
                    <motion.div
                        key={image._id || index}
                        className="relative group"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        layout
                    >
                        <img
                            src={image.url || URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border border-white/10"
                        />
                        <button
                            className={cn(
                                "absolute -top-2 -right-2 p-1.5 rounded-full",
                                "bg-red-500/90 hover:bg-red-500 transition-colors",
                                "opacity-0 group-hover:opacity-100"
                            )}
                            onClick={() => onRemove(image._id || index)}
                            aria-label="Remove image"
                        >
                            <X className="w-3 h-3 text-white" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ImageUploadPreview;