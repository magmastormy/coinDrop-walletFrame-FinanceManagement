/**
 * Compatibility shim: re-exports a useAuth hook backed by Clerk so that
 * existing components importing from this file keep working unchanged.
 */
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/react';
import { useSelector } from 'react-redux';

export const useAuth = () => {
    const { isLoaded, isSignedIn } = useClerkAuth();
    const { signOut } = useClerk();
    // Pull the Redux-mirrored user (kept in sync by useClerkAuthSync)
    const { user } = useSelector((state) => state.auth);

    return {
        user,
        isAuthenticated: isSignedIn ?? false,
        loading: !isLoaded,
        logout: () => signOut(),
    };
};

export default useAuth;
