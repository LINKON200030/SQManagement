import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  PlusCircle,
  ShieldCheck,
  BookOpen,
  Camera,
  Images,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/orders', label: 'All Orders', icon: ShoppingBag },
      { to: '/orders/new', label: 'Create Order', icon: PlusCircle },
      { to: '/galleries', label: 'Create Gallery', icon: Images },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { to: '/admin', label: 'Admin', icon: ShieldCheck },
      { to: '/knowledge', label: 'Knowledge Hub', icon: BookOpen },
    ],
  },
];

function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 transform transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full bg-black flex flex-col border-r border-white/10">
          {/* Brand */}
          <div className="h-16 px-5 flex items-center gap-2.5 border-b border-white/10">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/40">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="font-extrabold text-white tracking-tight">SQ Management</p>
              <p className="text-[11px] text-white/40 font-medium">Photo Studio CRM</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                  {section.label}
                </p>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            isActive
                              ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                              : 'text-white/65 hover:bg-white/5 hover:text-white'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-7 rounded-r bg-red-500" />
                            )}
                            <item.icon
                              className={`w-[18px] h-[18px] shrink-0 ${
                                isActive ? 'text-white' : 'text-white/50 group-hover:text-white'
                              }`}
                            />
                            <span className="flex-1">{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

        </div>
      </aside>
    </>
  );
}

export default Sidebar;
