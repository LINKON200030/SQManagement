import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Image as ImageIcon,
  Star,
  StarOff,
  Lock,
  Unlock,
  Download,
  Copy,
  Check,
  Trash2,
  Upload,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import { galleryService, apiBaseUrl } from '../../services/api';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const fmtMoney = (minor, currency = 'gbp') =>
  ((minor || 0) / 100).toLocaleString('en-GB', { style: 'currency', currency: currency.toUpperCase() });

function GalleriesTab() {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await galleryService.list();
      setGalleries(res.data);
      // Refresh selected from the new list so toggles stay in sync.
      if (selected) {
        const fresh = res.data.find((g) => g._id === selected._id);
        if (fresh) setSelected(fresh);
      }
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-black">Client Galleries</h2>
          <p className="text-sm text-slate-500">
            Private, token-gated photo galleries with watermark and print sales.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-md shadow-red-900/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Gallery
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading && !galleries.length ? (
        <div className="flex justify-center py-14">
          <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-red-600 animate-spin" />
        </div>
      ) : galleries.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl py-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-400 font-medium">No galleries yet.</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-3 text-sm font-bold text-red-600 hover:text-red-700"
          >
            Create your first gallery →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {galleries.map((g) => (
            <GalleryCard key={g._id} gallery={g} onOpen={() => setSelected(g)} />
          ))}
        </div>
      )}

      {createOpen && (
        <CreateGalleryModal
          onClose={() => setCreateOpen(false)}
          onCreated={(g) => {
            setCreateOpen(false);
            load();
            setSelected(g);
          }}
        />
      )}

      {selected && (
        <GalleryDetailModal
          gallery={selected}
          onClose={() => setSelected(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function GalleryCard({ gallery, onOpen }) {
  const [copied, setCopied] = useState(false);
  const copy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(gallery.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div
      onClick={onOpen}
      className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:border-red-200 hover:shadow-md transition-all cursor-pointer flex flex-col"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-extrabold text-black text-base truncate">{gallery.clientName}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{fmtDate(gallery.shootDate)}</p>
        </div>
        <div className="flex gap-1 shrink-0 text-slate-500">
          {gallery.hasPassword ? (
            <Lock className="w-4 h-4 text-amber-600" title="Password protected" />
          ) : (
            <Unlock className="w-4 h-4" title="No password" />
          )}
          {gallery.settings?.downloadEnabled ? (
            <Download className="w-4 h-4 text-emerald-600" title="Downloads on" />
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Photos</p>
          <p className="font-bold text-black">{gallery.photoCount}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Highlights</p>
          <p className="font-bold text-black">{gallery.highlightCount}</p>
        </div>
      </div>
      {gallery.expiresAt && (
        <p className="text-xs text-slate-500 mb-3">Expires {fmtDate(gallery.expiresAt)}</p>
      )}
      <button
        onClick={copy}
        className="mt-auto inline-flex items-center justify-center gap-2 text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy share link'}
      </button>
    </div>
  );
}

function CreateGalleryModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    clientName: '',
    shootDate: new Date().toISOString().slice(0, 10),
    password: '',
    expiresAt: '',
    downloadEnabled: false,
    watermarkEnabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await galleryService.create({
        clientName: form.clientName,
        shootDate: form.shootDate,
        password: form.password || undefined,
        expiresAt: form.expiresAt || undefined,
        settings: {
          downloadEnabled: form.downloadEnabled,
          watermarkEnabled: form.watermarkEnabled,
        },
      });
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="New gallery" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
        )}
        <Field label="Client name" required>
          <input
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Shoot date" required>
            <input
              type="date"
              value={form.shootDate}
              onChange={(e) => setForm({ ...form, shootDate: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </Field>
          <Field label="Expires (optional)">
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </Field>
        </div>
        <Field label="Password (optional, min 4 chars)">
          <input
            type="text"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Leave blank for no password"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </Field>
        <div className="flex gap-4">
          <Toggle
            label="Allow downloads"
            value={form.downloadEnabled}
            onChange={(v) => setForm({ ...form, downloadEnabled: v })}
          />
          <Toggle
            label="Watermark"
            value={form.watermarkEnabled}
            onChange={(v) => setForm({ ...form, watermarkEnabled: v })}
          />
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
            {saving ? 'Creating…' : 'Create gallery'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function GalleryDetailModal({ gallery: initial, onClose, onChanged }) {
  const [gallery, setGallery] = useState(initial);
  const [tab, setTab] = useState('photos');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const refresh = async () => {
    try {
      const res = await galleryService.get(gallery._id);
      setGallery(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await galleryService.orders(gallery._id);
      setOrders(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    if (tab === 'orders') loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const upload = async (files) => {
    const arr = Array.from(files || []).filter((f) => f.type.startsWith('image/'));
    if (!arr.length) return;
    if (arr.length > 20) {
      setError('Maximum 20 photos per upload — please split into smaller batches.');
      return;
    }
    const oversize = arr.find((f) => f.size > 15 * 1024 * 1024);
    if (oversize) {
      setError(`"${oversize.name}" is over 15 MB — please resize first.`);
      return;
    }
    setBusy(true);
    setError('');
    setUploadErrors([]);
    setUploadPct(0);
    try {
      const res = await galleryService.uploadPhotos(gallery._id, arr, setUploadPct);
      if (res.data?.errors?.length) setUploadErrors(res.data.errors);
      await refresh();
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
      setUploadPct(0);
    }
  };

  const toggleHighlight = async (photoId, current) => {
    try {
      await galleryService.update(gallery._id, { highlights: { [photoId]: !current } });
      await refresh();
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const removePhoto = async (photoId) => {
    if (!confirm('Delete this photo? Cannot be undone.')) return;
    try {
      await galleryService.deletePhoto(gallery._id, photoId);
      await refresh();
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      await galleryService.update(gallery._id, { settings: { [key]: value } });
      await refresh();
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const updateField = async (patch) => {
    try {
      await galleryService.update(gallery._id, patch);
      await refresh();
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(gallery.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current?.classList.remove('ring-2', 'ring-red-500');
    upload(e.dataTransfer.files);
  };

  return (
    <ModalShell title={gallery.clientName} onClose={onClose} wide>
      {error && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="text-sm text-slate-600">
          {fmtDate(gallery.shootDate)} · {gallery.photoCount} photos · {gallery.highlightCount} highlights
        </div>
        <div className="flex items-center gap-2">
          <a
            href={gallery.shareLink.startsWith('http') ? gallery.shareLink : `${apiBaseUrl}${gallery.shareLink}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-slate-700 underline truncate max-w-[280px]"
          >
            {gallery.shareLink}
          </a>
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 mb-4">
        {[
          ['photos', 'Photos'],
          ['settings', 'Settings'],
          ['orders', 'Orders'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px ${
              tab === id ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-black'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'photos' && (
        <div>
          <div
            ref={dropRef}
            onDragOver={(e) => {
              e.preventDefault();
              dropRef.current?.classList.add('ring-2', 'ring-red-500');
            }}
            onDragLeave={() => dropRef.current?.classList.remove('ring-2', 'ring-red-500')}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer mb-4 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-700">
              {busy ? `Uploading… ${uploadPct}%` : 'Drop photos here or click to choose'}
            </p>
            <p className="text-xs text-slate-500 mt-1">JPEG/PNG · up to 15 MB each, 20 per batch · web variant resized + watermarked server-side</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => upload(e.target.files)}
            />
            {busy && (
              <div className="mt-3 h-1.5 bg-slate-200 rounded overflow-hidden">
                <div className="h-full bg-red-600 transition-all" style={{ width: `${uploadPct}%` }} />
              </div>
            )}
          </div>

          {uploadErrors.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              <p className="font-bold mb-1">{uploadErrors.length} photo{uploadErrors.length === 1 ? '' : 's'} failed:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                {uploadErrors.map((e, i) => (
                  <li key={i}>
                    <span className="font-mono">{e.name || '(unnamed)'}</span> — {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {gallery.photos.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-8">No photos uploaded yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {gallery.photos.map((p) => (
                <div key={p._id} className="relative group bg-slate-100 rounded-lg overflow-hidden aspect-square">
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleHighlight(p._id, p.isHighlight)}
                      title={p.isHighlight ? 'Unhighlight' : 'Mark highlight'}
                      className="text-white hover:text-yellow-400"
                    >
                      {p.isHighlight ? <Star className="w-4 h-4 fill-current text-yellow-400" /> : <StarOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => removePhoto(p._id)}
                      title="Delete"
                      className="text-white hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {p.isHighlight && !('opacity-0' in {}) && (
                    <div className="absolute top-1.5 right-1.5">
                      <Star className="w-4 h-4 fill-current text-yellow-400 drop-shadow" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-5 max-w-lg">
          <Toggle
            label="Allow downloads"
            description="Visitors can download full-resolution originals (single or zip-all)."
            value={Boolean(gallery.settings?.downloadEnabled)}
            onChange={(v) => updateSetting('downloadEnabled', v)}
          />
          <Toggle
            label="Watermark"
            description="Burned into the web variant of each photo. Disable only if you re-upload originals."
            value={gallery.settings?.watermarkEnabled !== false}
            onChange={(v) => updateSetting('watermarkEnabled', v)}
          />
          <Field label="Expires (leave blank for never)">
            <input
              type="date"
              defaultValue={gallery.expiresAt ? new Date(gallery.expiresAt).toISOString().slice(0, 10) : ''}
              onBlur={(e) => updateField({ expiresAt: e.target.value || null })}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Change password">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={gallery.hasPassword ? '(set)' : '(none)'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateField({ password: e.currentTarget.value });
                    e.currentTarget.value = '';
                  }
                }}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              {gallery.hasPassword && (
                <button
                  onClick={() => updateField({ clearPassword: true })}
                  className="px-3 py-2 text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Press Enter to save.</p>
          </Field>
        </div>
      )}

      {tab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-10">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No print orders for this gallery yet.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Customer</th>
                    <th className="text-left px-3 py-2">Items</th>
                    <th className="text-right px-3 py-2">Total</th>
                    <th className="text-left px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id} className="border-t border-slate-100">
                      <td className="px-3 py-2 whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                      <td className="px-3 py-2">
                        <div className="font-bold text-black">{o.customerName || '—'}</div>
                        <div className="text-xs text-slate-500">{o.customerEmail}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-700">
                        {o.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
                      </td>
                      <td className="px-3 py-2 text-right font-bold">{fmtMoney(o.totalMinor, o.currency)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            o.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : o.status === 'Fulfilled'
                                ? 'bg-sky-100 text-sky-700'
                                : o.status === 'Cancelled'
                                  ? 'bg-slate-200 text-slate-600'
                                  : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}

function ModalShell({ title, onClose, wide = false, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-5xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h3 className="font-extrabold text-black">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`mt-0.5 w-10 h-6 rounded-full transition-colors relative ${value ? 'bg-red-600' : 'bg-slate-300'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
            value ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </button>
      <div>
        <p className="text-sm font-bold text-black">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

export default GalleriesTab;
