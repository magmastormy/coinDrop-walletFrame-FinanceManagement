import { SignUp, useClerk, ClerkLoaded, ClerkLoading } from '@clerk/react';
import { useEffect, useState } from 'react';

const UserRegistration = () => {
    const clerk = useClerk();
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('=== Clerk Registration Debug ===');
        console.log('Publishable Key:', import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? 'SET (hidden)' : 'NOT SET');
        console.log('Clerk loaded:', clerk.loaded);
        console.log('Current user:', clerk.user);
        console.log('Session:', clerk.session);
        console.log('Auth state:', {
            isSignedIn: clerk.isSignedIn(),
            isLoaded: clerk.loaded
        });
    }, [clerk]);

    const handleSignUpStart = () => {
        console.log('SignUp started');
        setError(null);
    };

    const handleSignUpComplete = (user) => {
        console.log('SignUp completed successfully:', user);
        setError(null);
    };

    const handleSignUpError = (err) => {
        console.error('SignUp failed:', err);
        setError(err?.message || 'Registration failed. Please try again.');
    };

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                background: 'var(--color-bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '15vw',
                    color: 'var(--color-text-primary)',
                    opacity: 0.04,
                    zIndex: 0,
                    pointerEvents: 'none',
                    lineHeight: 1
                }}
            >
                COINDROP
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                <ClerkLoading>
                    <div style={{ color: '#fff', padding: '20px' }}>Loading...</div>
                </ClerkLoading>
                <ClerkLoaded>
                    {error && (
                        <div style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            textAlign: 'center',
                            fontWeight: 500
                        }}>
                            {error}
                        </div>
                    )}
                    <SignUp
                        routing="path"
                        path="/register"
                        signInUrl="/login"
                        redirectUrl="/dashboard"
                        fallbackRedirectUrl="/dashboard"
                        onSignUpStart={handleSignUpStart}
                        onSignUpComplete={handleSignUpComplete}
                        onError={handleSignUpError}
                    />
                </ClerkLoaded>
            </div>
        </div>
    );
};

export default UserRegistration;
