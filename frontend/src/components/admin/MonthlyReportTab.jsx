import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Printer,
  Save,
  Trash2,
  AlertTriangle,
  Upload,
  FileText,
  Loader2,
  FileDown,
} from 'lucide-react';
import { monthlyReportService, expenseService, bundlePdfUrl } from '../../services/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const COMPANY_NAME = 'Surrey Quays Photo Studio Ltd.';

const emptyReport = (year, month) => ({
  year,
  month,
  shopTillIncome: 0,
  insideTillIncome: 0,
  categoryIncome: { stationary: 0, photolab: 0, photocopies: 0, lottery: 0 },
  expenses: [],
});

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Old reports stored a single pdfUrl/pdfKey directly on the expense. Treat
// that as a one-element attachments array so the rest of the UI sees one shape.
const normaliseAttachments = (e) => {
  if (Array.isArray(e.attachments) && e.attachments.length > 0) {
    return e.attachments.map((a) => ({
      pdfUrl: a.pdfUrl || '',
      pdfKey: a.pdfKey || '',
    }));
  }
  if (e.pdfKey || e.pdfUrl) {
    return [{ pdfUrl: e.pdfUrl || '', pdfKey: e.pdfKey || '' }];
  }
  return [];
};

function MonthlyReportTab() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [report, setReport] = useState(emptyReport(year, month));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const load = async (y, m) => {
    setLoading(true);
    setError('');
    try {
      const res = await monthlyReportService.get(y, m);
      const r = res.data || emptyReport(y, m);
      setReport({
        year: r.year || y,
        month: r.month || m,
        shopTillIncome: r.shopTillIncome || 0,
        insideTillIncome: r.insideTillIncome || 0,
        categoryIncome: {
          stationary: r.categoryIncome?.stationary || 0,
          photolab: r.categoryIncome?.photolab || 0,
          photocopies: r.categoryIncome?.photocopies || 0,
          lottery: r.categoryIncome?.lottery || 0,
        },
        expenses: (r.expenses || []).map((e) => ({
          companyName: e.companyName || '',
          invoiceNumber: e.invoiceNumber || '',
          totalAmount: e.totalAmount || 0,
          status: e.status || 'Unpaid',
          invoiceDate: e.invoiceDate || null,
          attachments: normaliseAttachments(e),
        })),
      });
      setDirty(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(year, month);
  }, [year, month]);

  const totals = useMemo(() => {
    const totalIncome =
      num(report.shopTillIncome) + num(report.insideTillIncome);
    const totalExpense = report.expenses.reduce(
      (sum, e) => sum + num(e.totalAmount),
      0
    );
    const totalDue = report.expenses
      .filter((e) => e.status === 'Unpaid')
      .reduce((sum, e) => sum + num(e.totalAmount), 0);
    const totalPaid = totalExpense - totalDue;
    return { totalIncome, totalExpense, totalDue, totalPaid };
  }, [report]);

  // Mutate report state and mark dirty in one shot.
  const mutate = (fn) => {
    setReport((r) => fn(r));
    setDirty(true);
  };

  const setField = (path, value) => {
    mutate((r) => {
      const next = { ...r };
      if (path[0] === 'categoryIncome') {
        next.categoryIncome = { ...r.categoryIncome, [path[1]]: value };
      } else {
        next[path[0]] = value;
      }
      return next;
    });
  };

  const addExpense = () => {
    mutate((r) => ({
      ...r,
      expenses: [
        ...r.expenses,
        {
          companyName: '',
          invoiceNumber: '',
          totalAmount: 0,
          status: 'Unpaid',
          attachments: [],
        },
      ],
    }));
  };

  const handleUploadInvoices = async (fileList) => {
    const files = Array.from(fileList || []).filter(Boolean);
    if (files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const results = await Promise.all(
        files.map((f) => expenseService.uploadInvoice(f).then((r) => r.data))
      );
      const first = results[0] || {};
      const totalAmount = results.reduce((s, r) => s + num(r.totalAmount), 0);
      const attachments = results.map((r) => ({
        pdfUrl: r.pdfUrl || '',
        pdfKey: r.pdfKey || '',
      }));
      mutate((r) => ({
        ...r,
        expenses: [
          ...r.expenses,
          {
            companyName: first.companyName || '',
            invoiceNumber: '',
            totalAmount,
            status: 'Unpaid',
            invoiceDate: first.invoiceDate || null,
            attachments,
          },
        ],
      }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateExpense = (index, key, value) => {
    mutate((r) => ({
      ...r,
      expenses: r.expenses.map((e, i) => (i === index ? { ...e, [key]: value } : e)),
    }));
  };

  const removeExpense = (index) => {
    mutate((r) => {
      const target = r.expenses[index];
      target?.attachments?.forEach((a) => {
        if (a.pdfKey) expenseService.deleteFile(a.pdfKey).catch(() => {});
      });
      return { ...r, expenses: r.expenses.filter((_, i) => i !== index) };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await monthlyReportService.save(year, month, {
        shopTillIncome: num(report.shopTillIncome),
        insideTillIncome: num(report.insideTillIncome),
        categoryIncome: {
          stationary: num(report.categoryIncome.stationary),
          photolab: num(report.categoryIncome.photolab),
          photocopies: num(report.categoryIncome.photocopies),
          lottery: num(report.categoryIncome.lottery),
        },
        expenses: report.expenses.map((e) => ({
          companyName: e.companyName,
          invoiceNumber: e.invoiceNumber,
          totalAmount: num(e.totalAmount),
          status: e.status,
          invoiceDate: e.invoiceDate || undefined,
          attachments: e.attachments,
          // Mirror the first attachment onto the legacy fields so any older
          // reader keeps working.
          pdfUrl: e.attachments[0]?.pdfUrl || '',
          pdfKey: e.attachments[0]?.pdfKey || '',
        })),
      });
      setSavedAt(new Date());
      setDirty(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrintWithInvoices = async (e) => {
    if (dirty) {
      e.preventDefault();
      const ok = window.confirm(
        'You have unsaved changes. Save now so the bundled PDF includes them?'
      );
      if (ok) {
        await handleSave();
      }
      window.open(bundlePdfUrl(year, month), '_blank');
    }
  };

  const yearOptions = useMemo(() => {
    const current = today.getFullYear();
    const arr = [];
    for (let y = current + 1; y >= current - 5; y--) arr.push(y);
    return arr;
  }, [today]);

  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div>
      {/* Toolbar — hidden on print */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5 print:hidden">
        <div className="flex gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-lg border-2 border-slate-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:border-red-400"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border-2 border-slate-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:border-red-400"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {dirty && (
            <span className="text-xs font-bold text-red-600 mr-1">
              Unsaved changes
            </span>
          )}
          {!dirty && savedAt && (
            <span className="text-xs text-slate-400 mr-1">
              Saved {savedAt.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 bg-black hover:bg-slate-800 text-white text-sm font-bold px-4 py-2.5 rounded-lg disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Report'}
          </button>
          <a
            href={bundlePdfUrl(year, month)}
            target="_blank"
            rel="noreferrer"
            onClick={handlePrintWithInvoices}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-md shadow-red-900/20"
            title="Opens a single PDF with the report and every uploaded invoice"
          >
            <FileDown className="w-4 h-4" />
            Print with Invoices
          </a>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-black border-2 border-slate-200 text-sm font-bold px-4 py-2.5 rounded-lg"
            title="Print just the on-screen report"
          >
            <Printer className="w-4 h-4" />
            Print Report Only
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm print:hidden">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* A4 sheet */}
      <div className="report-sheet bg-white border border-slate-200 rounded-xl shadow-sm p-8 print:p-10 print:shadow-none print:border-0 print:rounded-none">
        <header className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-extrabold text-black tracking-tight">
            {COMPANY_NAME}
          </h1>
          <p className="text-base font-bold text-red-600 mt-1 uppercase tracking-wider">
            Monthly Report — {monthLabel}
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-14">
            <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-red-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Income totals */}
            <Section title="Total Income">
              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  label="Shop Till"
                  value={report.shopTillIncome}
                  onChange={(v) => setField(['shopTillIncome'], v)}
                />
                <NumberField
                  label="Inside Till"
                  value={report.insideTillIncome}
                  onChange={(v) => setField(['insideTillIncome'], v)}
                />
              </div>
              <div className="mt-3 flex justify-between items-center bg-black text-white rounded-lg px-4 py-3">
                <span className="text-sm font-bold uppercase tracking-wider">
                  Monthly Total Income
                </span>
                <span className="text-lg font-extrabold font-mono">
                  £{totals.totalIncome.toFixed(2)}
                </span>
              </div>
            </Section>

            {/* Category income */}
            <Section title="Category-wise Income">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <NumberField
                  label="Stationary"
                  value={report.categoryIncome.stationary}
                  onChange={(v) => setField(['categoryIncome', 'stationary'], v)}
                />
                <NumberField
                  label="Photolab"
                  value={report.categoryIncome.photolab}
                  onChange={(v) => setField(['categoryIncome', 'photolab'], v)}
                />
                <NumberField
                  label="Photocopies"
                  value={report.categoryIncome.photocopies}
                  onChange={(v) => setField(['categoryIncome', 'photocopies'], v)}
                />
                <NumberField
                  label="Lottery / Scratch Card"
                  value={report.categoryIncome.lottery}
                  onChange={(v) => setField(['categoryIncome', 'lottery'], v)}
                />
              </div>
            </Section>

            {/* Expenses */}
            <Section title="Expenses">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b-2 border-slate-200">
                      <th className="py-2 pr-2 font-bold">Company Name</th>
                      <th className="py-2 px-2 font-bold">Invoice No.</th>
                      <th className="py-2 px-2 font-bold text-right">Total (£)</th>
                      <th className="py-2 px-2 font-bold">Status</th>
                      <th className="py-2 pl-2 font-bold print:hidden" />
                    </tr>
                  </thead>
                  <tbody>
                    {report.expenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                          No expenses added yet.
                        </td>
                      </tr>
                    ) : (
                      report.expenses.map((e, i) => {
                        const attCount = e.attachments?.length || 0;
                        return (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="py-2 pr-2">
                              <div className="flex items-center gap-1">
                                <CellInput
                                  value={e.companyName}
                                  onChange={(v) => updateExpense(i, 'companyName', v)}
                                  placeholder="Supplier"
                                />
                                {e.attachments?.[0]?.pdfUrl && (
                                  <a
                                    href={e.attachments[0].pdfUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 hover:text-red-700 px-1.5 py-0.5 rounded bg-red-50 border border-red-100 print:hidden"
                                    title={
                                      attCount > 1
                                        ? `${attCount} PDFs attached — opens the first`
                                        : 'Open uploaded invoice'
                                    }
                                  >
                                    <FileText className="w-3 h-3" />
                                    PDF{attCount > 1 ? `×${attCount}` : ''}
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-2">
                              {attCount > 0 ? (
                                <span
                                  className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-2 rounded-full bg-black text-white text-xs font-extrabold"
                                  title={`${attCount} invoice${attCount > 1 ? 's' : ''} attached`}
                                >
                                  {attCount}
                                </span>
                              ) : (
                                <CellInput
                                  value={e.invoiceNumber}
                                  onChange={(v) => updateExpense(i, 'invoiceNumber', v)}
                                  placeholder="INV-…"
                                />
                              )}
                            </td>
                            <td className="py-2 px-2">
                              <CellInput
                                type="number"
                                value={e.totalAmount}
                                onChange={(v) => updateExpense(i, 'totalAmount', v)}
                                align="right"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <select
                                value={e.status}
                                onChange={(ev) => updateExpense(i, 'status', ev.target.value)}
                                className={`text-xs font-bold rounded-md px-2 py-1 border-2 print:border-0 print:bg-transparent ${
                                  e.status === 'Paid'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-red-50 border-red-200 text-red-700'
                                }`}
                              >
                                <option value="Unpaid">Unpaid</option>
                                <option value="Paid">Paid</option>
                              </select>
                            </td>
                            <td className="py-2 pl-2 print:hidden">
                              <button
                                onClick={() => removeExpense(i)}
                                className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center gap-3 print:hidden">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-black text-white hover:bg-slate-800 px-3 py-1.5 rounded-md disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {uploading ? 'Reading invoices…' : 'Upload Invoice (PDF / image)'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUploadInvoices(e.target.files)}
                />
                <button
                  onClick={addExpense}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Manually
                </button>
                <span className="text-[11px] text-slate-400">
                  Tip: select multiple files at once for the same supplier.
                </span>
              </div>
            </Section>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <SummaryCard label="Total Expense" value={totals.totalExpense} tone="black" />
              <SummaryCard label="Paid" value={totals.totalPaid} tone="green" />
              <SummaryCard label="Due" value={totals.totalDue} tone="red" />
            </div>

            <footer className="mt-8 pt-4 border-t border-slate-200 text-[11px] text-slate-400 flex justify-between print:text-slate-500">
              <span>{COMPANY_NAME}</span>
              <span>Generated {new Date().toLocaleDateString()}</span>
            </footer>
          </>
        )}
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { background: white; }
          .report-sheet { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1 h-4 bg-red-600 rounded-full" />
        <h3 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-black">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 print:bg-white print:border-slate-300">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <div className="flex items-center gap-1">
        <span className="text-slate-500 font-bold">£</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value === 0 ? '' : value}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          placeholder="0.00"
          className="w-full bg-transparent text-base font-extrabold font-mono text-black focus:outline-none print:appearance-none"
        />
      </div>
    </div>
  );
}

function CellInput({ value, onChange, type = 'text', align = 'left', placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) =>
        onChange(type === 'number' ? (e.target.value === '' ? 0 : Number(e.target.value)) : e.target.value)
      }
      placeholder={placeholder}
      step={type === 'number' ? '0.01' : undefined}
      min={type === 'number' ? '0' : undefined}
      className={`w-full bg-transparent text-sm focus:outline-none focus:bg-red-50/40 rounded px-1 py-0.5 print:focus:bg-transparent text-${align}`}
    />
  );
}

function SummaryCard({ label, value, tone }) {
  const tones = {
    black: 'bg-black text-white border-black',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`rounded-lg border-2 p-3 ${tones[tone]}`}>
      <p
        className={`text-[10px] font-extrabold uppercase tracking-wider mb-1 ${
          tone === 'black' ? 'text-white/70' : 'opacity-70'
        }`}
      >
        {label}
      </p>
      <p className="text-base font-extrabold font-mono">£{num(value).toFixed(2)}</p>
    </div>
  );
}

export default MonthlyReportTab;
