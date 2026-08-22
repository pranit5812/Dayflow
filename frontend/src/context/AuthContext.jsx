import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { employeeApi } from '../api/employeeApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('dayflow_access_token') || null);
  const [role, setRole] = useState(localStorage.getItem('dayflow_role') || null);
  const [employeeId, setEmployeeId] = useState(localStorage.getItem('dayflow_employee_id') || null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('dayflow_theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dayflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const profile = await employeeApi.getMyProfile();
          setUserProfile(profile);
        } catch (err) {
          console.error("Auth init profile fetch error:", err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('dayflow_access_token', data.access_token);
    localStorage.setItem('dayflow_role', data.role);
    localStorage.setItem('dayflow_employee_id', data.employee_id);
    
    setToken(data.access_token);
    setRole(data.role);
    setEmployeeId(data.employee_id);
    
    const profile = await employeeApi.getMyProfile();
    setUserProfile(profile);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('dayflow_access_token');
    localStorage.removeItem('dayflow_role');
    localStorage.removeItem('dayflow_employee_id');
    setToken(null);
    setRole(null);
    setEmployeeId(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      token,
      role,
      employeeId,
      userProfile,
      setUserProfile,
      loading,
      login,
      logout,
      theme,
      toggleTheme
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
