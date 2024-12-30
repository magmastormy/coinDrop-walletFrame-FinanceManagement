import React, { useState } from 'react';
import './styles/createEditEducationPostStyles.css';

const CreateEditEducationPost = ({ onCreatePost }) => {
    const [title, setTitle] = useState('');
    const [details, setDetails] = useState('');
    const [images, setImages] = useState([]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const newPost = {
            title,
            details,
            images,
            date: new Date().toISOString(),
            author: 'Current User' //TODO: Replace with actual user data
        };
        onCreatePost(newPost);
        setTitle('');
        setDetails('');
        setImages([]);
    };

    return (
        <form className="create-edit-education-post" onSubmit={handleSubmit}>
            <div className="image-bar">
                {/*TODO: Image upload logic here */}
            </div>
            <div className="text-editor">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                />
                <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Details"
                />
            </div>
            <button type="submit">Post</button>
        </form>
    );
};

export default CreateEditEducationPost;