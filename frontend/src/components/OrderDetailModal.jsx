import { useState, useEffect } from 'react';
import { Printer, MessageSquare, User, Phone, Mail } from 'lucide-react';
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
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        <div className="bg-black px-6 py-5 border-b-4 border-red-600">
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

        <div className="px-6 py-5">
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

        <DialogFooter className="px-6 pb-5 flex-col sm:flex-row gap-2">
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
