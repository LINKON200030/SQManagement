function StatusPill({ type, value }) {
  if (type === 'status') {
    if (value === 'Delivered') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-black text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
          Delivered
        </span>
      );
    }
    if (value === 'Ready for Collection') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
          Ready for Collection
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
        In Processing
      </span>
    );
  }

  if (type === 'priceStatus') {
    if (value === 'Paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-black text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
          Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block" />
        Unpaid
      </span>
    );
  }

  if (type === 'tag') {
    if (value === 'Emergency') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white">
          Emergency
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        Flexible
      </span>
    );
  }

  return null;
}

export default StatusPill;
