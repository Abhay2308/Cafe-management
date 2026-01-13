
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
    standardHours: 10
  });

  const [lockedMonths, setLockedMonths] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('locked_payrolls');
    return saved ? JSON.parse(saved) : {};
  });

  const [confirmedPayrolls, setConfirmedPayrolls] = useState<Record<string, ConfirmedPayroll>>(() => {
    const saved = localStorage.getItem('confirmed_individual_payrolls');
    return saved ? JSON.parse(saved) : {};
  });

  const monthKey = `${selectedYear}-${selectedMonth}`;
  const isMonthLocked = lockedMonths[monthKey];
  const isFutureMonth = selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth);

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
    const autoOTHours = empMonthlyAtt.filter(a => a.isOvertime).length * 2;

    setCalc({
      employeeId: emp.id,
      monthlySalary: emp.salary,
      leaveDays: autoLeaves,
      holidayWorkedDays: autoHolidaysWorked,
      extraHours: autoOTHours,
      standardHours: 10
    });
  };

  const results = useMemo(() => {
    const perDaySalary = calc.monthlySalary / 30;
    const payableDays = Math.max(0, 30 - calc.leaveDays);
    const holidayExtraDays = calc.holidayWorkedDays;
    const otExtraDays = calc.extraHours / calc.standardHours;
    const totalExtraDays = holidayExtraDays + otExtraDays;
    const extraPay = totalExtraDays * perDaySalary;
    const finalTotal = (payableDays * perDaySalary) + extraPay;

    return {
      perDaySalary,
      payableDays,
      extraDays: totalExtraDays,
      extraPay,
      finalTotal
    };
  }, [calc]);

  const handleConfirmAndSave = () => {
    if (!calc.employeeId) return;
    const storageKey = `${selectedYear}-${selectedMonth}-${calc.employeeId}`;
    const confirmationData: ConfirmedPayroll = { ...calc, ...results, confirmedAt: new Date().toISOString() };
    const newConfirmed = { ...confirmedPayrolls, [storageKey]: confirmationData };
    setConfirmedPayrolls(newConfirmed);
    localStorage.setItem('confirmed_individual_payrolls', JSON.stringify(newConfirmed));
    alert('Payroll Confirmed!');
  };

  const handleLockMonth = () => {
    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      alert("Month hasn't ended yet.");
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
      { 'Desc': 'Staff', 'Val': emp.name },
      { 'Desc': 'Month', 'Val': `${MONTH_NAMES[selectedMonth]} ${selectedYear}` },
      { 'Desc': 'Base', 'Val': `₹${calc.monthlySalary}` },
      { 'Desc': 'Leaves', 'Val': calc.leaveDays },
      { 'Desc': 'Extra Pay', 'Val': `₹${results.extraPay.toFixed(2)}` },
      { 'Desc': 'Final', 'Val': `₹${results.finalTotal.toFixed(2)}` },
    ];
    const ws = XLSX.utils.json_to_sheet(receiptData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Salary");
    XLSX.writeFile(wb, `Receipt_${emp.name}.xlsx`);
  };

  const handleNumberInput = (field: keyof PayrollInput, val: string) => {
    let num = val === '' ? 0 : parseFloat(val);
    // Safety check: Don't allow negative values for holiday and extra hours
    if ((field === 'holidayWorkedDays' || field === 'extraHours' || field === 'leaveDays' || field === 'monthlySalary') && num < 0) {
      num = 0;
    }
    setCalc(prev => ({ ...prev, [field]: num }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-stone-800 tracking-tight">Financial Center</h2>
          <p className="text-sm text-stone-500">Managing payroll for {MONTH_NAMES[selectedMonth]} {selectedYear}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 font-bold text-sm outline-none">
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 font-bold text-sm outline-none">
            {availableMonths.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          {isMonthLocked ? <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 font-bold text-xs uppercase tracking-widest">Locked</div> : <button disabled={isFutureMonth} onClick={handleLockMonth} className={`px-5 py-2 rounded-xl font-bold text-xs uppercase shadow-md transition-all ${isFutureMonth ? 'bg-stone-100 text-stone-300' : 'bg-amber-700 text-white'}`}>Lock Month</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-3">
          <div className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Staff List</div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {employees.length === 0 ? (
              <p className="text-xs text-stone-400 font-bold text-center py-8">No employees found.</p>
            ) : employees.map(emp => (
              <button key={emp.id} onClick={() => openCalculator(emp)} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${calc.employeeId === emp.id ? 'bg-amber-50 border-amber-500 shadow-md' : 'bg-white border-transparent hover:border-stone-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${calc.employeeId === emp.id ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-400'}`}>{emp.name.charAt(0)}</div>
                  <div className="text-left"><p className="font-bold text-stone-800 text-sm">{emp.name}</p><p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{emp.role}</p></div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-3">
          {calc.employeeId ? (
            <div className={`bg-white rounded-[2.5rem] p-8 md:p-10 border border-stone-200 shadow-xl transition-all ${isMonthLocked ? 'opacity-75 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black text-stone-800 tracking-tighter">{employees.find(e => e.id === calc.employeeId)?.name}</h3>
                <div className="text-right"><span className="text-stone-400 text-[10px] font-black uppercase tracking-widest block">Contract Base</span><span className="text-2xl font-black text-stone-800">₹{calc.monthlySalary.toLocaleString()}</span></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Leave Days</label>
                      <input type="number" step="0.5" min="0" className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl px-4 py-3 font-bold text-stone-800 focus:border-amber-400 outline-none" value={calc.leaveDays || ''} onChange={(e) => handleNumberInput('leaveDays', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Std Hours</label>
                      <input type="number" min="1" className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl px-4 py-3 font-bold text-stone-800 focus:border-amber-400 outline-none" value={calc.standardHours || ''} onChange={(e) => handleNumberInput('standardHours', e.target.value)} />
                    </div>
                  </div>

                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-4">
                    <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em]">Extra Pay (Holiday + OT)</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-amber-900">Holiday Worked Days</label>
                        <input type="number" min="0" className="w-full bg-white border-2 border-amber-200 rounded-xl px-4 py-3 font-black text-amber-900 focus:border-amber-500 outline-none" value={calc.holidayWorkedDays || ''} onChange={(e) => handleNumberInput('holidayWorkedDays', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-indigo-900">Overtime Hours</label>
                        <input type="number" min="0" className="w-full bg-white border-2 border-indigo-100 rounded-xl px-4 py-3 font-black text-indigo-900 focus:border-indigo-400 outline-none" value={calc.extraHours || ''} onChange={(e) => handleNumberInput('extraHours', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-stone-800 pb-4"><span className="text-[10px] font-black text-stone-500 uppercase">Per Day</span><span className="font-bold">₹{results.perDaySalary.toFixed(0)}</span></div>
                    <div className="flex justify-between border-b border-stone-800 pb-4"><span className="text-[10px] font-black text-stone-500 uppercase">Payable Days</span><span className="font-bold">{results.payableDays}</span></div>
                    <div className="flex justify-between border-b border-stone-800 pb-4"><span className="text-[10px] font-black text-stone-500 uppercase">Bonus Payout</span><span className="font-bold text-emerald-500">+₹{results.extraPay.toFixed(0)}</span></div>
                  </div>
                  <div className="mt-8">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Final Payout</p>
                    <span className="text-4xl font-black text-white">₹{results.finalTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <div className="mt-8 flex flex-col gap-2">
                      <button onClick={handleConfirmAndSave} className="w-full bg-amber-600 text-white py-4 rounded-xl font-black text-sm shadow-xl active:scale-95 hover:bg-amber-500 transition-colors">Confirm & Save</button>
                      <button onClick={downloadReceipt} className="w-full bg-white text-stone-900 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-100 transition-colors">Receipt</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] bg-white border-4 border-dashed border-stone-100 rounded-[3rem] flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-6">
                 <svg className="w-10 h-10 text-stone-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-stone-300">Select Staff to Calculate</h3>
              <p className="text-sm text-stone-200 mt-2">Pick an employee from the left panel to begin payroll.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Salary;
