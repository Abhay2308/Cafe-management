
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Employee, AttendanceRecord, AttendanceStatus } from '../types';

interface AttendanceProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

const Attendance: React.FC<AttendanceProps> = ({ employees, attendance, setAttendance }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Calendar State
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  const getAttendanceForEmployee = useCallback((employeeId: string) => {
    return attendance.find(a => a.employeeId === employeeId && a.date === selectedDate);
  }, [attendance, selectedDate]);

  const updateAttendance = (employeeId: string, status: AttendanceStatus) => {
    const existing = getAttendanceForEmployee(employeeId);
    if (existing) {
      setAttendance(prev => prev.map(a => 
        a.id === existing.id ? { ...a, status } : a
      ));
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${employeeId}`,
        employeeId,
        date: selectedDate,
        status
      };
      setAttendance(prev => [...prev, newRecord]);
    }
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCalendarOpen]);

  // Calendar Helpers
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    if (newDate <= new Date()) {
      setViewDate(newDate);
    }
  };

  const selectDay = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (selected <= new Date()) {
      const formattedDate = selected.toISOString().split('T')[0];
      setSelectedDate(formattedDate);
      setIsCalendarOpen(false);
    }
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    
    const days = [];
    // Blank days for start of month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`blank-${i}`} className="h-10"></div>);
    }
    // Days of the month
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      const isFuture = dateObj > new Date();
      const isSelected = dateObj.toISOString().split('T')[0] === selectedDate;
      const isToday = dateObj.toISOString().split('T')[0] === todayStr;

      days.push(
        <button
          key={d}
          disabled={isFuture}
          onClick={() => selectDay(d)}
          className={`h-10 w-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all
            ${isFuture ? 'text-stone-200 cursor-not-allowed' : 'hover:bg-amber-100 text-stone-700'}
            ${isSelected ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg scale-110 z-10' : ''}
            ${isToday && !isSelected ? 'border-2 border-amber-600 text-amber-700' : ''}
          `}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="p-4 w-72 bg-white rounded-3xl shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="text-center">
            <h4 className="font-black text-stone-800 text-sm uppercase tracking-tight">{monthName}</h4>
            <span className="text-[10px] font-bold text-stone-400">{year}</span>
          </div>
          <button 
            onClick={() => changeMonth(1)}
            disabled={viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear()}
            className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-800 disabled:opacity-20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
            <div key={d} className="text-[10px] font-black text-stone-300">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-stone-800 tracking-tight">Daily Logs</h2>
          <p className="text-sm text-stone-500">Managing attendance for <span className="font-bold text-amber-700">{new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
        </div>
        
        <div className="flex items-center gap-4 relative">
          <div 
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className={`flex items-center gap-4 bg-stone-50 border-2 px-6 py-3 rounded-2xl cursor-pointer transition-all group relative
              ${isCalendarOpen ? 'border-amber-500 bg-amber-50/50' : 'border-stone-100 hover:border-amber-400'}
            `}
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Change Date</span>
              <span className="font-bold text-stone-800 text-sm">
                {new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <svg className={`w-5 h-5 transition-colors ${isCalendarOpen ? 'text-amber-600' : 'text-stone-300 group-hover:text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          {isCalendarOpen && (
            <div ref={calendarRef} className="absolute top-full right-0 mt-4 z-50">
              {renderCalendar()}
            </div>
          )}
          
          <button 
            onClick={() => {
              setSelectedDate(todayStr);
              setViewDate(new Date());
              setIsCalendarOpen(false);
            }}
            className="px-6 py-4 bg-amber-700 text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-amber-800 transition-all active:scale-95"
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-stone-100">
            <p className="text-stone-400 font-bold">No employees registered in the system yet.</p>
          </div>
        ) : employees.map((emp) => {
          const record = getAttendanceForEmployee(emp.id);
          const currentStatus = record?.status;

          return (
            <div key={emp.id} className="bg-white p-6 rounded-[2.5rem] border border-stone-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center font-black text-amber-700 border border-amber-100 uppercase">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-800 tracking-tight leading-tight">{emp.name}</h3>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{emp.role}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => updateAttendance(emp.id, 'Present')}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${currentStatus === 'Present' 
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md scale-105' 
                    : 'bg-white text-stone-400 border-stone-100 hover:border-emerald-200 hover:text-emerald-600'}`}
                >
                  Present
                </button>
                <button 
                  onClick={() => updateAttendance(emp.id, 'Overtime')}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${currentStatus === 'Overtime' 
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md scale-105' 
                    : 'bg-white text-stone-400 border-stone-100 hover:border-indigo-200 hover:text-indigo-600'}`}
                >
                  Overtime
                </button>
                <button 
                  onClick={() => updateAttendance(emp.id, 'Half-Day')}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${currentStatus === 'Half-Day' 
                    ? 'bg-amber-500 text-white border-amber-400 shadow-md scale-105' 
                    : 'bg-white text-stone-400 border-stone-100 hover:border-amber-200 hover:text-amber-600'}`}
                >
                  Half-Day
                </button>
                <button 
                  onClick={() => updateAttendance(emp.id, 'Absent')}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${currentStatus === 'Absent' 
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md scale-105' 
                    : 'bg-white text-stone-400 border-stone-100 hover:border-rose-200 hover:text-rose-600'}`}
                >
                  Absent
                </button>
                <button 
                  onClick={() => updateAttendance(emp.id, 'Holiday')}
                  className={`col-span-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${currentStatus === 'Holiday' 
                    ? 'bg-stone-800 text-white border-stone-700 shadow-md scale-105' 
                    : 'bg-white text-stone-400 border-stone-100 hover:border-stone-300 hover:text-stone-800'}`}
                >
                  Holiday / Day Off
                </button>
              </div>
              
              {currentStatus && (
                <div className="mt-6 pt-4 border-t border-stone-50 text-center">
                  <p className="text-[10px] uppercase tracking-widest font-black text-stone-400">
                    Currently: <span className={
                      currentStatus === 'Present' ? 'text-emerald-600' :
                      currentStatus === 'Absent' ? 'text-rose-600' :
                      currentStatus === 'Holiday' ? 'text-stone-800' :
                      currentStatus === 'Overtime' ? 'text-indigo-600' :
                      'text-amber-600'
                    }>{currentStatus}</span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Attendance;
