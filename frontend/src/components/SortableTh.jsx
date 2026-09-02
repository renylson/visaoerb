import { ArrowUpDown } from 'lucide-react';

export default function SortableTh({ field, sortField, onSort, children, className = '' }) {
  return (
    <th onClick={() => onSort(field)}
        className={`px-3 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer hover:text-brand-light transition-colors select-none whitespace-nowrap ${className}`}>
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown size={11} className={sortField === field ? 'text-brand-light' : 'opacity-30'} />
      </span>
    </th>
  );
}
