import { useState, useEffect } from 'react';
import { Printer, MessageSquare, User, Phone, Mail, CreditCard, Copy, Check, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import StatusPill from './StatusPill';
import useOrderStore from '../store/orderStore';
import { formatDateTime, formatDate } from '../lib/utils';

function OrderDetailModal({ order, open, onClose }) {
  const { updateOrderStatus, deleteOrder } = useOrderStore();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentEditing, setCommentEditing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    if (open) {
      setCommentText(order?.comment || '');
      setCommentEditing(false);
      setConfirmDelete(false);
    }
  }, [open, order?._id, order?.comment]);

  if (!order) return null;

  const toggleStatus = async () => {
    const newStatus = order.status === 'Completed' ? 'Not Completed' : 'Completed';
    await updateOrderStatus(order._id, { status: newStatus });
    onClose();
  };

  const togglePayment = async () => {
    const newStatus = order.priceStatus === 'Paid' ? 'Unpaid' : 'Paid';
    await updateOrderStatus(order._id, { priceStatus: newStatus });
    onClose();
  };

  const saveComment = async () => {
    setSavingComment(true);
    await updateOrderStatus(order._id, { comment: commentText.trim() });
    setSavingComment(false);
    setCommentEditing(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    await deleteOrder(order._id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl max-h-[90vh] flex flex-col gap-0">
        <div className="bg-black px-6 py-5 border-b-4 border-red-600 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <StatusPill type="tag" value={order.tag} />
          </div>
          <DialogTitle className="text-lg font-extrabold text-white tracking-tight">
            {order.title}
          </DialogTitle>
          <DialogDescription className="text-white/60 text-sm mt-1">
            {order.description}
          </DialogDescription>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
          {/* Customer info */}
          <div className="bg-red-50/60 border border-red-100 rounded-lg p-3 mb-3">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1.5">
              Customer
            </p>
            <p className="flex items-center gap-1.5 text-sm font-extrabold text-black">
              <User className="w-3.5 h-3.5 text-slate-500" />
              {order.customerName || '—'}
            </p>
            {order.customerPhone && (
              <p className="flex items-center gap-1.5 text-xs text-slate-700 mt-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <a
                  href={`tel:${order.customerPhone}`}
                  className="hover:text-red-600"
                >
                  {order.customerPhone}
                </a>
                <a
                  href={`https://wa.me/${order.customerPhone.replace(/\D/g, '').replace(/^0/, '44')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.828L.057 23.428a.5.5 0 0 0 .609.61l5.7-1.498A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.66-.502-5.193-1.378l-.372-.217-3.849 1.01 1.025-3.737-.235-.386A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                  WhatsApp
                </a>
              </p>
            )}
            {order.customerEmail && (
              <p className="flex items-center gap-1.5 text-xs text-slate-700 mt-0.5 break-all">
                <Mail className="w-3 h-3 text-slate-400" />
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="hover:text-red-600"
                >
                  {order.customerEmail}
                </a>
              </p>
            )}
          </div>

          {(() => {
            const total = Number(order.price) || 0;
            const advance =
              order.priceStatus === 'Paid' ? total : Number(order.advancePaid) || 0;
            const due = Math.max(total - advance, 0);
            return (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DetailCard label="Assigned To" value={order.assignedTo} />
                  <DetailCard label="Order By" value={order.orderBy} />
                  <DetailCard label="Due Date" value={formatDateTime(order.dueDate)} />
                  <DetailCard label="Created" value={formatDate(order.createdAt)} />
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Payment
                    </p>
                    <StatusPill type="priceStatus" value={order.priceStatus} />
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Completion
                    </p>
                    <StatusPill type="status" value={order.status} />
                  </div>
                </div>

                {/* Money summary */}
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <MoneyCard label="Total" value={`£${total.toFixed(2)}`} tone="black" />
                  <MoneyCard label="Advance" value={`£${advance.toFixed(2)}`} tone="slate" />
                  <MoneyCard
                    label="Due Amount"
                    value={`£${due.toFixed(2)}`}
                    tone={due > 0 ? 'red' : 'green'}
                  />
                </div>
              </>
            );
          })()}

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" />
                Comment
              </p>
              {!commentEditing && (
                <button
                  onClick={() => setCommentEditing(true)}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 uppercase tracking-wider"
                >
                  {order.comment ? 'Edit' : 'Add Reason'}
                </button>
              )}
            </div>

            {commentEditing ? (
              <div className="space-y-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  placeholder="Explain why this order isn't complete…"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCommentText(order.comment || '');
                      setCommentEditing(false);
                    }}
                    disabled={savingComment}
                    className="flex-1 text-xs font-bold py-2 rounded-lg border-2 border-slate-200 text-slate-700 hover:border-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveComment}
                    disabled={savingComment}
                    className="flex-1 text-xs font-bold py-2 rounded-lg bg-black text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {savingComment ? 'Saving…' : 'Save Comment'}
                  </button>
                </div>
              </div>
            ) : order.comment ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-slate-800 whitespace-pre-wrap">
                {order.comment}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No comment yet.</p>
            )}
          </div>

          {(order.stripeFullPaymentUrl || order.stripeBalancePaymentUrl) && (
            <div className="mt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3 h-3" />
                Stripe Payment Links
              </p>
              <div className="space-y-2">
                {order.stripeFullPaymentUrl && (
                  <PaymentLinkRow
                    label="Full Price"
                    url={order.stripeFullPaymentUrl}
                    tone="black"
                  />
                )}
                {order.stripeBalancePaymentUrl &&
                  order.stripeBalancePaymentUrl !== order.stripeFullPaymentUrl && (
                    <PaymentLinkRow
                      label="Remaining Balance"
                      url={order.stripeBalancePaymentUrl}
                      tone="red"
                    />
                  )}
              </div>
            </div>
          )}

          <a
            href={`/invoice/${order._id}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-bold shadow-md shadow-red-900/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print VAT Invoice
          </a>
        </div>

        <DialogFooter className="px-6 py-3 flex-col sm:flex-row gap-2 shrink-0 border-t border-slate-100 bg-white">
          <button
            onClick={togglePayment}
            className="flex-1 text-sm font-bold py-2.5 rounded-lg border-2 border-slate-200 text-black hover:border-black hover:bg-black hover:text-white transition-colors"
          >
            Mark as {order.priceStatus === 'Paid' ? 'Unpaid' : 'Paid'}
          </button>
          <button
            onClick={toggleStatus}
            className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-colors ${
              order.status === 'Completed'
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-black text-white hover:bg-slate-800'
            }`}
          >
            {order.status === 'Completed' ? 'Mark Pending' : 'Mark Completed'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-colors ${
              confirmDelete
                ? 'bg-red-700 text-white hover:bg-red-800'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {confirmDelete ? 'Confirm Delete' : 'Delete'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailCard({ label, value, valueClass }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-sm font-semibold text-black ${valueClass || ''}`}>{value}</p>
    </div>
  );
}

function PaymentLinkRow({ label, url, tone = 'black' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };
  const tones = {
    black: 'bg-black text-white hover:bg-slate-800',
    red: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <div className="flex items-stretch gap-2">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-colors ${tones[tone]}`}
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Pay {label}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? 'Copied' : 'Copy link'}
        className="px-3 rounded-lg border-2 border-slate-200 text-slate-700 hover:border-black hover:text-black transition-colors"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

function MoneyCard({ label, value, tone = 'slate' }) {
  const tones = {
    black: 'bg-black text-white border-black',
    slate: 'bg-slate-50 border-slate-200 text-black',
    red: 'bg-red-50 border-red-200 text-red-700',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  };
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <p
        className={`text-[10px] font-extrabold uppercase tracking-wider mb-1 ${
          tone === 'black' ? 'text-white/70' : 'text-current opacity-70'
        }`}
      >
        {label}
      </p>
      <p className="text-base font-extrabold font-mono">{value}</p>
    </div>
  );
}

export default OrderDetailModal;
