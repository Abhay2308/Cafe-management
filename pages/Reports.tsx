
import React, { useState, useMemo, useEffect } from 'react';
import { Employee, AttendanceRecord } from '../types';
import { MONTH_NAMES } from '../data';
import * as XLSX from 'xlsx';

interface ReportsProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
}

type ReportType = 'attendance' | 'salary' | 'leaves' | 'ledger' | 'tax' | null;

const Reports: React.FC<ReportsProps> = ({ employees, attendance }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [activeReport, setActiveReport] = useState<ReportType>(null);
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

  const generateReportData = (type: ReportType) => {
    if (!type) return [];
    
    // Pull confirmed salary data from localStorage for accurate expenditure reporting
    const savedConfirmedRaw = localStorage.getItem('confirmed_individual_payrolls');
    const confirmedPayrolls = savedConfirmedRaw ? JSON.parse(savedConfirmedRaw) : {};

    const monthlyAtt = attendance.filter(a => {
      const d = new Date(a.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    switch (type) {
      case 'attendance':
        return employees.map(emp => {
          const att = monthlyAtt.filter(a => a.employeeId === emp.id);
          return {
            'Employee Name': emp.name,
            'Role': emp.role,
            'Present Days': att.filter(a => a.status === 'Present').length,
            'Absent Days': att.filter(a => a.status === 'Absent').length,
            'Half-Days': att.filter(a => a.status === 'Half-Day').length,
            // Fixed: Use isOvertime boolean instead of checking status for 'Overtime'
            'Overtime Shifts': att.filter(a => a.isOvertime).length,
            'Holidays Worked': att.filter(a => a.status === 'Holiday').length,
          };
        });

      case 'salary':
        return employees.map(emp => {
          const storageKey = `${selectedYear}-${selectedMonth}-${emp.id}`;
          const confirmed = confirmedPayrolls[storageKey];
          
          if (confirmed) {
            return {
              'Employee Name': emp.name,
              'Base Salary (₹)': confirmed.monthlySalary,
              'Leaves': confirmed.leaveDays,
              'Payable Days': confirmed.payableDays,
              'Extra Pay (₹)': confirmed.extraPay.toFixed(2),
              'Total Payout (₹)': confirmed.finalTotal.toFixed(2),
              'Status': 'Confirmed'
            };
          }

          // Fallback calculation if not confirmed
          const empAtt = monthlyAtt.filter(a => a.employeeId === emp.id);
          const perDaySalary = emp.salary / 30;
          const leaves = empAtt.reduce((acc, curr) => {
            if (curr.status === 'Absent') return acc + 1;
            if (curr.status === 'Half-Day') return acc + 0.5;
            return acc;
          }, 0);
          const payableDays = 30 - leaves;
          const holidaysWorked = empAtt.filter(a => a.status === 'Holiday').length;
          const extraPay = holidaysWorked * perDaySalary;
          const finalSalary = (payableDays * perDaySalary) + extraPay;

          return {
            'Employee Name': emp.name,
            'Base Salary (₹)': emp.salary,
            'Leaves': leaves,
            'Payable Days': payableDays,
            'Extra Pay (₹)': extraPay.toFixed(2),
            'Total Payout (₹)': finalSalary.toFixed(2),
            'Status': 'Estimated'
          };
        });

      case 'leaves':
        return employees.map(emp => {
          const empAtt = monthlyAtt.filter(a => a.employeeId === emp.id);
          const leaves = empAtt.reduce((acc, curr) => {
            if (curr.status === 'Absent') return acc + 1;
            if (curr.status === 'Half-Day') return acc + 0.5;
            return acc;
          }, 0);
          return {
            'Employee Name': emp.name,
            'Total Leaves': leaves,
            'Status': leaves > 4 ? 'High Absenteeism' : leaves > 2 ? 'Moderate' : 'Regular',
          };
        });

      case 'ledger':
        return employees.map(emp => {
          const storageKey = `${selectedYear}-${selectedMonth}-${emp.id}`;
          const confirmed = confirmedPayrolls[storageKey];
          
          if (confirmed) {
            return {
              'Employee Name': emp.name,
              'Monthly Base': confirmed.monthlySalary,
              'Leaves': confirmed.leaveDays,
              'Extra Days Eq': confirmed.extraDays.toFixed(2),
              'Final Disbursement': confirmed.finalTotal.toFixed(2),
              'Ref': 'Locked Ledger'
            };
          }

          return {
            'Employee Name': emp.name,
            'Monthly Base': emp.salary,
            'Leaves': 'N/A',
            'Extra Days Eq': 'N/A',
            'Final Disbursement': 'N/A',
            'Ref': 'Draft'
          };
        });

      case 'tax':
        const totalBasePayroll = employees.reduce((acc, emp) => acc + emp.salary, 0);
        return [
          { 'Tax Category': 'Professional Tax', 'Rate': '2%', 'Amount (₹)': (totalBasePayroll * 0.02).toFixed(2) },
          { 'Tax Category': 'Employer PF', 'Rate': '12%', 'Amount (₹)': (totalBasePayroll * 0.12).toFixed(2) },
          { 'Tax Category': 'GST on Services', 'Rate': '18%', 'Amount (₹)': (totalBasePayroll * 0.18).toFixed(2) },
          { 'Tax Category': 'Total Liability', 'Rate': 'Total', 'Amount (₹)': (totalBasePayroll * 0.32).toFixed(2) },
        ];

      default:
        return [];
    }
  };

  const downloadExcel = (type: ReportType) => {
    const data = generateReportData(type);
    if (!data.length) return;

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    const sheetName = reports.find(r => r.id === type)?.title.slice(0, 31) || "Report";
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const filename = `${type}_report_${MONTH_NAMES[selectedMonth]}_${selectedYear}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const reports = [
    { id: 'attendance', title: 'Attendance Summary', desc: 'Daily presence logs.', icon: '📋', color: 'bg-blue-500' },
    { id: 'salary', title: 'Salary Expenditure', desc: 'Payroll breakdown based on confirmed saves.', icon: '💰', color: 'bg-emerald-500' },
    { id: 'leaves', title: 'Leave Patterns', desc: 'Monthly absenteeism tracking.', icon: '🗓️', color: 'bg-amber-500' },
    { id: 'ledger', title: 'Staff Ledger', desc: 'Audit of confirmed financial records.', icon: '👤', color: 'bg-stone-700' },
    { id: 'tax', title: 'Tax & Compliance', desc: 'Statutory financial liabilities.', icon: '⚖️', color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-stone-800">Operational Reports</h2>
          <p className="text-sm text-stone-500">Voyage & Vyanjan historical records.</p>
        </div>
        <div className="flex gap-2">
          <select 
            className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm font-bold text-stone-700 outline-none"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select 
            className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm font-bold text-stone-700 outline-none"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {availableMonths.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div 
            key={report.id} 
            className={`p-6 bg-white border border-stone-200 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col ${activeReport === report.id ? 'ring-2 ring-amber-500 shadow-lg' : ''}`}
            onClick={() => setActiveReport(report.id as ReportType)}
          >
            <div className={`w-12 h-12 rounded-2xl ${report.color} bg-opacity-10 flex items-center justify-center text-2xl mb-4`}>
              {report.icon}
            </div>
            <h3 className="font-bold text-stone-800 text-lg mb-1">{report.title}</h3>
            <p className="text-stone-500 text-xs mb-6 flex-1 leading-relaxed">{report.desc}</p>
            <button 
              onClick={(e) => { e.stopPropagation(); downloadExcel(report.id as ReportType); }}
              className="mt-auto flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-100 hover:bg-amber-50 transition-colors"
            >
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Export Excel</span>
              <svg className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
          </div>
        ))}
      </div>

      {activeReport && (
        <div className="bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="px-8 py-6 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-stone-800 uppercase">Preview: {reports.find(r => r.id === activeReport)?.title}</h3>
              <p className="text-xs text-stone-400 font-medium">Data for {MONTH_NAMES[selectedMonth]} {selectedYear}</p>
            </div>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-100">
                  {Object.keys(generateReportData(activeReport)[0] || {}).map(header => (
                    <th key={header} className="px-4 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {generateReportData(activeReport).map((row, i) => (
                  <tr key={i} className="hover:bg-amber-50 transition-colors border-b border-stone-50">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-4 py-4 text-sm font-semibold text-stone-700">{val as string | number}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
