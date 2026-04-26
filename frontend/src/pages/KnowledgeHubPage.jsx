import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { knowledgeService } from '../services/api';
import KnowledgeFormModal from '../components/knowledge/KnowledgeFormModal';

function KnowledgeHubPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await knowledgeService.getAll();
      setArticles(res.data);
      if (!activeId && res.data.length > 0) setActiveId(res.data[0]._id);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q) ||
        a.content?.toLowerCase().includes(q)
    );
  }, [articles, search]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const a of filtered) {
      const key = a.category || 'General';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const active = articles.find((a) => a._id === activeId);

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (article) => {
    setEditTarget(article);
    setModalOpen(true);
  };

  const handleSaved = (saved) => {
    setModalOpen(false);
    if (saved?._id) setActiveId(saved._id);
    load();
  };

  const handleDelete = async (id) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    try {
      await knowledgeService.remove(id);
      setConfirmDelete(null);
      if (activeId === id) setActiveId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-[1400px] mx-auto">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-black tracking-tight">
              Knowledge Hub
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Internal guides, processes and how-tos for the team.
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-md shadow-red-900/20"
        >
          <Plus className="w-4 h-4" />
          Create Knowledge Hub
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Topics sidebar */}
        <aside className="lg:col-span-4 xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 border border-transparent rounded-lg placeholder-slate-400 focus:outline-none focus:bg-white focus:border-red-300 focus:ring-2 focus:ring-red-50"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[70vh]">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-red-600 animate-spin" />
              </div>
            ) : grouped.length === 0 ? (
              <div className="p-6 text-center">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">
                  {articles.length === 0 ? 'No articles yet.' : 'No matches.'}
                </p>
              </div>
            ) : (
              <ul className="py-2">
                {grouped.map(([category, items]) => (
                  <li key={category} className="mb-2">
                    <p className="px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                      {category}
                    </p>
                    {items.map((a) => {
                      const isActive = a._id === activeId;
                      return (
                        <button
                          key={a._id}
                          onClick={() => setActiveId(a._id)}
                          className={`w-full text-left px-4 py-2.5 flex items-start gap-2 border-l-4 transition-colors ${
                            isActive
                              ? 'border-red-600 bg-red-50/60'
                              : 'border-transparent hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`text-sm font-semibold leading-tight ${
                              isActive ? 'text-red-600' : 'text-black'
                            }`}
                          >
                            {a.title}
                          </span>
                        </button>
                      );
                    })}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Article content */}
        <main className="lg:col-span-8 xl:col-span-9 bg-white rounded-xl border border-slate-200 shadow-sm min-h-[60vh]">
          {active ? (
            <article className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-600 mb-1.5">
                    {active.category || 'General'}
                  </p>
                  <h2 className="text-2xl font-extrabold text-black tracking-tight">
                    {active.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Last updated {new Date(active.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(active)}
                    className="p-2 rounded-md hover:bg-slate-100 text-slate-500 hover:text-black"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(active._id)}
                    onBlur={() => setConfirmDelete(null)}
                    className={`p-2 rounded-md ${
                      confirmDelete === active._id
                        ? 'bg-red-600 text-white'
                        : 'hover:bg-red-50 text-slate-500 hover:text-red-600'
                    }`}
                    title={
                      confirmDelete === active._id ? 'Click again to confirm' : 'Delete'
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                {active.content ? (
                  <div className="prose prose-slate max-w-none text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {active.content}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No description provided.</p>
                )}
              </div>
            </article>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <BookOpen className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 font-medium">
                {articles.length === 0
                  ? 'Create your first knowledge article to get started.'
                  : 'Select a topic from the left to read it.'}
              </p>
              {articles.length === 0 && (
                <button
                  onClick={openCreate}
                  className="mt-3 text-sm font-bold text-red-600 hover:text-red-700"
                >
                  Create Knowledge Hub →
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      <KnowledgeFormModal
        open={modalOpen}
        article={editTarget}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}

export default KnowledgeHubPage;
