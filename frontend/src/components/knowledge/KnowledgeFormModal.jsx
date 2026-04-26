import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { knowledgeService } from '../../services/api';

const EMPTY = { title: '', category: '', content: '' };

function KnowledgeFormModal({ open, article, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(article ? { ...EMPTY, ...article } : EMPTY);
      setError('');
      setSaving(false);
    }
  }, [open, article]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category.trim() || 'General',
        content: form.content,
      };
      const res = article?._id
        ? await knowledgeService.update(article._id, payload)
        : await knowledgeService.create(payload);
      onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="bg-black px-6 py-5 border-b-4 border-red-600">
          <DialogTitle className="text-lg font-extrabold text-white tracking-tight">
            {article ? 'Edit Article' : 'Create Knowledge Hub'}
          </DialogTitle>
          <DialogDescription className="text-white/60 text-sm mt-1">
            Add an internal guide, process or how-to for the team.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <Field label="Title" required>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. How to print a VAT invoice"
              className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </Field>

          <Field label="Category">
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="General, Operations, Photolab…"
              className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </Field>

          <Field label="Description / Content">
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              rows={10}
              placeholder="Write the full step-by-step guide here…"
              className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-y"
            />
          </Field>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 text-sm font-bold py-2.5 rounded-lg border-2 border-slate-200 text-slate-700 hover:border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 text-sm font-bold py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : article ? 'Save Changes' : 'Create Article'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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

export default KnowledgeFormModal;
