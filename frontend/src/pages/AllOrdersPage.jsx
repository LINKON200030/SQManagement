import { useEffect, useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import OrderSection from '../components/OrderSection';
import useOrderStore from '../store/orderStore';

const USERS = ['Linkon', 'Raki', 'Babu', 'Balli', 'Johana'];

// The three fulfilment stages, shown as separate sections on this page.
const STAGES = [
  { status: 'In Processing', title: 'In Processing', accent: 'default', emptyLabel: 'in processing' },
  { status: 'Ready for Collection', title: 'Ready for Collection', accent: 'red', emptyLabel: 'ready for collection' },
  { status: 'Delivered', title: 'Delivered', accent: 'black', emptyLabel: 'delivered yet' },
];

const SELECT_CLASS =
  'text-sm border-2 border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all font-medium hover:border-slate-300 cursor-pointer';

function AllOrdersPage() {
  const { orders, loading, fetchOrders } = useOrderStore();
  const [filters, setFilters] = useState({
    assignedTo: '',
    priceStatus: '',
    status: '',
    tag: '',
  });

  useEffect(() => {
    const active = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
    fetchOrders(active);
  }, [filters]);

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-[1400px] mx-auto">
      {/* Page title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-black tracking-tight">All Orders</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {orders.length} order{orders.length !== 1 ? 's' : ''} found
          </p>
        </div>
        {hasFilters && (
          <button
            onClick={() =>
              setFilters({ assignedTo: '', priceStatus: '', status: '', tag: '' })
            }
            className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 border-2 border-red-200 rounded-lg px-3 py-2 transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-4 h-4 text-red-600" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Filter Orders
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.assignedTo}
            onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
            className={SELECT_CLASS}
          >
            <option value="">All Employees</option>
            {USERS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <select
            value={filters.priceStatus}
            onChange={(e) => setFilters({ ...filters, priceStatus: e.target.value })}
            className={SELECT_CLASS}
          >
            <option value="">All Payments</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className={SELECT_CLASS}
          >
            <option value="">All Stages</option>
            <option value="In Processing">In Processing</option>
            <option value="Ready for Collection">Ready for Collection</option>
            <option value="Delivered">Delivered</option>
          </select>

          <select
            value={filters.tag}
            onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
            className={SELECT_CLASS}
          >
            <option value="">All Tags</option>
            <option value="Emergency">Emergency</option>
            <option value="Flexible">Flexible</option>
          </select>
        </div>
      </div>

      {/* Orders grouped by stage: In Processing → Ready for Collection → Delivered */}
      <div className="flex flex-col gap-6">
        {STAGES.map((stage) => (
          <OrderSection
            key={stage.status}
            title={stage.title}
            accent={stage.accent}
            orders={orders.filter((o) => o.status === stage.status)}
            loading={loading}
            emptyMessage={`No orders ${stage.emptyLabel}`}
            showCreated
          />
        ))}
      </div>
    </div>
  );
}

export default AllOrdersPage;
