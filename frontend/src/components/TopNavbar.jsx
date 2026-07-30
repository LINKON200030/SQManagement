import { Menu, Search, Plus, LifeBuoy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnnouncementBell from './AnnouncementBell';

function TopNavbar({ onMenuClick }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
      <div className="h-16 px-4 sm:px-6 flex items-center gap-4">
        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-700"
        >
          <Menu className="w-5 h-5" />
        </button>

      

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md ml-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers, orders…"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 border border-transparent rounded-lg placeholder-slate-400 text-slate-800 focus:outline-none focus:bg-white focus:border-red-300 focus:ring-4 focus:ring-red-50 transition-all"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          <AnnouncementBell />
          <button
            onClick={() => navigate('/cases')}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-bold text-black bg-white border border-slate-300 hover:bg-slate-50 shadow-sm active:scale-[0.98] transition-all"
          >
            <LifeBuoy className="w-4 h-4 text-red-600" />
            <span className="hidden sm:inline">Raise a Case</span>
            <span className="sm:hidden">Case</span>
          </button>
          <button
            onClick={() => navigate('/orders/new')}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-900/20 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Order / Query</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopNavbar;
