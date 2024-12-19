import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import settingsService from '../../services/settingsService';
import { setLoading, setError } from '../../slices/settingsSlice';

const PersonalInformation = ({ userInfo }) => {
    const dispatch = useDispatch();
    const [name, setName] = useState(userInfo.name);
    const [email, setEmail] = useState(userInfo.email);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        setName(userInfo.name);
        setEmail(userInfo.email);
    }, [userInfo]);

    const handleSaveChanges = async () => {
        dispatch(setLoading(true));
        try {
            await settingsService.updatePersonalInformation({ name, email });
            setSuccess('Personal information updated successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <div className="personal-information-section">
            <h2>Personal Information</h2>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={handleSaveChanges}>Save Changes</button>
        </div>
    );
};

export default PersonalInformation;