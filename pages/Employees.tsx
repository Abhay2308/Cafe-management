
import React, { useState } from 'react';
import { Employee, Role, AttendanceRecord } from '../types';

interface EmployeesProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  attendance: AttendanceRecord[];
}

const Employees: React.FC<EmployeesProps> = ({ employees, setEmployees, attendance }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    role: 'Barista',
    salary: 0,
    status: 'Active',
    joinDate: new Date().toISOString().split('T')[0]
  });

  const today = new Date().toISOString().split('T')[0];

  const openEditModal = (emp: Employee) => {
    setEditingEmployee({ ...emp });
    setIsEditModalOpen(true);
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-increment Integer ID Logic: find max ID among numeric IDs
    const maxId = employees.reduce((max, emp) => {
      const idNum = parseInt(emp.id, 10);
      return !isNaN(idNum) ? Math.max(max, idNum) : max;
    }, 0);
    const id = (maxId + 1).toString();
    
    const emp = { ...newEmployee, id, status: 'Active' } as Employee;
    setEmployees(prev => [...prev, emp]);
    setIsAddModalOpen(false);
    setNewEmployee({
      name: '',
      role: 'Barista',
      salary: 0,
      status: 'Active',
      joinDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleEditEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? editingEmployee : emp));
    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };

  const deleteEmployee = (id: string) => {
    const target = employees.find(e => e.id === id);
    if (window.confirm(`Are you sure you want to REMOVE ${target?.name?.toUpperCase()} (ID: ${id})?`)) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      if (editingEmployee?.id === id) {
        setIsEditModalOpen(false);
        setEditingEmployee(null);
      }
    }
  };

  const handleSalaryChange = (val: string, isEdit: boolean) => {
    // Prevent leading zero by parsing as Base 10 Int
    const num = val === '' ? 0 : parseInt(val, 10);
    const safeNum = Math.max(0, num);
    if (isEdit && editingEmployee) {
      setEditingEmployee({ ...editingEmployee, salary: safeNum });
    } else {
      setNewEmployee({ ...newEmployee, salary: safeNum });
    }
  };

  const getComputedStatus = (employeeId: string) => {
    const todayRecord = attendance.find(a => a.date === today && a.employeeId === employeeId);
    if (!todayRecord) return 'Inactive';
    if (['Present', 'Half-Day'].includes(todayRecord.status) || todayRecord.isOvertime) return 'Active';
    return 'Inactive';
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Search name, role or ID..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-stone-900 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg hover:bg-amber-700 transition-all active:scale-95 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Register Staff
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-stone-50/50 border-b border-stone-100">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">ID & Name</th>
              <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Role</th>
              <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] text-center">Duty Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-stone-300 font-bold uppercase tracking-widest text-sm">No records found</td>
              </tr>
            ) : filteredEmployees.map((emp) => {
              const status = getComputedStatus(emp.id);
              return (
                <tr key={emp.id} className="hover:bg-amber-50/20 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 font-black text-sm border border-stone-200">
                        {emp.id}
                      </div>
                      <div>
                         <span className="font-bold text-stone-800 block leading-tight">{emp.name}</span>
                         <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Staff Code {emp.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                     <span className="px-3 py-1 bg-stone-50 text-stone-600 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-stone-100">{emp.role}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center">
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500' : 'bg-stone-300'}`}></span>
                        {status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(emp)} className="p-3 text-stone-400 hover:text-amber-600 hover:bg-amber-100 rounded-xl transition-all border border-stone-100 bg-white shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => deleteEmployee(emp.id)} className="p-3 text-stone-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-all border border-stone-100 bg-white shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL: ADD EMPLOYEE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300 border border-stone-200">
            <h3 className="text-xl font-black text-stone-800 tracking-tight mb-8">Onboard New Personnel</h3>
            <form onSubmit={handleAddEmployee} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Staff Member Name</label>
                <input required type="text" placeholder="Full legal name" className="w-full px-5 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none focus:border-amber-600 transition-all font-bold text-stone-800" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Job Role</label>
                  <select className="w-full px-5 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none focus:border-amber-600 transition-all font-bold text-stone-800 appearance-none" value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value as Role})}>
                    <option value="Barista">Barista</option><option value="Chef">Chef</option><option value="Waiter">Waiter</option><option value="Manager">Manager</option><option value="Cleaner">Cleaner</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Base Salary (₹)</label>
                  <input required type="number" min="0" placeholder="0" className="w-full px-5 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none focus:border-amber-600 transition-all font-bold text-stone-800" value={newEmployee.salary || ''} onChange={e => handleSalaryChange(e.target.value, false)} />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 font-black text-stone-400 hover:text-stone-600 transition-colors uppercase text-xs tracking-widest">Cancel</button>
                <button type="submit" className="flex-[2] bg-amber-700 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-amber-800 transition-all active:scale-95 uppercase text-xs tracking-widest">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT EMPLOYEE */}
      {isEditModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 border border-stone-200 overflow-hidden">
            <div className="bg-stone-900 px-10 py-10">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-amber-600 rounded-3xl flex items-center justify-center text-2xl font-black text-white shadow-xl">
                    {editingEmployee.id}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">{editingEmployee.name}</h3>
                    <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">Update Profile Information</p>
                  </div>
               </div>
            </div>

            <form onSubmit={handleEditEmployee} className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Update Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-5 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none focus:border-amber-600 transition-all font-bold text-stone-800" 
                    value={editingEmployee.name} 
                    onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Staff Designation</label>
                  <select 
                    className="w-full px-5 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none focus:border-amber-600 transition-all font-bold text-stone-800 appearance-none" 
                    value={editingEmployee.role} 
                    onChange={e => setEditingEmployee({...editingEmployee, role: e.target.value as Role})}
                  >
                    <option value="Barista">Barista</option>
                    <option value="Chef">Chef</option>
                    <option value="Waiter">Waiter</option>
                    <option value="Manager">Manager</option>
                    <option value="Cleaner">Cleaner</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Contractual Salary (₹)</label>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    className="w-full px-5 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none focus:border-amber-600 transition-all font-bold text-stone-800" 
                    value={editingEmployee.salary || ''} 
                    onChange={e => handleSalaryChange(e.target.value, true)} 
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-stone-100 flex gap-4 justify-end">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-8 py-4 font-black text-stone-400 hover:text-stone-600 transition-colors uppercase text-[10px] tracking-[0.2em]">Discard</button>
                  <button type="submit" className="px-12 py-4 bg-amber-700 text-white rounded-2xl font-black shadow-xl hover:bg-amber-800 transition-all active:scale-95 uppercase text-[10px] tracking-[0.2em]">Update Personnel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
