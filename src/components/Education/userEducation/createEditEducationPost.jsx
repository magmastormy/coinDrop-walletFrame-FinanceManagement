import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bold, Italic, Code, List,
    Image as ImageIcon, Heading2, Quote,
    Undo, Redo, X
} from 'lucide-react';
import { useTheme } from '../../../theme/ThemeContext';
import { Button } from '../../ui/Button';

import ImageService from '../../../services/imageService';
import { toast } from 'react-toastify';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const MenuBar = ({ editor, theme, setImageFiles, setUploadedImages }) => {
    const fileInputRef = useRef(null);
    if (!editor) return null;

    const handleImageClick = (e) => {
        e.preventDefault();
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        event.preventDefault();
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            if (file.size > MAX_FILE_SIZE) {
                toast.error('File size exceeds 5MB limit');
                return;
            }

            // Create preview URL only - don't upload yet
            const previewUrl = URL.createObjectURL(file);

            // Add to the image files collection for later upload
            setImageFiles(prev => [...prev, file]);

            // Generate a temporary ID for this image
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

            // Add to preview state with the file for later upload
            setUploadedImages(prev => [...prev, {
                tempId: tempId,
                preview: previewUrl,
                file: file,
                isUploaded: false,
                pendingUpload: true
            }]);

            // Insert image directly into the editor with the preview URL
            editor.chain()
                .focus()
                .setImage({
                    src: previewUrl,
                    alt: file.name.split('.')[0],
                    'data-temp-id': tempId // Add a data attribute to find this image later
                })
                .run();

            toast.info('Image added to post. Save to upload.', {
                autoClose: 2000
            });

        } catch (error) {
            console.error('Error preparing image:', error);
            toast.error(`Error: ${error.message || 'Failed to prepare image'}`);
        }

        // Reset the input
        event.target.value = '';
    };

    const EditorButton = ({ onClick, isActive, icon: Icon, label }) => (
        <button
            type="button"
            onClick={onClick}
            className={`p-2 rounded-md transition-colors hover:bg-muted ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                }`}
            title={label}
        >
            <Icon className="w-4 h-4" />
        </button>
    );

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/30">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
            />
            <EditorButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                icon={Bold}
                label="Bold"
            />
            <EditorButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                icon={Italic}
                label="Italic"
            />
            <EditorButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading')}
                icon={Heading2}
                label="Heading"
            />
            <EditorButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                icon={List}
                label="Bullet List"
            />
            <EditorButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                icon={Quote}
                label="Quote"
            />
            <EditorButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                isActive={editor.isActive('codeBlock')}
                icon={Code}
                label="Code Block"
            />
            <div className="w-px h-6 bg-border mx-1" />
            <EditorButton
                onClick={() => editor.chain().focus().undo().run()}
                isActive={false}
                icon={Undo}
                label="Undo"
            />
            <EditorButton
                onClick={() => editor.chain().focus().redo().run()}
                isActive={false}
                icon={Redo}
                label="Redo"
            />
            <div className="w-px h-6 bg-border mx-1" />
            <EditorButton
                onClick={handleImageClick}
                isActive={false}
                icon={ImageIcon}
                label="Insert Image"
            />
        </div>
    );
};

