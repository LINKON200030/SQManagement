import { Table, TableHeader, TableHead, TableBody, TableRow } from './ui/table';
import OrderRow from './OrderRow';

const HEADERS = ['Order Title', 'Assigned', 'Payment', 'Due Time', 'Tag', 'Status'];

function OrderTable({ orders, loading, emptyMessage, showCreated = false }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-4 border-red-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-slate-400">Loading orders…</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-2">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl">
          📋
        </div>
        <p className="text-sm text-slate-400 font-medium">{emptyMessage || 'No orders found'}</p>
      </div>
    );
  }

  const headers = showCreated ? [...HEADERS, 'Created'] : HEADERS;

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
          {headers.map((h) => (
            <TableHead key={h} className="text-xs font-bold uppercase tracking-widest text-slate-400 py-3">
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <OrderRow key={order._id} order={order} showCreated={showCreated} />
        ))}
      </TableBody>
    </Table>
  );
}

export default OrderTable;
