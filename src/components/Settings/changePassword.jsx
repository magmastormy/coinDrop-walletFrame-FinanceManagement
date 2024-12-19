import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import settingsService from '../../services/settingsService';
import { setLoading, setError } from '../../slices/settingsSlice';

const ChangePassword = () => {
    const dispatch = useDispatch();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        dispatch(setLoading(true));
        try {
            await settingsService.updateSecuritySettings({ currentPassword, newPassword });
            setSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.message);
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <div className="change-password-section">
            <h2>Change Password</h2>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button onClick={handleChangePassword}>Change Password</button>
        </div>
    );
};

export default ChangePassword;