const CreateEditEducationPost = ({ onSubmit, onClose, initialData = null }) => {
    const post = initialData;
    const { theme } = useTheme();
    const [title, setTitle] = useState('');
    const [imageFiles, setImageFiles] = useState([]);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const isEditMode = !!post;
    const [isUploading, setIsUploading] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                inline: false,
                allowBase64: true,
                HTMLAttributes: {
                    class: 'image-resizable',
                },
            }),
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'education-editor-content',
            },
        }
    });

    useEffect(() => {
        if (post && editor) {
            console.log("Loading post for editing:", post);
            setTitle(post.title || '');

            // Process content to replace placeholder images with actual image URLs
            let contentToSet = post.details || '';

            // Check if we have actual images to use
            if (post.images && post.images.length > 0) {
                console.log("Post has images:", post.images);

                // Create an array to track loaded images
                const loadedImages = [];

                // For each image in the post, create a reference
                post.images.forEach((img, index) => {
                    if (img && (img.url || typeof img === 'string')) {
                        const imageUrl = img.url || img;
                        console.log(`Processing image ${index + 1}:`, imageUrl);

                        // Replace [IMAGE] placeholders with actual URLs
                        contentToSet = contentToSet.replace('[IMAGE]', imageUrl);

                        // Create a reference to the existing image
                        loadedImages.push({
                            preview: imageUrl,
                            isExisting: true,
                            url: imageUrl
                        });
                    }
                });

                console.log("Loaded images:", loadedImages);
                console.log("Updated content:", contentToSet);

                // Set the uploaded images state
                setUploadedImages(loadedImages);
            }

            // Set the editor content with processed content
            editor.commands.setContent(contentToSet);

            // For debugging, check what was actually set
            console.log("Editor content after setting:", editor.getHTML());
        }
    }, [post, editor]);

    const handleImageUpload = async (file) => {
        try {
            if (file.size > MAX_FILE_SIZE) {
                toast.error('File size exceeds 5MB limit');
                return null;
            }

            // Show loading state
            setIsUploading(true);

            const response = await ImageService.uploadImage(file, 'education');
            console.log("[CreateEditEducation] Image uploaded response:", response);

            // Check for valid response data
            if (!response || !response.url) {
                throw new Error('[CreateEditEducation] Invalid image upload response');
            }

            // Update the UI state
            setImageFiles(prev => [...prev, file]);

            setUploadedImages(prev => [...prev, {
                preview: URL.createObjectURL(file),
                url: response.url,
                _id: response._id || response.publicId,
                file
            }]);

            // Return the image URL for content embedding
            return response.url;
        } catch (error) {
            console.error('[CreateEditEducation] Error uploading image:', error);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isSubmitting) return;
            setIsSubmitting(true);
            setError('');

            // Validate required fields
            if (!title.trim()) {
                setError('Title is required');
                setIsSubmitting(false);
                return;
            }

            // First, upload any pending images
            let processedContent = editor.getHTML();
            const pendingImagesToUpload = uploadedImages.filter(img => img.file && !img.isUploaded && img.pendingUpload);
            console.log('[CreateEditEducation] Pending images to upload:', pendingImagesToUpload.length);

            // Upload all pending images first
            if (pendingImagesToUpload.length > 0) {
                toast.info(`Uploading ${pendingImagesToUpload.length} image(s)...`);

                // Upload each image and get the URLs
                const uploadResults = [];
                for (const img of pendingImagesToUpload) {
                    try {
                        const uploadedImage = await ImageService.uploadImage(img.file, 'education');
                        if (uploadedImage && uploadedImage.url) {
                            // Replace the blob URL in the content with the actual uploaded URL
                            processedContent = processedContent.replace(img.preview, uploadedImage.url);
                            uploadResults.push({
                                ...uploadedImage,
                                tempId: img.tempId,
                                originalPreview: img.preview
                            });
                        }
                    } catch (uploadError) {
                        console.error('Error uploading image:', uploadError);
                        toast.error(`Failed to upload image: ${uploadError.message || 'Unknown error'}`);
                    }
                }

                console.log('[CreateEditEducation] Uploaded images:', uploadResults);
            }

            // Create the post data with the processed content that has real image URLs
            const postData = {
                title: title,
                details: processedContent,
                // No need to include pendingImages as they've been uploaded and URLs replaced in the content
                existingImageIds: uploadedImages
                    .filter(img => img.isExisting && img._id)
                    .map(img => img._id)
            };

            if (isEditMode && post) {
                postData._id = post._id;
            }

            console.log('[CreateEditEducationPost] Submitting education post data:', postData);

            // Save the post through the provided onSubmit handler
            let response;
            try {
                if (isEditMode) {
                    console.log("***[CreateEditEducationPost] update post");
                    response = await onSubmit(post._id, postData);
                } else {
                    console.log("***[CreateEditEducationPost] create new post");
                    response = await onSubmit(postData);
                }

                console.log('[CreateEditEducationPost] Education post (onSubmit) response:', response);

                // Handle the response
                if (response) {
                    // Clean up any object URLs created for previews
                    uploadedImages.forEach(img => {
                        if (img.preview && typeof img.preview === 'string') {
                            URL.revokeObjectURL(img.preview);
                        }
                    });

                    onClose();
                } else {
                    throw new Error('[CreateEditEducation] Failed to save post');
                }
            } catch (submitError) {
                console.error('[CreateEditEducation] Error submitting education post:', submitError);
                throw submitError; // Rethrow to be caught by the outer catch
            }
        } catch (err) {
            console.error('[CreateEditEducation] Error saving education post:', err);
            setError('[CreateEditEducation] Error saving post: ' + (err.message || 'Unknown error'));
            toast.error('[CreateEditEducation] Error saving post');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        return () => {
            uploadedImages.forEach(img => {
                if (img.preview && !img.isExisting) {
                    URL.revokeObjectURL(img.preview);
                }
            });
        };
    }, [uploadedImages]);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />
                <motion.div
                    className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <h2 className="text-2xl font-semibold text-foreground">
                            {isEditMode ? 'Edit Post' : 'Create New Post'}
                        </h2>
                        <button
                            type="button"
                            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {error && (
                        <div className="mx-6 mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form Content */}
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Title Input */}
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter post title..."
                                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xl font-semibold"
                            />

                            {/* Image Previews */}
                            {uploadedImages.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-foreground">Uploaded Images:</h4>
                                    <div className="grid grid-cols-4 gap-3">
                                        {uploadedImages.map((image, index) => (
                                            <div className="relative group" key={index}>
                                                <img
                                                    src={image.preview || image.url}
                                                    alt={`Preview ${index}`}
                                                    className="w-full h-24 object-cover rounded-lg border border-border"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setUploadedImages(prev => prev.filter((_, i) => i !== index));
                                                        if (!image.isExisting) {
                                                            setImageFiles(prev => prev.filter((_, i) => i !== index));
                                                            URL.revokeObjectURL(image.preview);
                                                        }
                                                    }}
                                                    className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Editor */}
                            <div className="border border-border rounded-lg overflow-hidden">
                                <MenuBar
                                    editor={editor}
                                    theme={theme}
                                    setImageFiles={setImageFiles}
                                    setUploadedImages={setUploadedImages}
                                />
                                <EditorContent
                                    editor={editor}
                                    className="min-h-[300px] prose prose-sm max-w-none p-4 bg-background text-foreground [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[300px]"
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
                            <Button
                                type="button"
                                onClick={onClose}
                                variant="ghost"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Post')}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

MenuBar.propTypes = {
    editor: PropTypes.object,
    theme: PropTypes.object.isRequired,
    setImageFiles: PropTypes.func.isRequired,
    setUploadedImages: PropTypes.func.isRequired
};

CreateEditEducationPost.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    initialData: PropTypes.object
};

export default CreateEditEducationPost;
