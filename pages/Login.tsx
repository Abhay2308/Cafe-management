
import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId === 'SachinAgarwal' && password === 'Sachin@cafe') {
      onLogin();
    } else {
      setError('Invalid Credentials. Please check your ID and Password.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200">
          <div className="bg-stone-900 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600 opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Voyage & Vyanjan</h1>
            <p className="text-stone-400 text-sm mt-1 uppercase tracking-widest font-bold">Admin Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-bounce">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Admin ID</label>
              <input 
                required
                type="text" 
                className="w-full px-5 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none focus:border-amber-600 transition-all font-bold text-stone-800"
                placeholder="Enter ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Password</label>
              <input 
                required
                type="password" 
                className="w-full px-5 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none focus:border-amber-600 transition-all font-bold text-stone-800"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-amber-700 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-amber-800 transition-all active:scale-95 text-lg mt-4"
            >
              Unlock Access
            </button>

            <p className="text-center text-stone-400 text-xs mt-6 font-medium">
              Secure Cloud Infrastructure &copy; 2025
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
