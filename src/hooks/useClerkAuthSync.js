/**
 * Syncs Clerk's authenticated user into the Redux auth slice so that all
 * existing components using `useSelector(state => state.auth)` continue to
 * work without modification.
 *
 * Clerk is the source of truth. Redux is kept as a read-only mirror.
 *
 * This hook also wires Clerk's getToken() into the axios instance so every
 * API call carries a real Clerk session JWT — not a fake placeholder token
 * that the backend would reject with 401.
 */
import { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/react';
import { useDispatch } from 'react-redux';
import { setUser, logout } from '../slices/authSlice';
import { setClerkTokenGetter } from '../api/userAxios';

const useClerkAuthSync = () => {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const { user } = useUser();
    const dispatch = useDispatch();

    // Wire Clerk's getToken into the axios instance so every API call
    // carries a real Clerk session JWT instead of a stale/fake token.
    useEffect(() => {
        setClerkTokenGetter(async () => {
            if (!isSignedIn) return null;
            return await getToken();
        });
    }, [isSignedIn, getToken]);

    useEffect(() => {
        if (!isLoaded) return;

        if (isSignedIn && user) {
            // Use setUser (not loginSuccess) so we don't write a fake token
            // to sessionStorage. The axios interceptor gets the real Clerk
            // token via getToken() above.
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
        }
    }, [isLoaded, isSignedIn, user, dispatch]);
};

export default useClerkAuthSync;
