import { useState } from 'react';
import { ShieldCheck, Users2, FileBarChart2, Megaphone } from 'lucide-react';
import PartnersTab from '../components/admin/PartnersTab';
import MonthlyReportTab from '../components/admin/MonthlyReportTab';
import AnnouncementsTab from '../components/admin/AnnouncementsTab';

const TABS = [
  { id: 'partners', label: 'Our Partners', icon: Users2 },
  { id: 'report', label: 'Monthly Report', icon: FileBarChart2 },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
];

function AdminPage() {
  const [activeTab, setActiveTab] = useState('partners');

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-[1400px] mx-auto print:p-0 print:max-w-none">
      <div className="mb-6 flex items-center gap-3 print:hidden">
        <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center shadow-md">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-black tracking-tight">Admin</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage retail partners and monthly business reports.
          </p>
        </div>
      </div>

      <div className="mb-5 flex gap-2 border-b border-slate-200 print:hidden">
        {TABS.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
                isActive
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-500 hover:text-black'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'partners' && <PartnersTab />}
      {activeTab === 'report' && <MonthlyReportTab />}
      {activeTab === 'announcements' && <AnnouncementsTab />}
    </div>
  );
}

export default AdminPage;
