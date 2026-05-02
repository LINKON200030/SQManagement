import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, PlusCircle, User, Phone, Mail } from 'lucide-react';
import useOrderStore from '../store/orderStore';

const USERS = ['Linkon', 'Raki', 'Babu', 'Balli', 'Johana'];

const INITIAL_FORM = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  title: '',
  description: '',
  price: '',
  advancePaid: '',
  priceStatus: 'Unpaid',
  orderBy: '',
  assignedTo: '',
  tag: 'Flexible',
  dueDate: '',
  chargeMode: 'remaining',
};

function CreateOrderPage() {
  const navigate = useNavigate();
  const { createOrder, loading } = useOrderStore();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = 'Customer name is required';
    const hasPhone = !!form.customerPhone.trim();
    const hasEmail = !!form.customerEmail.trim();
    if (!hasPhone && !hasEmail) {
      e.customerPhone = 'Provide either a phone number or email';
      e.customerEmail = 'Provide either a phone number or email';
    } else {
      if (hasPhone && !/^[0-9+\-\s()]{6,}$/.test(form.customerPhone.trim()))
        e.customerPhone = 'Enter a valid phone number';
      if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim()))
        e.customerEmail = 'Enter a valid email';
    }
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.price || Number(form.price) < 0) e.price = 'Enter a valid price';
    if (form.advancePaid !== '' && Number(form.advancePaid) < 0)
      e.advancePaid = 'Advance cannot be negative';
    if (
      form.price &&
      form.advancePaid !== '' &&
      Number(form.advancePaid) > Number(form.price)
    )
      e.advancePaid = 'Advance cannot exceed the total price';
    if (!form.orderBy) e.orderBy = 'Select who placed the order';
    if (!form.assignedTo) e.assignedTo = 'Select an employee';
    if (!form.dueDate) e.dueDate = 'Due date is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitError('');
    const result = await createOrder({
      ...form,
      price: Number(form.price),
      advancePaid: form.advancePaid === '' ? 0 : Number(form.advancePaid),
      chargeMode: form.chargeMode || 'remaining',
    });
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/'), 1400);
    } else {
      setSubmitError(result.error || 'Failed to create order. Check your connection.');
    }
  };

  const inputBase =
    'w-full rounded-lg px-4 py-2.5 text-sm text-black placeholder-slate-300 focus:outline-none focus:ring-4 transition-all bg-white border-2';
  const inputClass = (field) =>
    `${inputBase} ${
      errors[field]
        ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-100'
        : 'border-slate-200 hover:border-slate-300 focus:border-red-400 focus:ring-red-50'
    }`;
  const inputWithIconClass = (field) => `${inputClass(field).replace('px-4', 'pl-10 pr-4')}`;

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-14 text-center shadow-lg">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-black">Order Saved</h2>
          <p className="text-slate-500 mt-2">Redirecting you to the dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-red-600 text-sm mb-6 transition-colors font-medium group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Form header */}
        <div className="bg-black px-7 py-6 border-b-4 border-red-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight">
                Create Order / Query
              </h1>
              <p className="text-white/60 text-xs mt-0.5">
                Capture customer details and order information in one place
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-7">
          {submitError && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {submitError}
            </div>
          )}

          {/* Customer info section */}
          <Section title="Customer Information">
            <p className="text-[11px] text-slate-500 mb-3 -mt-1">
              Phone or email is required — at least one of them must be filled in.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Customer Name" required error={errors.customerName}>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    placeholder="Tanvir Ahmed"
                    className={inputWithIconClass('customerName')}
                  />
                </div>
              </Field>
              <Field
                label="Phone Number"
                hint="Phone or email"
                error={errors.customerPhone}
              >
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    name="customerPhone"
                    value={form.customerPhone}
                    onChange={handleChange}
                    placeholder="+880 1700-000000"
                    className={inputWithIconClass('customerPhone')}
                  />
                </div>
              </Field>
              <Field
                label="Email"
                hint="Phone or email"
                error={errors.customerEmail}
              >
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    name="customerEmail"
                    value={form.customerEmail}
                    onChange={handleChange}
                    placeholder="customer@email.com"
                    className={inputWithIconClass('customerEmail')}
                  />
                </div>
              </Field>
            </div>
          </Section>

          {/* Order details section */}
          <Section title="Order Details">
            <div className="space-y-5">
              <Field label="Order Title" required error={errors.title}>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Wedding Photography – Rahman Family"
                  className={inputClass('title')}
                />
              </Field>

              <Field label="Description">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Additional details, location, special notes…"
                  rows={3}
                  className={inputClass('description')}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Price (£)" required error={errors.price}>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={inputClass('price')}
                  />
                </Field>
                <Field label="Advance Paid (£)" error={errors.advancePaid}>
                  <input
                    type="number"
                    name="advancePaid"
                    value={form.advancePaid}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={inputClass('advancePaid')}
                  />
                  <div className="flex gap-2 mt-2">
                    <QuickChip
                      onClick={() =>
                        setForm((f) => ({ ...f, advancePaid: '0' }))
                      }
                    >
                      None
                    </QuickChip>
                    <QuickChip
                      disabled={!form.price}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          advancePaid: (Number(f.price) * 0.5).toFixed(2),
                        }))
                      }
                    >
                      50%
                    </QuickChip>
                    <QuickChip
                      disabled={!form.price}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          advancePaid: Number(f.price).toFixed(2),
                          priceStatus: 'Paid',
                        }))
                      }
                    >
                      Full
                    </QuickChip>
                  </div>
                </Field>
                <Field label="Payment Status">
                  <select
                    name="priceStatus"
                    value={form.priceStatus}
                    onChange={handleChange}
                    className={inputClass('priceStatus')}
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </Field>
              </div>

              <Field
                label="Stripe Payment Link"
                hint="Charges the customer when they click the link"
              >
                <div className="grid grid-cols-2 gap-2">
                  <ChargeModeOption
                    active={form.chargeMode === 'remaining'}
                    onClick={() => setForm((f) => ({ ...f, chargeMode: 'remaining' }))}
                    title="Remaining Balance"
                    subtitle="Charges price − advance"
                  />
                  <ChargeModeOption
                    active={form.chargeMode === 'full'}
                    onClick={() => setForm((f) => ({ ...f, chargeMode: 'full' }))}
                    title="Full Price"
                    subtitle="Charges the entire price"
                  />
                </div>
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Order By" required error={errors.orderBy}>
                  <select
                    name="orderBy"
                    value={form.orderBy}
                    onChange={handleChange}
                    className={inputClass('orderBy')}
                  >
                    <option value="">Select person</option>
                    {USERS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Assigned To" required error={errors.assignedTo}>
                  <select
                    name="assignedTo"
                    value={form.assignedTo}
                    onChange={handleChange}
                    className={inputClass('assignedTo')}
                  >
                    <option value="">Select employee</option>
                    {USERS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Order Tag">
                  <select
                    name="tag"
                    value={form.tag}
                    onChange={handleChange}
                    className={inputClass('tag')}
                  >
                    <option value="Flexible">Flexible</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </Field>
                <Field label="Due Date & Time" required error={errors.dueDate}>
                  <input
                    type="datetime-local"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={handleChange}
                    className={inputClass('dueDate')}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg text-sm font-bold active:scale-[0.98] transition-all shadow-md shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving…' : 'Save Order / Query'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 bg-slate-100 text-slate-700 py-3 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-1 h-5 bg-red-600 rounded-full" />
        <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-black">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function ChargeModeOption({ active, onClick, title, subtitle }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border-2 px-3 py-2.5 transition-all ${
        active
          ? 'border-red-500 bg-red-50/60'
          : 'border-slate-200 hover:border-slate-300 bg-white'
      }`}
    >
      <p className={`text-xs font-extrabold ${active ? 'text-red-700' : 'text-black'}`}>
        {title}
      </p>
      <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
    </button>
  );
}

function QuickChip({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border border-slate-200 text-slate-600 hover:border-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
        {hint && (
          <span className="ml-1.5 text-[10px] font-bold text-slate-400 normal-case tracking-normal">
            ({hint})
          </span>
        )}
      </label>
      {children}
      {error && <p className="text-red-600 text-xs mt-1.5 font-semibold">{error}</p>}
    </div>
  );
}

export default CreateOrderPage;
