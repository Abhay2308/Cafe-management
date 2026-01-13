
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
    setEditingEmployee(emp);
    setIsEditModalOpen(true);
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Date.now().toString();
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
    if (window.confirm('Are you sure you want to delete this staff member? All their linked data will be removed from future payrolls.')) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  const getComputedStatus = (employeeId: string) => {
    const todayRecord = attendance.find(a => a.date === today && a.employeeId === employeeId);
    if (!todayRecord) return 'Inactive';
    if (['Present', 'Overtime', 'Half-Day'].includes(todayRecord.status)) return 'Active';
    return 'Inactive';
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Search staff members..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-amber-700 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-amber-800 transition-colors"
        >
          Add Employee
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider text-center">Current Status</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredEmployees.map((emp) => {
              const status = getComputedStatus(emp.id);
              return (
                <tr key={emp.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 font-bold uppercase text-xs">
                        {emp.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-stone-800">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">{emp.role}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                        {status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(emp)} className="p-2 text-stone-400 hover:text-amber-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => deleteEmployee(emp.id)} className="p-2 text-stone-400 hover:text-rose-600 transition-colors">
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

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-stone-800 mb-6">Onboard New Staff</h3>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <input required type="text" placeholder="Full Name" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} />
              <select className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none" value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value as Role})}>
                <option value="Barista">Barista</option><option value="Chef">Chef</option><option value="Waiter">Waiter</option><option value="Manager">Manager</option><option value="Cleaner">Cleaner</option>
              </select>
              <input required type="number" placeholder="Monthly Salary (₹)" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none" value={newEmployee.salary || ''} onChange={e => setNewEmployee({...newEmployee, salary: Number(e.target.value)})} />
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 font-bold text-stone-400">Cancel</button>
                <button type="submit" className="flex-1 bg-amber-700 text-white py-3 rounded-xl font-bold">Add Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-stone-800 mb-6">Update Staff Details</h3>
            <form onSubmit={handleEditEmployee} className="space-y-4">
              <input 
                required 
                type="text" 
                placeholder="Full Name" 
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none" 
                value={editingEmployee.name} 
                onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})} 
              />
              <select 
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none" 
                value={editingEmployee.role} 
                onChange={e => setEditingEmployee({...editingEmployee, role: e.target.value as Role})}
              >
                <option value="Barista">Barista</option>
                <option value="Chef">Chef</option>
                <option value="Waiter">Waiter</option>
                <option value="Manager">Manager</option>
                <option value="Cleaner">Cleaner</option>
              </select>
              <input 
                required 
                type="number" 
                placeholder="Monthly Salary (₹)" 
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none" 
                value={editingEmployee.salary} 
                onChange={e => setEditingEmployee({...editingEmployee, salary: Number(e.target.value)})} 
              />
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 font-bold text-stone-400">Cancel</button>
                <button type="submit" className="flex-1 bg-amber-700 text-white py-3 rounded-xl font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
