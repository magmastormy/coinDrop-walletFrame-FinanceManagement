import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import settingsService from '../../services/settingsService';
import { setSettings, setLoading, setError } from '../../slices/settingSlice';
import Notifications from './notificationSettings';
import ChangePassword from './changePasswordSettings';
import SystemThemes from './systemThemesSettings';
import PersonalInformation from './personalSettings';
import DeleteAccount from './deleteAccountSettings';
import './styles/settingsStyles.css';

const Settings = () => {
    const dispatch = useDispatch();
    const { settings, loading, error } = useSelector(state => state.settings);
    const {user} = useSelector(state => state.auth);

    useEffect(() => {
        const fetchSettings = async () => {
            dispatch(setLoading(true));
            try {
                const userSettings = await settingsService.getUserSettings(user.id);
                dispatch(setSettings(userSettings));
            } catch (err) {
                dispatch(setError(err.message));
            } finally {
                dispatch(setLoading(false));
            }
        };

        fetchSettings();
    }, [dispatch]);

    if (loading) return <p>Loading settings...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!settings) return null;

    return (
        <div className="settings-container">
            <h1>Settings</h1>
            <PersonalInformation />
            <Notifications settings={settings.notifications} />
            <ChangePassword />
            <SystemThemes currentTheme={settings.preferences.theme} />
            <DeleteAccount />
        </div>
    );
};

export default Settings;
