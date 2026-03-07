import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout as logoutAction } from '../slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, token } = useSelector((state) => state.auth);

  return useMemo(
    () => ({
      user,
      isAuthenticated,
      loading,
      token,
      logout: () => dispatch(logoutAction())
    }),
    [dispatch, isAuthenticated, loading, token, user]
  );
};

export default useAuth;
