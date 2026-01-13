
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Employee, AttendanceRecord, AttendanceStatus } from '../types';

interface AttendanceProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

const Attendance: React.FC<AttendanceProps> = ({ employees, attendance, setAttendance }) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  const getAttendanceForEmployee = useCallback((employeeId: string) => {
    return attendance.find(a => a.employeeId === employeeId && a.date === selectedDate);
  }, [attendance, selectedDate]);

  /**
   * Status Toggle Logic
   * If the clicked status is already active, we "turn it off" (remove the record).
   * Otherwise, we update the status. 
   * Special Rule: Absent/Holiday turns off Overtime.
   */
  const updateAttendance = (employeeId: string, status: AttendanceStatus) => {
    const existing = getAttendanceForEmployee(employeeId);
    
    if (existing && existing.status === status) {
      // Toggle OFF: Remove the attendance record entirely
      setAttendance(prev => prev.filter(a => a.id !== existing.id));
      return;
    }

    const shouldDisableOT = status === 'Absent' || status === 'Holiday';

    if (existing) {
      // Toggle ON different status
      setAttendance(prev => prev.map(a => 
        a.id === existing.id 
          ? { ...a, status, isOvertime: shouldDisableOT ? false : a.isOvertime } 
          : a
      ));
    } else {
      // Create new record
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${employeeId}`,
        employeeId,
        date: selectedDate,
        status,
        isOvertime: false
      };
      setAttendance(prev => [...prev, newRecord]);
    }
  };

  /**
   * Overtime Toggle Logic
   * Special Rule: Turning Overtime 'On' automatically sets status to 'Present'.
   */
  const toggleOvertime = (employeeId: string) => {
    const existing = getAttendanceForEmployee(employeeId);
    
    if (existing) {
      const newOTState = !existing.isOvertime;
      setAttendance(prev => prev.map(a => 
        a.id === existing.id 
          ? { ...a, isOvertime: newOTState, status: newOTState ? 'Present' : a.status } 
          : a
      ));
    } else {
      // Overtime 'On' implies Present status
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${employeeId}`,
        employeeId,
        date: selectedDate,
        status: 'Present',
        isOvertime: true
      };
      setAttendance(prev => [...prev, newRecord]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    // Block navigating to previous months
    if (newDate.getFullYear() > now.getFullYear() || (newDate.getFullYear() === now.getFullYear() && newDate.getMonth() >= now.getMonth())) {
      setViewDate(newDate);
    }
  };

  const selectDay = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    // Date locking logic
    if (selected.getFullYear() < now.getFullYear() || (selected.getFullYear() === now.getFullYear() && selected.getMonth() < now.getMonth())) {
      return;
    }
    setSelectedDate(selected.toISOString().split('T')[0]);
    setIsCalendarOpen(false);
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(<div key={`blank-${i}`} className="h-10"></div>);
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      const isPastMonth = dateObj.getFullYear() < now.getFullYear() || (dateObj.getFullYear() === now.getFullYear() && dateObj.getMonth() < now.getMonth());
      const isSelected = dateObj.toISOString().split('T')[0] === selectedDate;
      
      days.push(
        <button key={d} disabled={isPastMonth} onClick={() => selectDay(d)}
          className={`h-10 w-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${isPastMonth ? 'text-stone-200 cursor-not-allowed' : 'hover:bg-amber-100 text-stone-700'} ${isSelected ? 'bg-amber-600 text-white shadow-lg scale-110 z-10' : ''}`}>
          {d}
        </button>
      );
    }
    return (
      <div className="p-4 w-72 bg-white rounded-3xl shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => changeMonth(-1)} disabled={viewDate.getFullYear() === now.getFullYear() && viewDate.getMonth() === now.getMonth()} className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 disabled:opacity-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
          <div className="text-center">
            <h4 className="font-black text-stone-800 text-sm uppercase tracking-tight">{viewDate.toLocaleString('default', { month: 'long' })}</h4>
            <span className="text-[10px] font-bold text-stone-400">{year}</span>
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-stone-100 rounded-lg text-stone-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-[10px] font-black text-stone-300">{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
        <div className="mt-4 pt-3 border-t border-stone-50 text-center">
           <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Historical locking active (Previous months locked)</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-stone-800 tracking-tight">Daily Roster</h2>
          <p className="text-sm text-stone-500">Managing logs for <span className="font-bold text-amber-700">{new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
        </div>
        <div className="flex items-center gap-4 relative">
          <div onClick={() => setIsCalendarOpen(!isCalendarOpen)} className={`flex items-center gap-4 bg-stone-50 border-2 px-6 py-3 rounded-2xl cursor-pointer transition-all ${isCalendarOpen ? 'border-amber-500 bg-amber-50/50' : 'border-stone-100 hover:border-amber-400'}`}>
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Log Date</span>
              <span className="font-bold text-stone-800 text-sm">{new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <svg className={`w-5 h-5 ${isCalendarOpen ? 'text-amber-600' : 'text-stone-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          {isCalendarOpen && <div ref={calendarRef} className="absolute top-full right-0 mt-4 z-50">{renderCalendar()}</div>}
          <button onClick={() => {setSelectedDate(todayStr); setViewDate(new Date()); setIsCalendarOpen(false);}} className="px-6 py-4 bg-amber-700 text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-amber-800 transition-all active:scale-95">Go to Today</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-stone-100"><p className="text-stone-400 font-bold uppercase tracking-widest text-xs">No active staff in records</p></div>
        ) : employees.map((emp) => {
          const record = getAttendanceForEmployee(emp.id);
          const currentStatus = record?.status;
          const isOT = record?.isOvertime;

          return (
            <div key={emp.id} className="bg-white p-6 rounded-[2.5rem] border border-stone-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center font-black text-stone-400 border border-stone-100 uppercase text-xs">{emp.id}</div>
                  <div>
                    <h3 className="text-md font-black text-stone-800 tracking-tight leading-tight">{emp.name}</h3>
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">{emp.role}</span>
                  </div>
                </div>
                <button 
                  onClick={() => toggleOvertime(emp.id)} 
                  className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${isOT ? 'bg-indigo-600 text-white border-indigo-400 shadow-md scale-105' : 'bg-stone-50 text-stone-400 border-stone-100 hover:border-indigo-200'}`}
                >
                  Overtime
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => updateAttendance(emp.id, 'Present')} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${currentStatus === 'Present' ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' : 'bg-white text-stone-400 border-stone-100 hover:border-emerald-100'}`}>Present</button>
                <button onClick={() => updateAttendance(emp.id, 'Half-Day')} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${currentStatus === 'Half-Day' ? 'bg-amber-500 text-white border-amber-400 shadow-md' : 'bg-white text-stone-400 border-stone-100 hover:border-amber-100'}`}>Half-Day</button>
                <button onClick={() => updateAttendance(emp.id, 'Absent')} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${currentStatus === 'Absent' ? 'bg-rose-600 text-white border-rose-500 shadow-md' : 'bg-white text-stone-400 border-stone-100 hover:border-rose-100'}`}>Absent</button>
                <button onClick={() => updateAttendance(emp.id, 'Holiday')} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${currentStatus === 'Holiday' ? 'bg-stone-800 text-white border-stone-700 shadow-md' : 'bg-white text-stone-400 border-stone-100 hover:border-stone-100'}`}>Holiday</button>
              </div>
              
              <div className="mt-4 flex gap-2 justify-center h-5">
                {!currentStatus && <span className="text-[8px] font-black uppercase tracking-widest text-stone-300">Pending Log</span>}
                {currentStatus && <span className="text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 animate-in fade-in zoom-in-50">{currentStatus}</span>}
                {isOT && <span className="text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 animate-in fade-in zoom-in-50">Overtime Active</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Attendance;
