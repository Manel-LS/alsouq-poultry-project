import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const useAuth = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const checkTokenValidity = useCallback(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) {
      console.log('No token found, redirecting to login.');
      setIsAuthenticated(false);
      setUser(null);
      // Clear all session data for a clean logout
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('database_choice');
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      navigate('/login', { replace: true });
      return false;
    }
    // In a real application, you would also decode the JWT here and check its expiration date.
    // For now, we'll assume the presence of a token means it's valid until an API call says otherwise.
    setIsAuthenticated(true);
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user data from sessionStorage', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    return true;
  }, [navigate]);

  useEffect(() => {
    checkTokenValidity();
  }, [checkTokenValidity]);

  const logout = useCallback(() => {
    console.log('Initiating logout...');
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('database_choice');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  return {
    isAuthenticated,
    user,
    checkTokenValidity,
    logout,
  };
};

export default useAuth;




