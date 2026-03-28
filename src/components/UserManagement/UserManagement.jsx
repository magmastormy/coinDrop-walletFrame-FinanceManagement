import React, { useState } from 'react';
import { Settings, User, Shield, Bell } from 'lucide-react';
import Button from '../ui/Button';
import UserProfileDetails from '../Profile/userProfileDetails';
import PageHeader from '../Common/PageHeader';

const ReadOnlySwitch = ({ checked, label }) => {
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={checked}
            disabled
            className="relative inline-flex h-6 w-11 items-center rounded-full"
            style={{
                background: checked ? 'rgba(212, 175, 55, 0.25)' : 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                cursor: 'not-allowed',
                opacity: 0.9,
            }}
        >
            <span
                className="inline-block h-5 w-5 rounded-full transition-transform"
                style={{
                    transform: checked ? 'translateX(22px)' : 'translateX(2px)',
                    background: checked ? 'var(--color-gold)' : 'var(--color-surface-1)',
                    border: '1px solid var(--color-border)',
                }}
            />
        </button>
    );
};

ReadOnlySwitch.displayName = 'ReadOnlySwitch';

const UserManagement = () => {
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        {
            id: 'profile',
            label: 'Profile',
            icon: <User className="w-[18px] h-[18px]" strokeWidth={1.5} aria-hidden="true" />
        },
        {
            id: 'security',
            label: 'Security',
            icon: <Shield className="w-[18px] h-[18px]" strokeWidth={1.5} aria-hidden="true" />
        },
        {
            id: 'notifications',
            label: 'Notifications',
            icon: <Bell className="w-[18px] h-[18px]" strokeWidth={1.5} aria-hidden="true" />
        },
        {
            id: 'preferences',
            label: 'Preferences',
            icon: <Settings className="w-[18px] h-[18px]" strokeWidth={1.5} aria-hidden="true" />
        }
    ];

    return (
        <div className="space-y-4 pb-4" style={{ maxWidth: '900px' }}>
            <PageHeader title="User Management" />
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border" style={{ paddingBottom: '6px' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="px-3 py-1.5 font-medium transition-colors flex items-center gap-2 rounded-lg"
                        style={{
                            border: '1px solid var(--color-border)',
                            background: activeTab === tab.id ? 'var(--color-surface-2)' : 'transparent',
                            color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-4">
                {activeTab === 'profile' && (
                    <div
                        style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-surface-1)',
                            padding: 'var(--card-pad-md, 16px)',
                        }}
                    >
                        <UserProfileDetails />
                    </div>
                )}

                {activeTab === 'security' && (
                    <div
                        style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-surface-1)',
                            padding: 'var(--card-pad-md, 16px)',
                        }}
                    >
                        <h3 className="text-lg font-bold mb-4">Security Settings</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background border-border">
                                <div>
                                    <h4 className="font-medium">Change Password</h4>
                                    <p className="text-sm text-muted-foreground">Update your account password</p>
                                </div>
                                <Button size="sm">Change</Button>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background border-border">
                                <div>
                                    <h4 className="font-medium">Two-Factor Authentication</h4>
                                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                                </div>
                                <Button size="sm">Enable</Button>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background border-border">
                                <div>
                                    <h4 className="font-medium">Login Activity</h4>
                                    <p className="text-sm text-muted-foreground">View recent login attempts</p>
                                </div>
                                <Button size="sm" variant="ghost">View</Button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div
                        style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-surface-1)',
                            padding: 'var(--card-pad-md, 16px)',
                        }}
                    >
                        <h3 className="text-lg font-bold mb-4">Notification Settings</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background border-border">
                                <div>
                                    <h4 className="font-medium">Email Notifications</h4>
                                    <p className="text-sm text-muted-foreground">Receive email updates</p>
                                </div>
                                <ReadOnlySwitch checked={true} label="Email" />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background border-border">
                                <div>
                                    <h4 className="font-medium">Push Notifications</h4>
                                    <p className="text-sm text-muted-foreground">Get instant alerts</p>
                                </div>
                                <ReadOnlySwitch checked={false} label="Push" />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background border-border">
                                <div>
                                    <h4 className="font-medium">Budget Alerts</h4>
                                    <p className="text-sm text-muted-foreground">Notify when near limits</p>
                                </div>
                                <ReadOnlySwitch checked={true} label="Budget" />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'preferences' && (
                    <div
                        style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-surface-1)',
                            padding: 'var(--card-pad-md, 16px)',
                        }}
                    >
                        <h3 className="text-lg font-bold mb-4">Preferences</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background border-border">
                                <div>
                                    <h4 className="font-medium">Language</h4>
                                    <p className="text-sm text-muted-foreground">Select your preferred language</p>
                                </div>
                                <select
                                    style={{
                                        height: '32px',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-surface-2)',
                                        padding: '0 8px',
                                        fontSize: '13px',
                                        color: 'var(--color-text-primary)',
                                        outline: 'none',
                                        fontFamily: 'var(--font-body)',
                                    }}
                                >
                                    <option value="en">English</option>
                                    <option value="es">Spanish</option>
                                    <option value="fr">French</option>
                                    <option value="de">German</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background border-border">
                                <div>
                                    <h4 className="font-medium">Timezone</h4>
                                    <p className="text-sm text-muted-foreground">Select your timezone</p>
                                </div>
                                <select
                                    style={{
                                        height: '32px',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-surface-2)',
                                        padding: '0 8px',
                                        fontSize: '13px',
                                        color: 'var(--color-text-primary)',
                                        outline: 'none',
                                        fontFamily: 'var(--font-body)',
                                    }}
                                >
                                    <option value="America/New_York">Eastern Time (US)</option>
                                    <option value="America/Los_Angeles">Pacific Time (US)</option>
                                    <option value="Europe/London">London</option>
                                    <option value="Asia/Shanghai">Shanghai</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background border-border">
                                <div>
                                    <h4 className="font-medium">Currency</h4>
                                    <p className="text-sm text-muted-foreground">Select your preferred currency</p>
                                </div>
                                <select
                                    style={{
                                        height: '32px',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        background: 'var(--color-surface-2)',
                                        padding: '0 8px',
                                        fontSize: '13px',
                                        color: 'var(--color-text-primary)',
                                        outline: 'none',
                                        fontFamily: 'var(--font-body)',
                                    }}
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                    <option value="JPY">JPY</option>
                                    <option value="America/Los_Angeles">Pacific Time (US)</option>
                                    <option value="Europe/London">London</option>
                                    <option value="Asia/Shanghai">Shanghai</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;