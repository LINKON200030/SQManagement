import { useEffect, useRef, useState } from 'react';
import { Bell, Pin, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { announcementService } from '../services/api';

const SEVERITY = {
  Info: { icon: Info, dot: 'bg-slate-400', label: 'bg-slate-100 text-slate-700' },
  Warning: { icon: AlertCircle, dot: 'bg-amber-500', label: 'bg-amber-50 text-amber-700' },
  Issue: { icon: AlertTriangle, dot: 'bg-red-600', label: 'bg-red-50 text-red-700' },
};

function AnnouncementBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await announcementService.getAll();
      setItems(res.data);
    } catch {
      // silent: keep bell working even if fetch fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const count = items.length;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        className="relative p-2.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
        title="Announcements"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-30">
          <div className="px-4 py-3 bg-black text-white flex items-center justify-between">
            <div>
              <p className="text-sm font-extrabold tracking-tight">Announcements</p>
              <p className="text-[11px] text-white/60">Issues and updates from admin.</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="w-7 h-7 rounded-full border-4 border-slate-100 border-t-red-600 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">No announcements.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((a) => {
                  const sev = SEVERITY[a.severity] || SEVERITY.Info;
                  const Icon = sev.icon;
                  return (
                    <li key={a._id} className="p-4 hover:bg-slate-50">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center text-white shrink-0 ${sev.dot}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-extrabold text-black leading-tight">
                              {a.title}
                            </p>
                            {a.pinned && (
                              <Pin className="w-3 h-3 text-red-600" />
                            )}
                            <span
                              className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${sev.label}`}
                            >
                              {a.severity}
                            </span>
                          </div>
                          {a.body && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">
                              {a.body}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-1.5">
                            {new Date(a.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AnnouncementBell;
