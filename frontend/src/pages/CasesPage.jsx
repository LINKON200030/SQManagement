import { useEffect, useMemo, useState } from 'react';
import {
  LifeBuoy,
  Plus,
  Search,
  X,
  Trash2,
  CheckCircle2,
  Loader2,
  Clock,
  User,
  Phone,
} from 'lucide-react';
import { caseService } from '../services/api';

const EMPTY_FORM = {
  customerName: '',
  customerContact: '',
  title: '',
  issues: '',
  createdBy: '',
};

const STATUS_TABS = ['All', 'In Processing', 'Solved'];

function StatusBadge({ status }) {
  if (status === 'Solved') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Solved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
      <Clock className="w-3.5 h-3.5" />
      In Processing
    </span>
  );
}

function CasesPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('All');
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Raise-a-case modal
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Solve modal
  const [solveTarget, setSolveTarget] = useState(null);
  const [solvedBy, setSolvedBy] = useState('');
  const [solutionComment, setSolutionComment] = useState('');
  const [solveError, setSolveError] = useState('');
  const [solving, setSolving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await caseService.getAll();
      setCases(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = cases;
    if (tab !== 'All') list = list.filter((c) => c.status === tab);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.caseNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.customerContact.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.issues.toLowerCase().includes(q)
    );
  }, [cases, tab, search]);

  const counts = useMemo(
    () => ({
      All: cases.length,
      'In Processing': cases.filter((c) => c.status === 'In Processing').length,
      Solved: cases.filter((c) => c.status === 'Solved').length,
    }),
    [cases]
  );

  const openForm = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setFormOpen(true);
  };

  const handleRaise = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await caseService.create(form);
      setFormOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const openSolve = (c) => {
    setSolveTarget(c);
    setSolvedBy(c.solvedBy || '');
    setSolutionComment(c.solutionComment || '');
    setSolveError('');
  };

  const handleSolve = async (e) => {
    e.preventDefault();
    if (!solveTarget) return;
    setSolving(true);
    setSolveError('');
    try {
      await caseService.update(solveTarget._id, {
        status: 'Solved',
        solvedBy,
        solutionComment,
      });
      setSolveTarget(null);
      load();
    } catch (err) {
      setSolveError(err.response?.data?.message || err.message);
    } finally {
      setSolving(false);
    }
  };

  const handleReopen = async (c) => {
    try {
      await caseService.update(c._id, { status: 'In Processing' });
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
      await caseService.remove(id);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const inputCls =
    'w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-red-300 focus:ring-4 focus:ring-red-50 transition-all';
  const labelCls = 'block text-xs font-bold text-slate-600 mb-1.5';

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center shadow-md">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-black tracking-tight">Cases</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Customer issues raised by the team, tracked until they are solved.
            </p>
          </div>
        </div>
        <button
          onClick={openForm}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-md shadow-red-900/20"
        >
          <Plus className="w-4 h-4" />
          Raise a Case
        </button>
      </div>

      {/* Tabs + search */}
      <div className="mb-5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          {STATUS_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 rounded-md text-sm font-bold transition-all ${
                tab === t ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
              <span className="ml-1.5 text-[11px] text-slate-400">{counts[t]}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search case number, customer, title…"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 border border-transparent rounded-lg placeholder-slate-400 text-slate-800 focus:outline-none focus:bg-white focus:border-red-300 focus:ring-4 focus:ring-red-50 transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Case list */}
      {loading ? (
        <div className="py-20 flex items-center justify-center text-slate-400 gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading cases…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          {cases.length === 0 ? 'No cases yet. Raise the first one!' : 'No cases match this filter.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <div
              key={c._id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {c.caseNumber}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>
                  <h3 className="mt-2 text-base font-extrabold text-black">{c.title}</h3>
                  <div className="mt-1 flex items-center gap-4 flex-wrap text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {c.customerName}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {c.customerContact}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.status === 'Solved' ? (
                    <button
                      onClick={() => handleReopen(c)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      In Processing
                    </button>
                  ) : (
                    <button
                      onClick={() => openSolve(c)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Solved
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(c._id)}
                    className={`p-2 rounded-lg transition-all ${
                      confirmDelete === c._id
                        ? 'bg-red-600 text-white'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-red-600'
                    }`}
                    title={confirmDelete === c._id ? 'Click again to confirm delete' : 'Delete case'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{c.issues}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-x-5 gap-y-1 flex-wrap text-xs text-slate-500">
                <span>
                  Created by <span className="font-bold text-slate-700">{c.createdBy}</span>
                  {' · '}
                  {new Date(c.createdAt).toLocaleString()}
                </span>
                {c.status === 'Solved' && c.solvedBy && (
                  <span>
                    Solved by <span className="font-bold text-emerald-700">{c.solvedBy}</span>
                    {c.solvedAt ? ` · ${new Date(c.solvedAt).toLocaleString()}` : ''}
                  </span>
                )}
              </div>

              {c.status === 'Solved' && c.solutionComment && (
                <div className="mt-3 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-100 text-sm text-emerald-900">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600 mb-1">
                    Solution
                  </p>
                  <p className="whitespace-pre-wrap">{c.solutionComment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Raise a Case modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !saving && setFormOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-black">Raise a Case</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Case number is assigned automatically.
                </p>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRaise} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Customer Name *</label>
                  <input
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="e.g. John Smith"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Customer Contact *</label>
                  <input
                    required
                    value={form.customerContact}
                    onChange={(e) => setForm({ ...form, customerContact: e.target.value })}
                    placeholder="Phone or email"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Case Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Short summary of the case"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Case Issues *</label>
                <textarea
                  required
                  rows={4}
                  value={form.issues}
                  onChange={(e) => setForm({ ...form, issues: e.target.value })}
                  placeholder="Describe the issue in detail…"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Case Created By *</label>
                <input
                  required
                  value={form.createdBy}
                  onChange={(e) => setForm({ ...form, createdBy: e.target.value })}
                  placeholder="Your name"
                  className={inputCls}
                />
              </div>

              {formError && (
                <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-900/20 disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Raise Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Solve modal */}
      {solveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !solving && setSolveTarget(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-black">Mark as Solved</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {solveTarget.caseNumber} · {solveTarget.title}
                </p>
              </div>
              <button
                onClick={() => setSolveTarget(null)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSolve} className="px-6 py-5 space-y-4">
              <div>
                <label className={labelCls}>Case Solved By *</label>
                <input
                  required
                  value={solvedBy}
                  onChange={(e) => setSolvedBy(e.target.value)}
                  placeholder="Your name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Case Solution Comment *</label>
                <textarea
                  required
                  rows={4}
                  value={solutionComment}
                  onChange={(e) => setSolutionComment(e.target.value)}
                  placeholder="How was this case solved?"
                  className={inputCls}
                />
              </div>

              {solveError && (
                <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {solveError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSolveTarget(null)}
                  className="px-4 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={solving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md disabled:opacity-60"
                >
                  {solving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Solved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CasesPage;
