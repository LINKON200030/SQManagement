import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { partnerService } from '../../services/api';

const EMPTY = {
  name: '',
  website: '',
  productTypes: '',
  accountEmail: '',
  accountPassword: '',
  contactName: '',
  contactNumber: '',
  contactEmail: '',
};

function PartnerFormModal({ open, partner, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(partner ? { ...EMPTY, ...partner } : EMPTY);
      setError('');
      setSaving(false);
    }
  }, [open, partner]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Partner name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (partner?._id) {
        await partnerService.update(partner._id, form);
      } else {
        await partnerService.create(form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="bg-black px-6 py-5 border-b-4 border-red-600">
          <DialogTitle className="text-lg font-extrabold text-white tracking-tight">
            {partner ? 'Edit Partner' : 'Add Partner'}
          </DialogTitle>
          <DialogDescription className="text-white/60 text-sm mt-1">
            Save retailer details so the team can quickly re-order.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <Section title="Retailer">
            <Field label="Name" required>
              <Input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Tetenal UK" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Website">
                <Input
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://retailer.co.uk"
                />
              </Field>
              <Field label="Products / Categories">
                <Input
                  name="productTypes"
                  value={form.productTypes}
                  onChange={handleChange}
                  placeholder="Photo paper, ink, frames…"
                />
              </Field>
            </div>
          </Section>

          <Section title="Account Login">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Account Email">
                <Input
                  name="accountEmail"
                  type="email"
                  value={form.accountEmail}
                  onChange={handleChange}
                  placeholder="orders@surreyquays.co.uk"
                />
              </Field>
              <Field label="Account Password">
                <Input
                  name="accountPassword"
                  value={form.accountPassword}
                  onChange={handleChange}
                  placeholder="•••••••"
                />
              </Field>
            </div>
          </Section>

          <Section title="Contact Person">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Name">
                <Input
                  name="contactName"
                  value={form.contactName}
                  onChange={handleChange}
                  placeholder="John Smith"
                />
              </Field>
              <Field label="Phone Number">
                <Input
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  placeholder="+44 20 1234 5678"
                />
              </Field>
            </div>
            <Field label="Email">
              <Input
                name="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={handleChange}
                placeholder="john@retailer.co.uk"
              />
            </Field>
          </Section>

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
              {saving ? 'Saving…' : partner ? 'Save Changes' : 'Add Partner'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1 h-4 bg-red-600 rounded-full" />
        <h3 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-black">
          {title}
        </h3>
      </div>
      <div className="space-y-3">{children}</div>
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

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-colors ${className}`}
    />
  );
}

export default PartnerFormModal;
