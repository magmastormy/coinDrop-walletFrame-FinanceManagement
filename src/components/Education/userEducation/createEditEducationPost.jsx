import React, { useState } from 'react';
import './styles/createEditEducationPostStyles.css';

const CreateEditEducationPost = ({ onCreateEducation, initialData }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [details, setDetails] = useState(initialData?.details || '');
    const [images, setImages] = useState(initialData?.images || []);

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreateEducation({
            title,
            details,
            images,
            date: new Date().toISOString()
        });
    };

    return (
        <div className="post-form-container">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input
                        id="title"
                        type="text"
                        className="form-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter post title"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="details">Details</label>
                    <textarea
                        id="details"
                        className="form-textarea"
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Enter post details"
                        required
                    />
                </div>
                <div className="form-actions">
                    <button type="submit" className="submit-btn">
                        {initialData ? 'Update' : 'Create'} Post
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateEditEducationPost;