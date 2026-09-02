import { useState } from 'react';
import { Copy, Check, Server } from 'lucide-react';
import { useSortableTable } from '../hooks/useSortableTable';
import { statusEquipClass } from '../lib/status';
import SortableTh from './SortableTh';

function CopyIP({ ip }) {
  const [copied, setCopied] = useState(false);
  if (!ip) return <span className="text-[#6B7280]">—</span>;
  const handle = () => {
    navigator.clipboard.writeText(ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handle}
            className="flex items-center gap-1.5 font-mono text-xs text-[#00D4FF] hover:text-white transition-colors group">
      {ip}
      {copied
        ? <Check size={11} className="text-[#22C55E]" />
        : <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
    </button>
  );
}

function fmtDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('pt-BR');
}

export default function EquipamentosTable({ equipamentos }) {
  const { sortField, handleSort, sortedRows } = useSortableTable(equipamentos || []);

  if (!equipamentos?.length) return null;

  const rows = sortedRows;

  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-3">
        <Server size={16} className="text-brand-light" />
        Equipamentos
        <span className="text-[#6B7280] font-normal text-sm">({rows.length})</span>
      </h2>

      <div className="rounded-xl border border-surface-3 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr>
                <SortableTh field="sigla" sortField={sortField} onSort={handleSort}>Hostname</SortableTh>
                <SortableTh field="status" sortField={sortField} onSort={handleSort}>Status</SortableTh>
                <SortableTh field="id_equip_trans" sortField={sortField} onSort={handleSort}>ID SMTX</SortableTh>
                <SortableTh field="fabricante" sortField={sortField} onSort={handleSort}>Fabricante</SortableTh>
                <SortableTh field="modelo" sortField={sortField} onSort={handleSort}>Modelo</SortableTh>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">
                  IP
                </th>
                <SortableTh field="oe_ativacao" sortField={sortField} onSort={handleSort}>OE Ativação</SortableTh>
                <SortableTh field="data_ativacao" sortField={sortField} onSort={handleSort}>Dt. Ativação</SortableTh>
                <SortableTh field="oe_desativacao" sortField={sortField} onSort={handleSort}>OE Desativ.</SortableTh>
                <SortableTh field="data_desativacao" sortField={sortField} onSort={handleSort}>Dt. Desativ.</SortableTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-3">
              {rows.map((eq, i) => {
                const statusCls = statusEquipClass(eq.status);
                return (
                  <tr key={eq.id_equip_trans ?? i}
                      className="bg-surface hover:bg-surface-2 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-xs text-white max-w-[220px] truncate" title={eq.sigla}>
                      {eq.sigla}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${statusCls}`}>
                        {eq.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[#B3B3B3] text-xs font-mono whitespace-nowrap">
                      {eq.id_equip_trans}
                    </td>
                    <td className="px-3 py-2.5 text-[#B3B3B3] text-xs whitespace-nowrap">
                      {eq.fabricante ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-[#B3B3B3] text-xs whitespace-nowrap">
                      {eq.modelo ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <CopyIP ip={eq.endereco_ip} />
                    </td>
                    <td className="px-3 py-2.5 text-[#B3B3B3] text-xs font-mono whitespace-nowrap">
                      {eq.oe_ativacao ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-[#B3B3B3] text-xs whitespace-nowrap">
                      {fmtDate(eq.data_ativacao)}
                    </td>
                    <td className="px-3 py-2.5 text-[#B3B3B3] text-xs font-mono whitespace-nowrap">
                      {eq.oe_desativacao ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-[#B3B3B3] text-xs whitespace-nowrap">
                      {fmtDate(eq.data_desativacao)}
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
