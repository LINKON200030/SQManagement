import OrderTable from './OrderTable';

const ACCENT = {
  red: {
    wrapper: 'bg-red-600',
    dot: 'bg-red-200',
    count: 'bg-white/20 text-white',
  },
  black: {
    wrapper: 'bg-black',
    dot: 'bg-white/60',
    count: 'bg-white/15 text-white',
  },
  default: {
    wrapper: 'bg-slate-800',
    dot: 'bg-slate-300',
    count: 'bg-white/15 text-white',
  },
};

function OrderSection({ title, accent = 'default', orders, loading, emptyMessage, showCreated }) {
  const a = ACCENT[accent] || ACCENT.default;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className={`${a.wrapper} px-5 py-3.5 flex items-center gap-3`}>
        <div className={`w-2 h-2 rounded-full ${a.dot} animate-pulse`} />
        <h2 className="text-sm font-bold text-white tracking-wide uppercase">{title}</h2>
        <span className={`ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full ${a.count}`}>
          {orders.length}
        </span>
      </div>

      <OrderTable
        orders={orders}
        loading={loading}
        emptyMessage={emptyMessage}
        showCreated={showCreated}
      />
    </div>
  );
}

export default OrderSection;
