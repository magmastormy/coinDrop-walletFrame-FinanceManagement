/**
 * Syncs Clerk's authenticated user into the Redux auth slice so that all
 * existing components using `useSelector(state => state.auth)` continue to
 * work without modification.
 *
 * Clerk is the source of truth. Redux is kept as a read-only mirror.
 */
import { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/react';
import { useDispatch } from 'react-redux';
import { loginSuccess, logout } from '../slices/authSlice';

const useClerkAuthSync = () => {
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const dispatch = useDispatch();

    useEffect(() => {
        if (!isLoaded) return;

        if (isSignedIn && user) {
            // Map Clerk user fields to the shape the rest of the app expects
            dispatch(loginSuccess({
                user: {
                    id: user.id,
                    // Clerk stores first/last name at top level
                    firstName: user.firstName ?? '',
                    lastName: user.lastName ?? '',
                    name: user.fullName ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
                    email: user.primaryEmailAddress?.emailAddress ?? '',
                    username: user.username ?? user.primaryEmailAddress?.emailAddress ?? '',
                    // Admin role comes from Clerk publicMetadata: { role: 'admin' }
                    role: user.publicMetadata?.role ?? 'user',
                    // Profile image from Clerk
                    avatar: user.imageUrl ?? null,
                },
                // Clerk manages its own tokens — we pass a placeholder so
                // isAuthenticated stays true in the slice
                accessToken: 'clerk-managed',
            }));
        } else if (isLoaded && !isSignedIn) {
            dispatch(logout());
        }
    }, [isLoaded, isSignedIn, user, dispatch]);
};

export default useClerkAuthSync;
