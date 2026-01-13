
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Employee, AttendanceRecord } from '../types';
import { MONTH_NAMES } from '../data';

interface LeavesProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
}

const Leaves: React.FC<LeavesProps> = ({ employees, attendance }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const availableYears = useMemo(() => {
    const years = [];
    for (let y = 2023; y <= currentYear; y++) years.push(y);
    return years;
  }, [currentYear]);

  const availableMonths = useMemo(() => {
    if (selectedYear < currentYear) return MONTH_NAMES;
    return MONTH_NAMES.slice(0, currentMonth + 1);
  }, [selectedYear, currentYear, currentMonth]);

  useEffect(() => {
    if (selectedYear === currentYear && selectedMonth > currentMonth) {
      setSelectedMonth(currentMonth);
    }
  }, [selectedYear, currentMonth, selectedMonth]);

  const leaveData = useMemo(() => {
    return employees.map(emp => {
      const empMonthlyAtt = attendance.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && a.employeeId === emp.id;
      });

      const leaves = empMonthlyAtt.reduce((acc, curr) => {
        if (curr.status === 'Absent') return acc + 1;
        if (curr.status === 'Half-Day') return acc + 0.5;
        return acc;
      }, 0);

      return {
        name: emp.name,
        leaves: leaves
      };
    }).sort((a, b) => b.leaves - a.leaves);
  }, [employees, attendance, selectedMonth, selectedYear]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-stone-800">Leave Analytics</h2>
          <p className="text-sm text-stone-500">Tracking absenteeism records up to {MONTH_NAMES[currentMonth]} {currentYear}.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm font-semibold text-stone-600 outline-none focus:ring-2 focus:ring-amber-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select 
            className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm font-semibold text-stone-600 outline-none focus:ring-2 focus:ring-amber-500"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {availableMonths.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="text-lg font-bold text-stone-800 mb-6">Staff Leave Distribution</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveData} layout="vertical" margin={{ left: 40, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f5f5f5" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} width={100} />
                <Tooltip 
                  cursor={{fill: '#f5f5f5'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="leaves" radius={[0, 4, 4, 0]} barSize={24}>
                  {leaveData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.leaves > 3 ? '#e11d48' : entry.leaves > 1 ? '#d97706' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-bold text-stone-800">Monthly Breakdown</h3>
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{MONTH_NAMES[selectedMonth]} {selectedYear}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase text-center">Days Taken</th>
                  <th className="px-6 py-3 text-xs font-bold text-stone-500 uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {leaveData.map((emp) => (
                  <tr key={emp.name} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-stone-700">{emp.name}</td>
                    <td className="px-6 py-4 text-sm font-bold text-stone-900 text-center">{emp.leaves}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${emp.leaves > 5 ? 'bg-rose-100 text-rose-600' : emp.leaves > 2 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {emp.leaves > 5 ? 'High Risk' : emp.leaves > 2 ? 'Moderate' : 'Healthy'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaves;
