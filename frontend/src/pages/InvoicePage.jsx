import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft, AlertTriangle } from 'lucide-react';
import { orderService } from '../services/api';
import logo from '../public/images/logo.png';

const BUSINESS = {
  name: 'Surrey Quays Photo Studio Ltd',
  addressLines: ['142 Lower Road', 'London SE16 2UG', 'United Kingdom'],
  phone: '+44 7458 095918',
  email: 'surreyquaysphotostudio@gmail.com',
  website: 'surreyquaysphotostudio.com',
  vatNumber: '',
};

const BANK = {
  accountName: 'Surrey Quays Photo Studio Ltd',
  accountNumber: '73928195',
  sortCode: '40-06-21',
};

const VAT_RATE = 0.2;

const fmt = (n) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(n) || 0);

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

function InvoicePage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    orderService
      .getOrderById(orderId)
      .then((res) => {
        if (!cancelled) setOrder(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-red-600 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-black">Could not load invoice</h2>
          <p className="text-sm text-slate-500 mt-1">{error || 'Order not found.'}</p>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-black text-white rounded-lg text-sm font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const gross = Number(order.price) || 0;
  const net = +(gross / (1 + VAT_RATE)).toFixed(2);
  const vat = +(gross - net).toFixed(2);

  const isPaid = order.priceStatus === 'Paid';
  const advance = isPaid ? gross : Number(order.advancePaid) || 0;
  const balance = +Math.max(gross - advance, 0).toFixed(2);

  const issueDate = order.createdAt || new Date();
  const invoiceNumber = order.invoiceNumber || `INV-${String(order._id).slice(-8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white print:min-h-0">
      {/* Toolbar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-black"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-red-900/20"
          >
            <Printer className="w-4 h-4" />
            Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice sheet */}
      <div className="max-w-[900px] mx-auto p-4 sm:p-8 print:p-0 print:max-w-none">
        <div className="invoice-sheet bg-white shadow-lg print:shadow-none border border-slate-200 print:border-0 rounded-xl print:rounded-none overflow-hidden flex flex-col min-h-[277mm]">
          {/* Header — logo + info (top left), VAT INVOICE + status (top right) */}
          <div className="px-8 sm:px-10 pt-6 pb-5 border-b-2 border-red-600">
            <div className="flex items-start justify-between gap-6">
              {/* Top left: logo with name + info underneath */}
              <div className="flex-1 min-w-0">
                <img
                  src={logo}
                  alt="Surrey Quays Photo Studio"
                  className="h-16 sm:h-20 object-contain -ml-1"
                />
                <h2 className="text-base sm:text-lg font-extrabold text-black tracking-tight leading-tight mt-1">
                  {BUSINESS.name}
                </h2>
                <div className="text-[11px] text-slate-700 mt-0.5 leading-snug">
                  {BUSINESS.addressLines.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </div>
                <div className="text-[11px] text-slate-700 mt-1 leading-snug">
                  <p className="font-bold text-black">{BUSINESS.phone}</p>
                  <p className="font-bold text-black">{BUSINESS.email}</p>
                  {BUSINESS.vatNumber && (
                    <p className="text-slate-500">VAT No: {BUSINESS.vatNumber}</p>
                  )}
                </div>
              </div>

              {/* Top right: VAT INVOICE + United Kingdom + status */}
              <div className="text-right shrink-0">
                <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-none">
                  VAT INVOICE
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-600 mt-1">
                  United Kingdom
                </p>
                <span
                  className={`inline-block mt-2.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${
                    isPaid
                      ? 'bg-black text-white'
                      : balance < gross
                      ? 'bg-amber-500 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {isPaid ? 'Paid in Full' : balance < gross ? 'Partial Paid' : 'Unpaid'}
                </span>
              </div>
            </div>
          </div>

          {/* Bill To + Invoice meta */}
          <div className="px-8 sm:px-10 py-4 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-200">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400 mb-2">
                Bill To
              </p>
              <p className="text-sm font-extrabold text-black">{order.customerName}</p>
              <p className="text-xs text-slate-700 mt-0.5">{order.customerPhone}</p>
              <p className="text-xs text-slate-700">{order.customerEmail}</p>
            </div>

            <div className="sm:text-right">
              <MetaRow label="Invoice No." value={invoiceNumber} />
              <MetaRow label="Issue Date" value={formatDate(issueDate)} />
              <MetaRow label="Due Date" value={formatDate(order.dueDate)} />
              <MetaRow
                label="Tag"
                value={order.tag}
                valueClass={
                  order.tag === 'Emergency'
                    ? 'text-red-600 font-extrabold'
                    : 'text-black font-bold'
                }
              />
            </div>
          </div>

          {/* Line items */}
          <div className="px-8 sm:px-10 py-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 border-b-2 border-black">
                  <th className="text-left py-2 pr-3">Description</th>
                  <th className="text-center py-2 px-3 w-14">Qty</th>
                  <th className="text-right py-2 px-3 w-24">Net Price</th>
                  <th className="text-right py-2 px-3 w-16">VAT</th>
                  <th className="text-right py-2 pl-3 w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 align-top">
                  <td className="py-2.5 pr-3">
                    <p className="text-sm font-bold text-black leading-tight">{order.title}</p>
                    {order.description && (
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug whitespace-pre-line">
                        {order.description}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center text-xs text-slate-700">1</td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-800">{fmt(net)}</td>
                  <td className="py-2.5 px-3 text-right text-xs text-slate-700">
                    {Math.round(VAT_RATE * 100)}%
                  </td>
                  <td className="py-2.5 pl-3 text-right font-mono text-sm font-bold text-black">
                    {fmt(gross)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-3 flex justify-end">
              <div className="w-full sm:w-72 text-xs">
                <TotalRow label="Subtotal (excl. VAT)" value={fmt(net)} />
                <TotalRow label={`VAT @ ${Math.round(VAT_RATE * 100)}%`} value={fmt(vat)} />
                <div className="flex items-center justify-between py-2 px-3 mt-1.5 bg-black text-white rounded-md">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Total</span>
                  <span className="font-mono text-sm font-extrabold">{fmt(gross)}</span>
                </div>
                <div className="mt-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Advance Paid
                  </span>
                  <span className="font-mono text-xs font-extrabold text-black">
                    {fmt(advance)}
                  </span>
                </div>
                <div
                  className={`mt-1.5 px-3 py-1.5 rounded-md flex items-center justify-between ${
                    balance > 0
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-emerald-50 border border-emerald-200'
                  }`}
                >
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider ${
                      balance > 0 ? 'text-red-700' : 'text-emerald-700'
                    }`}
                  >
                    Balance Due
                  </span>
                  <span
                    className={`font-mono text-xs font-extrabold ${
                      balance > 0 ? 'text-red-700' : 'text-emerald-700'
                    }`}
                  >
                    {fmt(balance)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer block — always pinned to bottom of A4 */}
          <div className="mt-auto">
          <div className="px-8 sm:px-10 py-4 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-200 bg-slate-50/60">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400 mb-1.5">
                Bank Details
              </p>
              <div className="space-y-0.5 text-xs">
                <Detail label="Account Name" value={BANK.accountName} />
                <Detail label="Account Number" value={BANK.accountNumber} mono />
                <Detail label="Sort Code" value={BANK.sortCode} mono />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400 mb-1.5">
                Terms & Policy
              </p>
              <ul className="text-[11px] text-slate-700 space-y-0.5 leading-snug">
                <li className="flex gap-1.5">
                  <span className="text-red-600 font-bold">•</span>
                  <span>
                    <strong className="text-black">50% advance</strong> required to confirm the
                    booking.
                  </span>
                </li>
                <li className="flex gap-1.5">
                  <span className="text-red-600 font-bold">•</span>
                  <span>
                    All payments are <strong className="text-black">non-refundable</strong>.
                  </span>
                </li>
                <li className="flex gap-1.5">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Balance is due on or before the agreed due date.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Internal note */}
          <div className="px-8 sm:px-10 py-2 border-t border-slate-200 flex flex-wrap gap-x-5 gap-y-0.5 text-[11px] text-slate-600">
            <span>
              <span className="font-bold text-slate-400 mr-1">Order by:</span>
              <span className="font-bold text-black">{order.orderBy}</span>
            </span>
            <span>
              <span className="font-bold text-slate-400 mr-1">Assigned to:</span>
              <span className="font-bold text-black">{order.assignedTo}</span>
            </span>
          </div>

          {/* Footer with website */}
          <div className="px-8 sm:px-10 py-3 bg-black text-white text-center">
            <p className="text-xs">
              Thank you for choosing{' '}
              <span className="font-extrabold">Surrey Quays Photo Studio</span>.
            </p>
            <a
              href={`https://${BUSINESS.website}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-0.5 text-[11px] font-bold tracking-wider text-red-400 hover:text-red-300"
            >
              {BUSINESS.website}
            </a>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value, valueClass = 'text-black font-bold' }) {
  return (
    <div className="flex sm:justify-end items-baseline gap-3 py-0">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>
      <span className={`text-xs ${valueClass}`}>{value}</span>
    </div>
  );
}

function TotalRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 px-3">
      <span className="text-slate-600">{label}</span>
      <span className="font-mono text-slate-800">{value}</span>
    </div>
  );
}

function Detail({ label, value, mono }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-32 shrink-0">
        {label}
      </span>
      <span className={`text-sm font-bold text-black ${mono ? 'font-mono tracking-wide' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export default InvoicePage;
