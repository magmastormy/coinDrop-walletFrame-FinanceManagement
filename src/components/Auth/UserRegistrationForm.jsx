import { SignUp } from '@clerk/react';

const UserRegistration = () => {
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
            {/* Background watermark */}
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
                <SignUp
                    routing="path"
                    path="/register"
                    signInUrl="/login"
                    fallbackRedirectUrl="/dashboard"
                />
            </div>
        </div>
    );
};

export default UserRegistration;
