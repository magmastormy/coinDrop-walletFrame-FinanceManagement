import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import settingsService from '../../services/settingsService';
import { setLoading, setError } from '../../slices/settingsSlice';

const DeleteAccount = () => {
    const dispatch = useDispatch();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleDeleteAccount = async () => {
        dispatch(setLoading(true));
        try {
            await settingsService.deleteAccount();
            alert('Account deleted successfully!');
            // Optionally, redirect the user or log them out
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <div className="delete-account-section">
            <h2>Delete Account</h2>
            <p>This action cannot be undone. All your data will be lost.</p>
            {confirmDelete ? (
                <div>
                    <p>Are you sure you want to delete your account?</p>
                    <button onClick={handleDeleteAccount}>Yes, Delete My Account</button>
                    <button onClick={() => setConfirmDelete(false)}>Cancel</button>
                </div>
            ) : (
                <button onClick={() => setConfirmDelete(true)}>Delete Account</button>
            )}
        </div>
    );
};

export default DeleteAccount;