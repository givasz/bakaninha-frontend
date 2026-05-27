import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('baka_token');
    const username = localStorage.getItem('baka_user');
    if (token && username) setUser({ username });
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('baka_token', data.access_token);
    localStorage.setItem('baka_user', data.username);
    setUser({ username: data.username });
  };

  const logout = () => {
    localStorage.removeItem('baka_token');
    localStorage.removeItem('baka_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
