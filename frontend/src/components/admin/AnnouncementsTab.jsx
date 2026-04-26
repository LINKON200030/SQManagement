import { useEffect, useState } from 'react';
import {
  Plus,
  Pin,
  PinOff,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  Megaphone,
} from 'lucide-react';
import { announcementService } from '../../services/api';

const SEVERITIES = [
  { id: 'Info', label: 'Info', icon: Info, tone: 'bg-slate-100 text-slate-700 border-slate-300' },
  { id: 'Warning', label: 'Warning', icon: AlertCircle, tone: 'bg-amber-50 text-amber-700 border-amber-300' },
  { id: 'Issue', label: 'Issue', icon: AlertTriangle, tone: 'bg-red-50 text-red-700 border-red-300' },
];

const EMPTY = { title: '', body: '', severity: 'Info', pinned: false };

function AnnouncementsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await announcementService.getAll();
      setItems(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await announcementService.create({
        title: form.title.trim(),
        body: form.body.trim(),
        severity: form.severity,
        pinned: form.pinned,
      });
      setForm(EMPTY);
      setFormOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (item) => {
    try {
      await announcementService.update(item._id, { pinned: !item.pinned });
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    try {
      await announcementService.remove(id);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-black">Announcements & Issues</h2>
          <p className="text-sm text-slate-500">
            Posted here will appear in everyone's notification bell on the home page.
          </p>
        </div>
        <button
          onClick={() => {
            setFormOpen((o) => !o);
            setForm(EMPTY);
          }}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-md shadow-red-900/20"
        >
          <Plus className="w-4 h-4" />
          {formOpen ? 'Close Form' : 'New Announcement'}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-5 bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4"
        >
          <Field label="Title" required>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Server maintenance Sunday 9–11 AM"
              className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </Field>

          <Field label="Details">
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={4}
              placeholder="Add more context, steps or workarounds…"
              className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-y"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Type">
              <div className="flex gap-2">
                {SEVERITIES.map((s) => {
                  const isActive = form.severity === s.id;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setForm((f) => ({ ...f, severity: s.id }))}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg border-2 transition-colors ${
                        isActive ? s.tone : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <s.icon className="w-3.5 h-3.5" />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Pin to top">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
                  className="w-4 h-4 accent-red-600"
                />
                Pin this announcement
              </label>
            </Field>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setForm(EMPTY);
              }}
              disabled={saving}
              className="flex-1 text-sm font-bold py-2.5 rounded-lg border-2 border-slate-200 text-slate-700 hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 text-sm font-bold py-2.5 rounded-lg bg-black text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? 'Posting…' : 'Post Announcement'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-14">
          <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-red-600 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl py-14 text-center">
          <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-medium">No announcements posted.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => {
            const sev = SEVERITIES.find((s) => s.id === a.severity) || SEVERITIES[0];
            return (
              <li
                key={a._id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex items-start gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border-2 ${sev.tone}`}
                >
                  <sev.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-black leading-tight">{a.title}</p>
                    {a.pinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                    <span className="ml-auto text-[10px] text-slate-400">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {a.body && (
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">
                      {a.body}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => togglePin(a)}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-black"
                    title={a.pinned ? 'Unpin' : 'Pin to top'}
                  >
                    {a.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(a._id)}
                    onBlur={() => setConfirmDelete(null)}
                    className={`p-1.5 rounded-md ${
                      confirmDelete === a._id
                        ? 'bg-red-600 text-white'
                        : 'hover:bg-red-50 text-slate-500 hover:text-red-600'
                    }`}
                    title={confirmDelete === a._id ? 'Click again to confirm' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

export default AnnouncementsTab;
