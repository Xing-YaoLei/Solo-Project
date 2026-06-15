import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Semester, TimeSlot, Department } from '../types';
import { api } from '../services/api';

interface AppContextType {
  currentSemester: Semester | null;
  semesters: Semester[];
  timeSlots: TimeSlot[];
  departments: Department[];
  loading: boolean;
  refreshSemesters: () => Promise<void>;
  refreshTimeSlots: () => Promise<void>;
  setCurrentSemester: (semester: Semester) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSemester, setCurrentSemester] = useState<Semester | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSemesters = useCallback(async () => {
    try {
      const [allRes, currentRes] = await Promise.all([
        api.semesters.getList(),
        api.semesters.getCurrent().catch(() => ({ data: null })),
      ]);
      setSemesters(allRes.data);
      if (currentRes.data) {
        setCurrentSemester(currentRes.data);
      } else if (allRes.data.length > 0) {
        setCurrentSemester(allRes.data[0]);
      }
    } catch (error) {
      console.error('Failed to load semesters:', error);
    }
  }, []);

  const refreshTimeSlots = useCallback(async () => {
    try {
      const res = await api.timeSlots.getList();
      setTimeSlots(res.data);
    } catch (error) {
      console.error('Failed to load time slots:', error);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([refreshSemesters(), refreshTimeSlots()]);
      setLoading(false);
    };
    loadInitialData();
  }, [refreshSemesters, refreshTimeSlots]);

  return (
    <AppContext.Provider
      value={{
        currentSemester,
        semesters,
        timeSlots,
        departments,
        loading,
        refreshSemesters,
        refreshTimeSlots,
        setCurrentSemester,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
