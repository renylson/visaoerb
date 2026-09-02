import { useState } from 'react';

// Ordenação genérica por coluna (string compare via localeCompare), usada
// pelas tabelas de equipamentos/OE/relatórios que antes reimplementavam o
// mesmo sortField/sortDir/handleSort cada uma à sua maneira.
export function useSortableTable(rows, { initialField = null, initialDir = 'asc' } = {}) {
  const [sortField, setSortField] = useState(initialField);
  const [sortDir, setSortDir]     = useState(initialDir);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sortedRows = sortField
    ? [...rows].sort((a, b) => {
        const av = (a[sortField] ?? '').toString();
        const bv = (b[sortField] ?? '').toString();
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : rows;

  return { sortField, sortDir, handleSort, sortedRows };
}
