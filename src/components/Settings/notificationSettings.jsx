import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import settingsService from '../../services/settingsService';
import { setLoading, setError } from '../../slices/settingSlice';

const NotificationSettings = ({ settings }) => {
    const dispatch = useDispatch();
    const [upcomingBillReminders, setUpcomingBillReminders] = useState(settings.upcomingBillReminders);
    const [lowBalanceAlerts, setLowBalanceAlerts] = useState(settings.lowBalanceAlerts);
    const [lowBalanceThreshold, setLowBalanceThreshold] = useState(settings.lowBalanceThreshold);
    const [reminderFrequency, setReminderFrequency] = useState(settings.reminderFrequency);

    useEffect(() => {
        setUpcomingBillReminders(settings.upcomingBillReminders);
        setLowBalanceAlerts(settings.lowBalanceAlerts);
        setLowBalanceThreshold(settings.lowBalanceThreshold);
        setReminderFrequency(settings.reminderFrequency);
    }, [settings]);

    const handleSaveChanges = async () => {
        dispatch(setLoading(true));
        try {
            await settingsService.updateNotificationSettings({
                upcomingBillReminders,
                lowBalanceAlerts,
                lowBalanceThreshold,
                reminderFrequency
            });
            alert('Notification settings updated successfully!');
        } catch (err) {
            dispatch(setError(err.message));
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <div className="notifications-section">
            <h2>Notifications</h2>
            <div className="notification-setting">
                <label>
                    <input
                        type="checkbox"
                        checked={upcomingBillReminders}
                        onChange={() => setUpcomingBillReminders(!upcomingBillReminders)}
                    />
                    Upcoming Bill Reminders
                </label>
                {upcomingBillReminders && (
                    <select value={reminderFrequency} onChange={(e) => setReminderFrequency(e.target.value)}>
                        <option value="1 day before">1 day before</option>
                        <option value="3 days before">3 days before</option>
                        <option value="1 week before">1 week before</option>
                    </select>
                )}
            </div>
            <div className="notification-setting">
                <label>
                    <input
                        type="checkbox"
                        checked={lowBalanceAlerts}
                        onChange={() => setLowBalanceAlerts(!lowBalanceAlerts)}
                    />
                    Low Balance Alerts
                </label>
                {lowBalanceAlerts && (
                    <input
                        type="number"
                        value={lowBalanceThreshold}
                        onChange={(e) => setLowBalanceThreshold(e.target.value)}
                        placeholder="Set threshold"
                    />
                )}
            </div>
            <button onClick={handleSaveChanges}>Save Changes</button>
        </div>
    );
};

export default NotificationSettings;