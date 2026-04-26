import { cn } from '../lib/utils';

function StatusBadge({ type, value }) {
  if (type === 'status') {
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          value === 'Completed'
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-slate-100 text-slate-600'
        )}
      >
        {value === 'Completed' ? '✓ Completed' : '○ Pending'}
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
