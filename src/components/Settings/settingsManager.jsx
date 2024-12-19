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

    useEffect(() => {
        const fetchSettings = async () => {
            dispatch(setLoading(true));
            try {
                const userSettings = await settingsService.getUserSettings();
                dispatch(setSettings(userSettings));
            } catch (err) {
                dispatch(setError(err.message));
            } finally {
                dispatch(setLoading(false));
            }
        };

        fetchSettings();
    }, [dispatch]);

    return (
        <div className="settings-container">
            <h1>Settings</h1>
            {loading && <p>Loading settings...</p>}
            {error && <p className="error-message">{error}</p>}
            <Notifications settings={settings.notifications} />
            <ChangePassword />
            <SystemThemes currentTheme={settings.theme} />
            <PersonalInformation userInfo={settings.personalInfo} />
            <DeleteAccount />
        </div>
    );
};

export default Settings;