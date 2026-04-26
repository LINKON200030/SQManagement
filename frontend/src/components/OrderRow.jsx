import { useState } from 'react';
import { TableRow, TableCell } from './ui/table';
import StatusPill from './StatusPill';
import OrderDetailModal from './OrderDetailModal';
import { formatDateTime, formatDate, isOverdue } from '../lib/utils';

function OrderRow({ order, showCreated }) {
  const [open, setOpen] = useState(false);
  const overdue = isOverdue(order.dueDate, order.status);

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-red-50/40 transition-colors border-b border-slate-100 group"
        onClick={() => setOpen(true)}
      >
        <TableCell className="py-3.5">
          <p className="font-semibold text-black text-sm leading-snug group-hover:text-red-600 transition-colors">
            {order.title}
          </p>
          {order.description && (
            <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{order.description}</p>
          )}
        </TableCell>
        <TableCell className="py-3.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
            <span className="w-5 h-5 rounded-full bg-black flex items-center justify-center text-white text-[10px] font-bold">
              {order.assignedTo[0]}
            </span>
            {order.assignedTo}
          </span>
        </TableCell>
        <TableCell className="py-3.5">
          <StatusPill type="priceStatus" value={order.priceStatus} />
        </TableCell>
        <TableCell className="py-3.5">
          <span className={`text-xs font-medium ${overdue ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
            {overdue && <span className="mr-1">⚠️</span>}
            {formatDateTime(order.dueDate)}
          </span>
        </TableCell>
        <TableCell className="py-3.5">
          <StatusPill type="tag" value={order.tag} />
        </TableCell>
        <TableCell className="py-3.5">
          <StatusPill type="status" value={order.status} />
        </TableCell>
        {showCreated && (
          <TableCell className="py-3.5">
            <span className="text-xs text-slate-400">{formatDate(order.createdAt)}</span>
          </TableCell>
        )}
      </TableRow>

      <OrderDetailModal order={order} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default OrderRow;
