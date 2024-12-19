import React from 'react';
import { useDispatch } from 'react-redux';
import settingsService from '../../services/settingsService';
import { setLoading, setError } from '../../slices/settingSlice';

const SystemThemes = ({ currentTheme }) => {
    const dispatch = useDispatch();

    const handleThemeChange = async (selectedTheme) => {
        dispatch(setLoading(true));
        try {
            await settingsService.updateSecuritySettings({ theme: selectedTheme });
            alert('Theme updated successfully!');
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <div className="system-themes-section">
            <h2>System Theme</h2>
            <div className="theme-options">
                <label>
                    <input
                        type="radio"
                        value="Light"
                        checked={currentTheme === 'Light'}
                        onChange={() => handleThemeChange('Light')}
                    />
                    Light
                </label>
                <label>
                    <input
                        type="radio"
                        value="Dark"
                        checked={currentTheme === 'Dark'}
                        onChange={() => handleThemeChange('Dark')}
                    />
                    Dark
                </label>
                <label>
                    <input
                        type="radio"
                        value="System Default"
                        checked={currentTheme === 'System Default'}
                        onChange={() => handleThemeChange('System Default')}
                    />
                    System Default
                </label>
            </div>
        </div>
    );
};

export default SystemThemes;