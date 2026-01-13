
import React, { useState, useMemo, useEffect } from 'react';
import { Employee, AttendanceRecord } from '../types';
import { MONTH_NAMES } from '../data';
import * as XLSX from 'xlsx';

interface SalaryProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
}

interface PayrollInput {
  employeeId: string;
  monthlySalary: number;
  leaveDays: number;
  holidayWorkedDays: number;
  extraHours: number;
  standardHours: number;
}

interface ConfirmedPayroll extends PayrollInput {
  perDaySalary: number;
  payableDays: number;
  extraPay: number;
  finalTotal: number;
  confirmedAt: string;
}

const Salary: React.FC<SalaryProps> = ({ employees, attendance }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const [calc, setCalc] = useState<PayrollInput>({
    employeeId: '',
    monthlySalary: 0,
    leaveDays: 0,
    holidayWorkedDays: 0,
    extraHours: 0,
    standardHours: 8
  });

  // Track locked months (Key: "YYYY-MM")
  const [lockedMonths, setLockedMonths] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('locked_payrolls');
    return saved ? JSON.parse(saved) : {};
  });

  // Store confirmed payrolls (Key: "YYYY-MM-EmpID")
  const [confirmedPayrolls, setConfirmedPayrolls] = useState<Record<string, ConfirmedPayroll>>(() => {
    const saved = localStorage.getItem('confirmed_individual_payrolls');
    return saved ? JSON.parse(saved) : {};
  });

  const monthKey = `${selectedYear}-${selectedMonth}`;
  const isMonthLocked = lockedMonths[monthKey];
  const isFutureMonth = selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth);

  // Dynamic Year List (Up to current year only)
  const availableYears = useMemo(() => {
    const years = [];
    for (let y = 2023; y <= currentYear; y++) years.push(y);
    return years;
  }, [currentYear]);

  // Dynamic Month List (Up to current month only if current year selected)
  const availableMonths = useMemo(() => {
    if (selectedYear < currentYear) return MONTH_NAMES;
    return MONTH_NAMES.slice(0, currentMonth + 1);
  }, [selectedYear, currentYear, currentMonth]);

  // Ensure selection is valid when years change
  useEffect(() => {
    if (selectedYear === currentYear && selectedMonth > currentMonth) {
      setSelectedMonth(currentMonth);
    }
  }, [selectedYear, currentMonth, selectedMonth]);

  const openCalculator = (emp: Employee) => {
    const storageKey = `${selectedYear}-${selectedMonth}-${emp.id}`;
    const previouslyConfirmed = confirmedPayrolls[storageKey];

    if (previouslyConfirmed) {
      setCalc({ ...previouslyConfirmed });
      return;
    }

    const empMonthlyAtt = attendance.filter(a => {
      const d = new Date(a.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && a.employeeId === emp.id;
    });

    const autoLeaves = empMonthlyAtt.reduce((acc, curr) => {
      if (curr.status === 'Absent') return acc + 1;
      if (curr.status === 'Half-Day') return acc + 0.5;
      return acc;
    }, 0);

    const autoHolidaysWorked = empMonthlyAtt.filter(a => a.status === 'Holiday').length;

    setCalc({
      employeeId: emp.id,
      monthlySalary: emp.salary,
      leaveDays: autoLeaves,
      holidayWorkedDays: autoHolidaysWorked,
      extraHours: 0,
      standardHours: 8
    });
  };

  const results = useMemo(() => {
    const perDaySalary = calc.monthlySalary / 30;
    const payableDays = 30 - calc.leaveDays;
    
    let extraDays = 0;
    let ruleUsed = 'None';
    
    if (calc.holidayWorkedDays > 0) {
      extraDays = calc.holidayWorkedDays;
      ruleUsed = 'Rule A (Holiday)';
    } else {
      extraDays = calc.extraHours / calc.standardHours;
      ruleUsed = calc.extraHours > 0 ? 'Rule B (Overtime)' : 'None';
    }

    const extraPay = extraDays * perDaySalary;
    const finalTotal = (payableDays * perDaySalary) + extraPay;

    return {
      perDaySalary,
      payableDays,
      extraDays,
      extraPay,
      finalTotal,
      ruleUsed
    };
  }, [calc]);

  const handleConfirmAndSave = () => {
    if (!calc.employeeId) return;
    const storageKey = `${selectedYear}-${selectedMonth}-${calc.employeeId}`;
    
    const confirmationData: ConfirmedPayroll = {
      ...calc,
      ...results,
      confirmedAt: new Date().toISOString()
    };

    const newConfirmed = { ...confirmedPayrolls, [storageKey]: confirmationData };
    setConfirmedPayrolls(newConfirmed);
    localStorage.setItem('confirmed_individual_payrolls', JSON.stringify(newConfirmed));
    alert(`${employees.find(e => e.id === calc.employeeId)?.name}'s payroll confirmed for ${MONTH_NAMES[selectedMonth]}!`);
  };

  const handleLockMonth = () => {
    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      alert("Current month's payroll cannot be locked until the month ends.");
      return;
    }
    const newLocked = { ...lockedMonths, [monthKey]: true };
    setLockedMonths(newLocked);
    localStorage.setItem('locked_payrolls', JSON.stringify(newLocked));
  };

  const downloadReceipt = () => {
    const emp = employees.find(e => e.id === calc.employeeId);
    if (!emp) return;

    const receiptData = [
      { 'Description': 'Employee Name', 'Value': emp.name },
      { 'Description': 'Month/Year', 'Value': `${MONTH_NAMES[selectedMonth]} ${selectedYear}` },
      { 'Description': 'Base Monthly Salary', 'Value': `₹${calc.monthlySalary}` },
      { 'Description': 'Per Day Salary (30 Day Base)', 'Value': `₹${results.perDaySalary.toFixed(2)}` },
      { 'Description': 'Total Leaves Taken', 'Value': `${calc.leaveDays} Days` },
      { 'Description': 'Payable Days', 'Value': `${results.payableDays} Days` },
      { 'Description': 'Extra Pay Rule Applied', 'Value': results.ruleUsed },
      { 'Description': 'Extra Pay Bonus', 'Value': `₹${results.extraPay.toFixed(2)}` },
      { 'Description': 'Final Total Payout', 'Value': `₹${results.finalTotal.toFixed(2)}` },
    ];

    const ws = XLSX.utils.json_to_sheet(receiptData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Salary Receipt");
    XLSX.writeFile(wb, `Receipt_${emp.name.replace(/\s/g, '_')}_${MONTH_NAMES[selectedMonth]}.xlsx`);
  };

  const isCalcConfirmed = confirmedPayrolls[`${selectedYear}-${selectedMonth}-${calc.employeeId}`];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-stone-800 tracking-tight">Financial Center</h2>
          <p className="text-sm text-stone-500">Managing payroll for {MONTH_NAMES[selectedMonth]} {selectedYear}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 font-bold text-sm outline-none"
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 font-bold text-sm outline-none"
          >
            {availableMonths.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          {isMonthLocked ? (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 font-bold text-xs uppercase tracking-widest">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
              Month Locked
            </div>
          ) : (
            <button 
              disabled={isFutureMonth}
              onClick={handleLockMonth}
              className={`px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md transition-all ${isFutureMonth ? 'bg-stone-100 text-stone-300' : 'bg-amber-700 text-white hover:bg-amber-800'}`}
            >
              Lock Month
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-3">
          <div className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Staff List</div>
          {employees.map(emp => {
            const confirmed = confirmedPayrolls[`${selectedYear}-${selectedMonth}-${emp.id}`];
            return (
              <button 
                key={emp.id}
                onClick={() => openCalculator(emp)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${calc.employeeId === emp.id ? 'bg-amber-50 border-amber-500 shadow-md' : 'bg-white border-transparent hover:border-stone-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${calc.employeeId === emp.id ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-400'}`}>
                    {emp.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-stone-800 text-sm flex items-center gap-2">
                      {emp.name}
                      {confirmed && (
                        <span className="w-2 h-2 bg-emerald-500 rounded-full" title="Confirmed"></span>
                      )}
                    </p>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{emp.role}</p>
                  </div>
                </div>
                {confirmed && (
                  <span className="text-[8px] font-black text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded">Saved</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="xl:col-span-3">
          {calc.employeeId ? (
            <div className={`bg-white rounded-[2.5rem] p-8 md:p-10 border border-stone-200 shadow-xl transition-all ${isMonthLocked ? 'opacity-75 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-3xl font-black text-stone-800 tracking-tighter">
                    {employees.find(e => e.id === calc.employeeId)?.name}
                  </h3>
                  {isCalcConfirmed && (
                    <p className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest mt-1">Status: Finalized & Saved</p>
                  )}
                  {!isCalcConfirmed && (
                    <p className="text-amber-600 font-bold text-[10px] uppercase tracking-widest mt-1">Status: Pending Confirmation</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-stone-400 text-[10px] font-black uppercase tracking-widest block">Contract Base</span>
                  <span className="text-2xl font-black text-stone-800">₹{calc.monthlySalary.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Leave Days (Sync)</label>
                      <input 
                        type="number" step="0.5"
                        disabled={isMonthLocked}
                        className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl px-4 py-3 font-bold text-stone-800 focus:border-amber-500 outline-none"
                        value={calc.leaveDays}
                        onChange={(e) => setCalc({...calc, leaveDays: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Std Hours</label>
                      <input 
                        type="number"
                        disabled={isMonthLocked}
                        className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl px-4 py-3 font-bold text-stone-800 focus:border-amber-500 outline-none"
                        value={calc.standardHours}
                        onChange={(e) => setCalc({...calc, standardHours: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-4">
                    <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em]">Extra Pay Adjustments</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-amber-900">Holiday Worked Days</label>
                        <input 
                          type="number"
                          disabled={isMonthLocked}
                          className="w-full bg-white border-2 border-amber-200 rounded-xl px-4 py-3 font-black text-amber-900 focus:border-amber-500 outline-none"
                          value={calc.holidayWorkedDays}
                          onChange={(e) => setCalc({...calc, holidayWorkedDays: Number(e.target.value)})}
                        />
                      </div>

                      <div className={`space-y-2 transition-opacity ${calc.holidayWorkedDays > 0 ? 'opacity-30 pointer-events-none' : ''}`}>
                        <label className="text-xs font-bold text-indigo-900">Overtime Hours</label>
                        <input 
                          type="number"
                          disabled={calc.holidayWorkedDays > 0 || isMonthLocked}
                          className="w-full bg-white border-2 border-indigo-100 rounded-xl px-4 py-3 font-black text-indigo-900 focus:border-indigo-500 outline-none"
                          value={calc.extraHours}
                          onChange={(e) => setCalc({...calc, extraHours: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-stone-800 pb-4">
                      <span className="text-[10px] font-black text-stone-500 uppercase">Per Day (Base 30)</span>
                      <span className="font-bold">₹{results.perDaySalary.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-800 pb-4">
                      <span className="text-[10px] font-black text-stone-500 uppercase">Payable Days</span>
                      <span className="font-bold">{results.payableDays}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-800 pb-4">
                      <span className="text-[10px] font-black text-stone-500 uppercase">Extra Pay Bonus</span>
                      <span className="font-bold text-emerald-500">+₹{results.extraPay.toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="mt-8">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Final Payout</p>
                    <span className="text-4xl font-black text-white">₹{results.finalTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    
                    <div className="mt-8 flex flex-col gap-2">
                      {!isMonthLocked && (
                        <button 
                          onClick={handleConfirmAndSave}
                          className="w-full bg-amber-600 text-white py-4 rounded-xl font-black text-sm shadow-xl hover:bg-amber-700 transition-all active:scale-95"
                        >
                          {isCalcConfirmed ? 'Update Confirmation' : 'Confirm & Save'}
                        </button>
                      )}
                      <button 
                        onClick={downloadReceipt}
                        className="w-full bg-white text-stone-900 py-3 rounded-xl font-bold text-sm hover:bg-stone-100 transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Receipt
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] bg-white border-4 border-dashed border-stone-100 rounded-[3rem] flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 text-2xl">💰</div>
              <h3 className="text-xl font-bold text-stone-400">Payroll Calculation Ready</h3>
              <p className="text-stone-300 text-sm max-w-xs mt-2 font-medium">Select an employee to finalize their monthly earnings and confirm the payroll save.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Salary;
