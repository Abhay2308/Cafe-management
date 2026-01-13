
import { Employee, AttendanceRecord } from './types';

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: 'James Wilson', role: 'Barista', salary: 3200, status: 'Active', joinDate: '2023-01-15' },
  { id: '2', name: 'Sarah Parker', role: 'Manager', salary: 4500, status: 'Active', joinDate: '2022-06-10' },
  { id: '3', name: 'Michael Chen', role: 'Chef', salary: 3800, status: 'Active', joinDate: '2023-03-20' },
  { id: '4', name: 'Emily Davis', role: 'Waiter', salary: 2800, status: 'Active', joinDate: '2023-11-05' },
  { id: '5', name: 'Robert Brown', role: 'Cleaner', salary: 2500, status: 'Active', joinDate: '2024-02-12' },
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', employeeId: '1', date: '2024-05-01', status: 'Present' },
  { id: 'a2', employeeId: '2', date: '2024-05-01', status: 'Present' },
  { id: 'a3', employeeId: '3', date: '2024-05-01', status: 'Absent' },
  { id: 'a4', employeeId: '4', date: '2024-05-01', status: 'Half-Day' },
  { id: 'a5', employeeId: '5', date: '2024-05-01', status: 'Present' },
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
