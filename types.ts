
export type Role = 'Barista' | 'Chef' | 'Waiter' | 'Manager' | 'Cleaner';

export type AttendanceStatus = 'Present' | 'Absent' | 'Half-Day' | 'Overtime' | 'Holiday';

export interface Employee {
  id: string;
  name: string;
  role: Role;
  salary: number;
  status: 'Active' | 'Inactive';
  joinDate: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
}

export interface SalaryReport {
  employeeId: string;
  name: string;
  monthlySalary: number;
  leaves: number;
  extraWork: number;
  deduction: number;
  bonus: number;
  finalSalary: number;
}
