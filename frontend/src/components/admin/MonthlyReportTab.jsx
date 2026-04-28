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
  Building2,
  ChevronDown,
  ChevronRight,
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

// Stable key for grouping suppliers (case-insensitive, trimmed). Empty names
// are bucketed as "unnamed" rather than collapsed together.
const supplierKey = (name, fallback) =>
  (name || '').trim().toLowerCase() || `__unnamed__${fallback}`;

function MonthlyReportTab() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [report, setReport] = useState(emptyReport(year, month));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadTargetKey, setUploadTargetKey] = useState(null);
  const [collapsed, setCollapsed] = useState({});
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
          pdfUrl: e.pdfUrl || '',
          pdfKey: e.pdfKey || '',
        })),
      });
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

  // Group expenses by supplier. We keep the original index on each invoice
  // so we can update/remove rows in the flat backend array.
  const supplierGroups = useMemo(() => {
    const groups = new Map();
    report.expenses.forEach((e, idx) => {
      const key = supplierKey(e.companyName, idx);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          companyName: e.companyName || '',
          invoices: [],
        });
      }
      groups.get(key).invoices.push({ ...e, _index: idx });
    });
    return Array.from(groups.values()).map((g) => ({
      ...g,
      total: g.invoices.reduce((s, inv) => s + num(inv.totalAmount), 0),
      due: g.invoices
        .filter((inv) => inv.status !== 'Paid')
        .reduce((s, inv) => s + num(inv.totalAmount), 0),
    }));
  }, [report.expenses]);

  const setField = (path, value) => {
    setReport((r) => {
      const next = { ...r };
      if (path[0] === 'categoryIncome') {
        next.categoryIncome = { ...r.categoryIncome, [path[1]]: value };
      } else {
        next[path[0]] = value;
      }
      return next;
    });
  };

  const addSupplier = () => {
    setReport((r) => ({
      ...r,
      expenses: [
        ...r.expenses,
        { companyName: '', invoiceNumber: '', totalAmount: 0, status: 'Unpaid' },
      ],
    }));
  };

  const addInvoiceToSupplier = (companyName) => {
    setReport((r) => ({
      ...r,
      expenses: [
        ...r.expenses,
        {
          companyName: companyName || '',
          invoiceNumber: '',
          totalAmount: 0,
          status: 'Unpaid',
        },
      ],
    }));
  };

  const renameSupplier = (groupKey, newName) => {
    setReport((r) => ({
      ...r,
      expenses: r.expenses.map((e, idx) =>
        supplierKey(e.companyName, idx) === groupKey
          ? { ...e, companyName: newName }
          : e
      ),
    }));
  };

  const handleUploadInvoice = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');
    const targetCompany = uploadTargetKey
      ? supplierGroups.find((g) => g.key === uploadTargetKey)?.companyName
      : '';
    try {
      const res = await expenseService.uploadInvoice(file);
      const e = res.data;
      setReport((r) => ({
        ...r,
        expenses: [
          ...r.expenses,
          {
            companyName: targetCompany || e.companyName || '',
            invoiceNumber: e.invoiceNumber || '',
            totalAmount: num(e.totalAmount),
            status: 'Unpaid',
            invoiceDate: e.invoiceDate || null,
            pdfUrl: e.pdfUrl || '',
            pdfKey: e.pdfKey || '',
          },
        ],
      }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadTargetKey(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (groupKey = null) => {
    setUploadTargetKey(groupKey);
    fileInputRef.current?.click();
  };

  const updateExpense = (index, key, value) => {
    setReport((r) => ({
      ...r,
      expenses: r.expenses.map((e, i) => (i === index ? { ...e, [key]: value } : e)),
    }));
  };

  const removeExpense = (index) => {
    setReport((r) => {
      const target = r.expenses[index];
      if (target?.pdfKey) {
        expenseService.deleteFile(target.pdfKey).catch(() => {});
      }
      return { ...r, expenses: r.expenses.filter((_, i) => i !== index) };
    });
  };

  const removeSupplier = (groupKey) => {
    setReport((r) => {
      const survivors = [];
      r.expenses.forEach((e, idx) => {
        if (supplierKey(e.companyName, idx) === groupKey) {
          if (e.pdfKey) expenseService.deleteFile(e.pdfKey).catch(() => {});
        } else {
          survivors.push(e);
        }
      });
      return { ...r, expenses: survivors };
    });
  };

  const toggleCollapsed = (groupKey) => {
    setCollapsed((c) => ({ ...c, [groupKey]: !c[groupKey] }));
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
          pdfUrl: e.pdfUrl || '',
          pdfKey: e.pdfKey || '',
        })),
      });
      setSavedAt(new Date());
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
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
          {savedAt && (
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

            {/* Expenses — grouped by supplier on screen, but the print view
                falls back to the flat invoice table so the PDF/printed report
                keeps the original structure. */}
            <Section title="Expenses">
              {/* On-screen grouped view */}
              <div className="print:hidden">
                {supplierGroups.length === 0 ? (
                  <p className="py-6 text-center text-slate-400 italic text-sm">
                    No suppliers added yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {supplierGroups.map((group) => (
                      <SupplierCard
                        key={group.key}
                        group={group}
                        collapsed={!!collapsed[group.key]}
                        onToggle={() => toggleCollapsed(group.key)}
                        onRename={(name) => renameSupplier(group.key, name)}
                        onAddInvoice={() => addInvoiceToSupplier(group.companyName)}
                        onUploadInvoice={() => triggerUpload(group.key)}
                        onUpdateExpense={updateExpense}
                        onRemoveInvoice={removeExpense}
                        onRemoveSupplier={() => removeSupplier(group.key)}
                        uploading={uploading && uploadTargetKey === group.key}
                      />
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => triggerUpload(null)}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-black text-white hover:bg-slate-800 px-3 py-1.5 rounded-md disabled:opacity-60"
                  >
                    {uploading && uploadTargetKey === null ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {uploading && uploadTargetKey === null
                      ? 'Reading invoice…'
                      : 'Upload Invoice (new supplier)'}
                  </button>
                  <button
                    onClick={addSupplier}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Supplier Manually
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => handleUploadInvoice(e.target.files?.[0])}
                />
              </div>

              {/* Print-only flat table — preserves the original report layout */}
              <div className="hidden print:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b-2 border-slate-200">
                      <th className="py-2 pr-2 font-bold">Company Name</th>
                      <th className="py-2 px-2 font-bold">Invoice No.</th>
                      <th className="py-2 px-2 font-bold text-right">Total (£)</th>
                      <th className="py-2 px-2 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.expenses.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                          No expenses added yet.
                        </td>
                      </tr>
                    ) : (
                      report.expenses.map((e, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-2 pr-2">{e.companyName}</td>
                          <td className="py-2 px-2">{e.invoiceNumber || '—'}</td>
                          <td className="py-2 px-2 text-right font-mono">
                            £{num(e.totalAmount).toFixed(2)}
                          </td>
                          <td
                            className={`py-2 px-2 font-bold ${
                              e.status === 'Paid'
                                ? 'text-emerald-700'
                                : 'text-red-700'
                            }`}
                          >
                            {e.status || 'Unpaid'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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

function SupplierCard({
  group,
  collapsed,
  onToggle,
  onRename,
  onAddInvoice,
  onUploadInvoice,
  onUpdateExpense,
  onRemoveInvoice,
  onRemoveSupplier,
  uploading,
}) {
  const count = group.invoices.length;
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-b border-slate-200">
        <button
          onClick={onToggle}
          className="text-slate-400 hover:text-black"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
        <input
          value={group.companyName}
          onChange={(e) => onRename(e.target.value)}
          placeholder="Supplier name"
          className="flex-1 min-w-0 bg-transparent text-sm font-extrabold text-black focus:outline-none focus:bg-white focus:px-2 focus:py-0.5 focus:rounded focus:ring-2 focus:ring-red-200"
        />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {count} invoice{count !== 1 ? 's' : ''}
        </span>
        <span className="text-xs font-extrabold font-mono text-black ml-2">
          £{group.total.toFixed(2)}
        </span>
        {group.due > 0 && (
          <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
            £{group.due.toFixed(2)} due
          </span>
        )}
        <button
          onClick={onRemoveSupplier}
          className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
          title="Remove supplier (deletes all its invoices)"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {!collapsed && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-2 px-3 font-bold">Invoice No.</th>
                  <th className="py-2 px-3 font-bold text-right">Total (£)</th>
                  <th className="py-2 px-3 font-bold">Status</th>
                  <th className="py-2 px-3 font-bold">PDF</th>
                  <th className="py-2 px-3 font-bold w-8" />
                </tr>
              </thead>
              <tbody>
                {group.invoices.map((inv) => (
                  <tr key={inv._index} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 px-3">
                      <CellInput
                        value={inv.invoiceNumber}
                        onChange={(v) => onUpdateExpense(inv._index, 'invoiceNumber', v)}
                        placeholder="INV-…"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <CellInput
                        type="number"
                        value={inv.totalAmount}
                        onChange={(v) => onUpdateExpense(inv._index, 'totalAmount', v)}
                        align="right"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={inv.status}
                        onChange={(ev) =>
                          onUpdateExpense(inv._index, 'status', ev.target.value)
                        }
                        className={`text-xs font-bold rounded-md px-2 py-1 border-2 ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      {inv.pdfUrl ? (
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 hover:text-red-700 px-1.5 py-0.5 rounded bg-red-50 border border-red-100"
                        >
                          <FileText className="w-3 h-3" />
                          View
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => onRemoveInvoice(inv._index)}
                        className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
                        title="Remove invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50/50 border-t border-slate-100">
            <button
              onClick={onUploadInvoice}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-black hover:text-red-600 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              {uploading ? 'Reading…' : 'Upload Another Invoice'}
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={onAddInvoice}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-600 hover:text-red-700"
            >
              <Plus className="w-3 h-3" />
              Add Invoice Manually
            </button>
          </div>
        </div>
      )}
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
