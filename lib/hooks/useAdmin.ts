'use client';

import { useState, useEffect } from 'react';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin is authenticated from session storage
    const adminAuth = sessionStorage.getItem('adminAuth');
    setIsAdmin(adminAuth === 'true');
    setIsLoading(false);
  }, []);

  const checkAdminPassword = (password: string): boolean => {
    // Check against stored password first, then fallback to default
    const storedPassword = localStorage.getItem('adminPassword');
    const defaultPassword = 'swaggy';
    
    return (storedPassword && password === storedPassword) || password === defaultPassword;
  };

  const loginAsAdmin = (password: string): boolean => {
    if (checkAdminPassword(password)) {
      sessionStorage.setItem('adminAuth', 'true');
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = (): void => {
    sessionStorage.removeItem('adminAuth');
    setIsAdmin(false);
  };

  return {
    isAdmin,
    isLoading,
    loginAsAdmin,
    logoutAdmin,
    checkAdminPassword
  };
} 