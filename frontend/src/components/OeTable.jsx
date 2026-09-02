import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, HelpCircle, Network } from 'lucide-react';
import { useSortableTable } from '../hooks/useSortableTable';
import { statusOeClass, tipoServicoClass } from '../lib/status';
import SortableTh from './SortableTh';

const FLAG_CONFIG = {
  ok:        { Icon: CheckCircle2, color: 'text-[#22C55E]' },
  migrado:   { Icon: CheckCircle2, color: 'text-[#3B82F6]' },
  critico:   { Icon: XCircle,      color: 'text-[#EF4444]' },
  pendente:  { Icon: Clock,        color: 'text-[#F59E0B]' },
  sem_eqpto: { Icon: HelpCircle,   color: 'text-[#6B7280]' },
};

function Badge({ label, colorCls }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${colorCls}`}>
      {label}
    </span>
  );
}

function FlagCell({ inconsistencia }) {
  const [show, setShow] = useState(false);
  if (!inconsistencia) return null;
  const { Icon, color } = FLAG_CONFIG[inconsistencia.flag] || FLAG_CONFIG.sem_eqpto;
  return (
    <div className="relative inline-flex"
         onMouseEnter={() => setShow(true)}
         onMouseLeave={() => setShow(false)}>
      <Icon size={16} className={`${color} cursor-help`} />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-surface-2 border border-surface-3 rounded-lg p-3 text-xs text-[#B3B3B3] shadow-xl z-50 text-left">
          <p className="font-semibold text-white mb-1">{inconsistencia.label}</p>
          <p>{inconsistencia.detalhe}</p>
        </div>
      )}
    </div>
  );
}

export default function OeTable({ oe }) {
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  if (!oe?.length) return null;

  const tipos    = [...new Set(oe.map(r => r.tipo_servico))].sort();
  const statuses = [...new Set(oe.map(r => r.status))].sort();

  let filtered = oe;
  if (filterTipo)   filtered = filtered.filter(r => r.tipo_servico === filterTipo);
  if (filterStatus) filtered = filtered.filter(r => r.status === filterStatus);

  const { sortField, handleSort, sortedRows } = useSortableTable(filtered);
  const rows = sortedRows;

  // Contadores por tipo
  const contadores = tipos.map(t => ({ tipo: t, count: oe.filter(r => r.tipo_servico === t).length }));

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Network size={16} className="text-brand-light" />
          Serviços — OE
          <span className="text-[#6B7280] font-normal text-sm">({rows.length}/{oe.length})</span>
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {contadores.map(({ tipo, count }) => (
            <button key={tipo} onClick={() => setFilterTipo(filterTipo === tipo ? '' : tipo)}
                    className={`px-2 py-0.5 rounded-md text-xs font-semibold border transition-all
                      ${filterTipo === tipo
                        ? tipoServicoClass(tipo)
                        : 'bg-surface-2 text-[#6B7280] border-surface-3 hover:border-brand/40'}`}>
              {tipo} ({count})
            </button>
          ))}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="bg-surface-2 border border-surface-3 text-[#B3B3B3] text-xs rounded-md px-2 py-1 focus:outline-none focus:border-brand-light">
            <option value="">Todos status</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-surface-3 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr>
                <SortableTh field="num_oe" sortField={sortField} onSort={handleSort}>Num OE</SortableTh>
                <SortableTh field="status" sortField={sortField} onSort={handleSort}>Status</SortableTh>
                <SortableTh field="tipo_servico" sortField={sortField} onSort={handleSort}>Tipo</SortableTh>
                <SortableTh field="tecnologia" sortField={sortField} onSort={handleSort}>Tecnologia</SortableTh>
                <SortableTh field="rota" sortField={sortField} onSort={handleSort}>Rota</SortableTh>
                <SortableTh field="equip_b" sortField={sortField} onSort={handleSort}>Equip B</SortableTh>
                <SortableTh field="eqpto_final" sortField={sortField} onSort={handleSort}>Eqpto Final</SortableTh>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  Consistência
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-3">
              {rows.map((row, i) => {
                const statusCls = statusOeClass(row.status);
                const tipoCls   = tipoServicoClass(row.tipo_servico);
                return (
                  <tr key={row.id_rota ?? i}
                      className="bg-surface hover:bg-surface-2 transition-colors">
                    <td className="px-3 py-2.5 text-[#B3B3B3] font-mono text-xs whitespace-nowrap">
                      {row.num_oe ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Badge label={row.status} colorCls={`border ${statusCls}`} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Badge label={row.tipo_servico} colorCls={`border ${tipoCls}`} />
                    </td>
                    <td className="px-3 py-2.5 text-[#B3B3B3] text-xs whitespace-nowrap">
                      {row.tecnologia ?? <span className="text-[#6B7280]">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-[#B3B3B3] text-xs whitespace-nowrap font-mono">
                      {row.rota}
                    </td>
                    <td className="px-3 py-2.5 text-[#B3B3B3] text-xs max-w-[180px] truncate" title={row.equip_b}>
                      {row.equip_b}
                    </td>
                    <td className="px-3 py-2.5 text-[#B3B3B3] text-xs max-w-[200px] truncate font-mono" title={row.eqpto_final}>
                      {row.eqpto_final ?? <span className="text-[#6B7280]">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <FlagCell inconsistencia={row.inconsistencia} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
