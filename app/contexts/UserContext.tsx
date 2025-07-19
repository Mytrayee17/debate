'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserContextType {
  points: number;
  addPoints: (amount: number) => void;
  completedModules: string[];
  markModuleAsCompleted: (moduleId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [points, setPoints] = useState<number>(0);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user data from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPoints = localStorage.getItem('userPoints');
        const savedModules = localStorage.getItem('completedModules');
        
        if (savedPoints) setPoints(Number(savedPoints));
        if (savedModules) setCompletedModules(JSON.parse(savedModules));
      } catch (error) {
        console.error('Error loading user data:', error);
        // Reset to defaults if there's an error
        setPoints(0);
        setCompletedModules([]);
      }
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage whenever points or completedModules change
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem('userPoints', points.toString());
        localStorage.setItem('completedModules', JSON.stringify(completedModules));
      } catch (error) {
        console.error('Error saving user data:', error);
      }
    }
  }, [points, completedModules, isInitialized]);

  const addPoints = (amount: number) => {
    if (amount <= 0) return;
    setPoints(prev => {
      const newTotal = prev + amount;
      return newTotal;
    });
  };

  const markModuleAsCompleted = (moduleId: string) => {
    if (!completedModules.includes(moduleId)) {
      setCompletedModules(prev => [...prev, moduleId]);
    }
  };

  return (
    <UserContext.Provider 
      value={{ 
        points, 
        addPoints, 
        completedModules, 
        markModuleAsCompleted 
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
