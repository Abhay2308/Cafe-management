
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Salary from './pages/Salary';
import Reports from './pages/Reports';
import Login from './pages/Login';
import { Employee, AttendanceRecord } from './types';
import { INITIAL_EMPLOYEES, INITIAL_ATTENDANCE } from './data';

const App: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('v_v_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('v_v_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  // Track authentication state using session storage for tab-level security
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('v_v_auth') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('v_v_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('v_v_attendance', JSON.stringify(attendance));
  }, [attendance]);

  const handleLogin = () => {
    sessionStorage.setItem('v_v_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // 1. Clear session storage immediately
    sessionStorage.removeItem('v_v_auth');
    // 2. Clear state which forces App to return the Login component only
    setIsAuthenticated(false);
    // 3. Force hash back to home to clear route history visibility
    window.location.hash = '#/';
  };

  /**
   * SECURITY GATE:
   * If not authenticated, we return ONLY the Login component.
   * This ensures that the HashRouter and all its routes are physically
   * unmounted from the DOM, making "back" button navigation to them impossible.
   */
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard employees={employees} attendance={attendance} />} />
          <Route path="/employees" element={<Employees employees={employees} setEmployees={setEmployees} attendance={attendance} />} />
          <Route path="/attendance" element={<Attendance employees={employees} attendance={attendance} setAttendance={setAttendance} />} />
          <Route path="/leaves" element={<Leaves employees={employees} attendance={attendance} />} />
          <Route path="/salary" element={<Salary employees={employees} attendance={attendance} />} />
          <Route path="/reports" element={<Reports employees={employees} attendance={attendance} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
