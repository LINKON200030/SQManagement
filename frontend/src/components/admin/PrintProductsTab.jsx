import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Package, AlertTriangle, X, Check, Download } from 'lucide-react';
import { printProductService } from '../../services/api';

const EMPTY = {
  sku: '',
  name: '',
  description: '',
  priceMinor: 0,
  currency: 'gbp',
  kind: 'print',
  stockQty: '',
  active: true,
  sortOrder: 0,
};

const fmtMoney = (minor, currency = 'gbp') =>
  ((minor || 0) / 100).toLocaleString('en-GB', { style: 'currency', currency: currency.toUpperCase() });

function PrintProductsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await printProductService.list();
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

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    setError('');
    try {
      const res = await printProductService.seedDefaults();
      setSeedMsg(`Loaded ${res.data.created} new product${res.data.created === 1 ? '' : 's'} (${res.data.skipped} already existed)`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    try {
      await printProductService.remove(id);
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
          <h2 className="text-lg font-extrabold text-black">Print Catalogue</h2>
          <p className="text-sm text-slate-500">
            Products shown in the public gallery store. Prices are the source of truth — checkout
            ignores any client-supplied amount.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            title="Load every product from surreyquaysphotostudio.com/printings (skips any SKU you already have)"
          >
            <Download className="w-4 h-4" />
            {seeding ? 'Loading…' : 'Load default catalogue'}
          </button>
          <button
            onClick={() => {
              setEditTarget(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-md shadow-red-900/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {seedMsg && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          <Check className="w-4 h-4" />
          {seedMsg}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-14">
          <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-red-600 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl py-14 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">No products yet.</p>
          <button
            onClick={() => {
              setEditTarget(null);
              setModalOpen(true);
            }}
            className="mt-3 text-sm font-bold text-red-600 hover:text-red-700"
          >
            Add your first print →
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">SKU</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Kind</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Stock</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.sku}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-black">{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-slate-500 mt-0.5">{p.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        p.kind === 'print'
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {p.kind}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold">{fmtMoney(p.priceMinor, p.currency)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {p.kind === 'physical' ? (p.stockQty ?? '—') : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-bold">Hidden</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setEditTarget(p);
                        setModalOpen(true);
                      }}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-black"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      onBlur={() => setConfirmDelete(null)}
                      className={`p-1.5 rounded-md ${
                        confirmDelete === p._id
                          ? 'bg-red-600 text-white'
                          : 'hover:bg-red-50 text-slate-500 hover:text-red-600'
                      }`}
                      title={confirmDelete === p._id ? 'Click again to confirm' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ProductFormModal
          product={editTarget}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function ProductFormModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    if (!product) return { ...EMPTY };
    return {
      ...EMPTY,
      ...product,
      priceMajor: ((product.priceMinor || 0) / 100).toFixed(2),
      stockQty: product.stockQty ?? '',
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const priceMajor = parseFloat(form.priceMajor);
    if (!form.sku.trim()) return setError('SKU is required');
    if (!form.name.trim()) return setError('Name is required');
    if (Number.isNaN(priceMajor) || priceMajor < 0) return setError('Price must be ≥ 0');

    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      description: form.description?.trim() || '',
      priceMinor: Math.round(priceMajor * 100),
      currency: form.currency || 'gbp',
      kind: form.kind === 'physical' ? 'physical' : 'print',
      stockQty:
        form.kind === 'physical' && form.stockQty !== '' && form.stockQty !== null
          ? parseInt(form.stockQty, 10)
          : null,
      active: form.active !== false,
      sortOrder: parseInt(form.sortOrder, 10) || 0,
    };

    setSaving(true);
    try {
      if (product?._id) await printProductService.update(product._id, payload);
      else await printProductService.create(payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h3 className="font-extrabold text-black">{product ? 'Edit product' : 'New product'}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <Field label="SKU" required className="col-span-1">
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="8x10"
                disabled={!!product}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                required
              />
            </Field>
            <Field label="Name" required className="col-span-2">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder='8" × 10" Lustre Print'
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                required
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional — shown under the product name in the public store."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Price (£)" required>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.priceMajor ?? ''}
                onChange={(e) => setForm({ ...form, priceMajor: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                required
              />
            </Field>
            <Field label="Kind">
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="print">print (made-to-order)</option>
                <option value="physical">physical (inventory)</option>
              </select>
            </Field>
            <Field label="Stock (physical only)">
              <input
                type="number"
                min="0"
                disabled={form.kind !== 'physical'}
                value={form.stockQty ?? ''}
                onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </Field>
          </div>
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active !== false}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="font-bold text-slate-700">Active (show in public store)</span>
            </label>
            <Field label="Sort">
              <input
                type="number"
                value={form.sortOrder ?? 0}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg"
            >
              {saving ? 'Saving…' : product ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default PrintProductsTab;
