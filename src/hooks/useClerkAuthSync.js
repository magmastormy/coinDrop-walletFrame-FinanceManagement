/**
 * Syncs Clerk's authenticated user into the Redux auth slice so that all
 * existing components using `useSelector(state => state.auth)` continue to
 * work without modification.
 *
 * Clerk is the source of truth. Redux is kept as a read-only mirror.
 *
 * This hook also wires Clerk's getToken() into the axios instance so every
 * API call carries a real Clerk session JWT.
 *
 * Additionally, it syncs the Clerk user to the backend MongoDB database
 * on first sign-in so the user exists in our local database.
 */
import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/react';
import { useDispatch } from 'react-redux';
import { setUser, logout } from '../slices/authSlice';
import { setClerkTokenGetter } from '../api/userAxios';
import axiosInstance from '../api/userAxios';

const useClerkAuthSync = () => {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const { user } = useUser();
    const dispatch = useDispatch();
    const [synced, setSynced] = useState(false);

    useEffect(() => {
        setClerkTokenGetter(async () => {
            if (!isSignedIn) return null;
            return await getToken();
        });
    }, [isSignedIn, getToken]);

    useEffect(() => {
        if (!isLoaded || !isSignedIn || !user || synced) return;

        const syncUser = async () => {
            try {
                await axiosInstance.post('/clerk/sync-user');
                setSynced(true);
            } catch (error) {
                console.error('Failed to sync Clerk user:', error);
            }
        };

        syncUser();
    }, [isLoaded, isSignedIn, user, synced]);

    useEffect(() => {
        if (!isLoaded) return;

        if (isSignedIn && user) {
            dispatch(setUser({
                id: user.id,
                firstName: user.firstName ?? '',
                lastName: user.lastName ?? '',
                name: user.fullName ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
                email: user.primaryEmailAddress?.emailAddress ?? '',
                username: user.username ?? user.primaryEmailAddress?.emailAddress ?? '',
                role: user.publicMetadata?.role ?? 'user',
                avatar: user.imageUrl ?? null,
            }));
        } else if (isLoaded && !isSignedIn) {
            dispatch(logout());
            setSynced(false);
        }
    }, [isLoaded, isSignedIn, user, dispatch]);
};

export default useClerkAuthSync;
