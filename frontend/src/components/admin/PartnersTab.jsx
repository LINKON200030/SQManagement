import { useEffect, useState } from 'react';
import {
  Plus,
  Globe,
  Mail,
  Phone,
  User,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { partnerService } from '../../services/api';
import PartnerFormModal from './PartnerFormModal';

function PartnersTab() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [revealed, setRevealed] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await partnerService.getAll();
      setPartners(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (partner) => {
    setEditTarget(partner);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setModalOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    try {
      await partnerService.remove(id);
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
          <h2 className="text-lg font-extrabold text-black">Retail Partners</h2>
          <p className="text-sm text-slate-500">
            All suppliers and retailers we order items from.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-md shadow-red-900/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Partner
        </button>
      </div>

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
      ) : partners.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl py-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-2xl">
            🏬
          </div>
          <p className="text-sm text-slate-400 font-medium">No partners added yet.</p>
          <button
            onClick={openCreate}
            className="mt-3 text-sm font-bold text-red-600 hover:text-red-700"
          >
            Add your first retailer →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {partners.map((p) => {
            const showPwd = revealed[p._id];
            return (
              <div
                key={p._id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:border-red-200 hover:shadow-md transition-all flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-black text-base truncate">
                      {p.name}
                    </h3>
                    {p.productTypes && (
                      <p className="text-xs text-slate-500 mt-0.5 inline-flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {p.productTypes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(p)}
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
                  </div>
                </div>

                {p.website && (
                  <a
                    href={p.website.startsWith('http') ? p.website : `https://${p.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 truncate mb-3"
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{p.website}</span>
                  </a>
                )}

                <div className="space-y-2 text-sm border-t border-slate-100 pt-3">
                  <Row label="Account Email" value={p.accountEmail} />
                  <Row
                    label="Account Password"
                    value={
                      p.accountPassword ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="font-mono">
                            {showPwd ? p.accountPassword : '•'.repeat(Math.min(p.accountPassword.length, 10))}
                          </span>
                          <button
                            onClick={() =>
                              setRevealed((r) => ({ ...r, [p._id]: !r[p._id] }))
                            }
                            className="p-0.5 rounded text-slate-400 hover:text-black"
                          >
                            {showPwd ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </span>
                      ) : null
                    }
                  />
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Contact Person
                  </p>
                  {p.contactName && (
                    <p className="inline-flex items-center gap-1.5 text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">{p.contactName}</span>
                    </p>
                  )}
                  {p.contactNumber && (
                    <p className="inline-flex items-center gap-1.5 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a
                        href={`tel:${p.contactNumber}`}
                        className="hover:text-red-600"
                      >
                        {p.contactNumber}
                      </a>
                    </p>
                  )}
                  {p.contactEmail && (
                    <p className="inline-flex items-center gap-1.5 text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a
                        href={`mailto:${p.contactEmail}`}
                        className="hover:text-red-600 truncate"
                      >
                        {p.contactEmail}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PartnerFormModal
        open={modalOpen}
        partner={editTarget}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="text-slate-700 font-medium break-all">
        {value || <span className="text-slate-300">—</span>}
      </p>
    </div>
  );
}

export default PartnersTab;
