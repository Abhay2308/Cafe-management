
import React from 'react';
import { useLocation } from 'react-router-dom';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const getTitle = () => {
    const path = location.pathname.substring(1);
    return path.charAt(0).toUpperCase() + path.slice(1) || 'Dashboard';
  };

  return (
    <header className="h-20 bg-white border-b border-stone-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-stone-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-stone-800">{getTitle()}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center bg-stone-100 px-3 py-2 rounded-xl text-stone-500 text-sm font-medium">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 20 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
