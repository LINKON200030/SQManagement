import { cn } from '../lib/utils';

const STATUS_STYLES = {
  Delivered: { className: 'bg-emerald-100 text-emerald-800', label: '✓ Delivered' },
  'Ready for Collection': {
    className: 'bg-amber-100 text-amber-800',
    label: '◐ Ready for Collection',
  },
  'In Processing': { className: 'bg-slate-100 text-slate-600', label: '○ In Processing' },
};

function StatusBadge({ type, value }) {
  if (type === 'status') {
    const style = STATUS_STYLES[value] || STATUS_STYLES['In Processing'];
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          style.className
        )}
      >
        {style.label}
      </span>
    );
  }

  if (type === 'priceStatus') {
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          value === 'Paid'
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-red-100 text-red-700'
        )}
      >
        {value}
      </span>
    );
  }

  if (type === 'tag') {
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          value === 'Emergency'
            ? 'bg-red-100 text-red-700'
            : 'bg-blue-100 text-blue-700'
        )}
      >
        {value}
      </span>
    );
  }

  return null;
}

export default StatusBadge;
