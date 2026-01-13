
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Employee, AttendanceRecord } from '../types';

interface DashboardProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ employees, attendance }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const stats = useMemo(() => {
    const todayAtt = attendance.filter(a => a.date === today);
    const present = todayAtt.filter(a => a.status === 'Present').length;
    const extraWork = todayAtt.filter(a => a.isOvertime).length;
    const halfDay = todayAtt.filter(a => a.status === 'Half-Day').length;
    const absent = todayAtt.filter(a => a.status === 'Absent').length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyAtt = attendance.filter(a => {
      const d = new Date(a.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    
    const totalLeaves = monthlyAtt.reduce((acc, curr) => {
      if (curr.status === 'Absent') return acc + 1;
      if (curr.status === 'Half-Day') return acc + 0.5;
      return acc;
    }, 0);

    const totalSalary = employees.reduce((acc, curr) => acc + curr.salary, 0);

    return {
      totalEmployees: employees.length,
      presentToday: present + (halfDay * 0.5),
      absentToday: absent + (halfDay * 0.5),
      leavesThisMonth: totalLeaves,
      salaryThisMonth: totalSalary,
      overtimeToday: extraWork
    };
  }, [attendance, today, employees]);

  const leaveTrendData = [
    { name: 'Jan', leaves: 8.0 },
    { name: 'Feb', leaves: 6.5 },
    { name: 'Mar', leaves: 12.0 },
    { name: 'Apr', leaves: 7.5 },
    { name: 'May', leaves: stats.leavesThisMonth || 4 },
  ];

  const StatCard = ({ title, value, icon, color, subText }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        {React.cloneElement(icon, { className: `w-6 h-6 ${color.replace('bg-', 'text-')}` })}
      </div>
      <div>
        <p className="text-sm font-medium text-stone-500">{title}</p>
        <h3 className="text-2xl font-bold text-stone-800 mt-1">{value}</h3>
        {subText && <p className="text-xs text-stone-400 mt-1 font-medium">{subText}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-stone-900">Admin Control Center</h2>
        <p className="text-stone-500">Voyage and Vyanjan performance overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard title="Total Employees" value={stats.totalEmployees} icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} color="bg-amber-600" subText="Staff Strength" />
        <StatCard title="Present Today" value={stats.presentToday} icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="bg-emerald-600" subText="Main Roster" />
        <StatCard title="Overtime Active" value={stats.overtimeToday} icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} color="bg-indigo-600" subText="Extra Shifts" />
        <StatCard title="Monthly Leaves" value={stats.leavesThisMonth} icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} color="bg-rose-600" subText="Leave Days Taken" />
        <StatCard title="Total Payout" value={`₹${stats.salaryThisMonth.toLocaleString()}`} icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="bg-violet-600" subText="Active Salaries" />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
        <h4 className="text-xl font-bold text-stone-800 mb-8">Leaves Overview</h4>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leaveTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 13, fontWeight: 500}} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 13}} />
              <Tooltip cursor={{fill: '#fafaf9'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}} />
              <Bar dataKey="leaves" radius={[8, 8, 0, 0]} barSize={50} fill="#d97706" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
