import { useState } from 'react';
import { useSortableTable } from '../hooks/useSortableTable';
import { statusOeClass, statusEquipTextClass, tipoServicoClass } from '../lib/status';
import SortableTh from './SortableTh';

function Badge({ label, cls }) {
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${cls}`}>{label}</span>;
}

export default function OeReportTable({ rows, showEquipStatus = true, pageSize = 50 }) {
  const [page, setPage] = useState(1);
  const { sortField, handleSort: sortHandler, sortedRows } = useSortableTable(rows, { initialField: 'uf_sigla_erb' });

  const handleSort = (field) => {
    sortHandler(field);
    setPage(1);
  };

  const total  = sortedRows.length;
  const pages  = Math.ceil(total / pageSize);
  const sliced = sortedRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <p className="text-xs text-[#6B7280] mb-2">{total.toLocaleString('pt-BR')} registros</p>
      <div className="rounded-xl border border-surface-3 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr>
                <SortableTh field="uf_sigla_erb" sortField={sortField} onSort={handleSort} className="text-[10px]">UF</SortableTh>
                <SortableTh field="sigla_erb" sortField={sortField} onSort={handleSort} className="text-[10px]">Sigla ERB</SortableTh>
                <SortableTh field="nome_site" sortField={sortField} onSort={handleSort} className="text-[10px]">Nome do Site</SortableTh>
                <SortableTh field="oe_status" sortField={sortField} onSort={handleSort} className="text-[10px]">Status OE</SortableTh>
                <SortableTh field="tipo_servico" sortField={sortField} onSort={handleSort} className="text-[10px]">Tipo</SortableTh>
                <SortableTh field="num_oe" sortField={sortField} onSort={handleSort} className="text-[10px]">Num OE</SortableTh>
                <SortableTh field="eqpto_final" sortField={sortField} onSort={handleSort} className="text-[10px]">Eqpto Final</SortableTh>
                {showEquipStatus && <SortableTh field="equip_status" sortField={sortField} onSort={handleSort} className="text-[10px]">Status Equip</SortableTh>}
                <SortableTh field="equip_b" sortField={sortField} onSort={handleSort} className="text-[10px]">Equip B</SortableTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-3">
              {sliced.map((r, i) => {
                const oeStatusCls = statusOeClass(r.oe_status);
                const tipoCls     = tipoServicoClass(r.tipo_servico);
                const equipCls    = statusEquipTextClass(r.equip_status);
                return (
                  <tr key={i} className="bg-surface hover:bg-surface-2 transition-colors">
                    <td className="px-3 py-2 text-[#B3B3B3] text-xs font-semibold whitespace-nowrap">{r.uf_sigla_erb}</td>
                    <td className="px-3 py-2 text-white text-xs font-bold whitespace-nowrap">{r.sigla_erb}</td>
                    <td className="px-3 py-2 text-[#B3B3B3] text-xs max-w-[180px] truncate" title={r.nome_site}>{r.nome_site || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><Badge label={r.oe_status} cls={`border ${oeStatusCls}`}/></td>
                    <td className="px-3 py-2 whitespace-nowrap"><Badge label={r.tipo_servico} cls={`border ${tipoCls}`}/></td>
                    <td className="px-3 py-2 text-[#B3B3B3] text-xs font-mono whitespace-nowrap">{r.num_oe || '—'}</td>
                    <td className="px-3 py-2 text-[#B3B3B3] text-xs font-mono max-w-[200px] truncate" title={r.eqpto_final}>{r.eqpto_final}</td>
                    {showEquipStatus && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`text-xs font-semibold ${equipCls}`}>{r.equip_status || '—'}</span>
                      </td>
                    )}
                    <td className="px-3 py-2 text-[#B3B3B3] text-xs max-w-[160px] truncate" title={r.equip_b}>{r.equip_b || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[#6B7280]">
            Página {page} de {pages} · {((page-1)*pageSize)+1}–{Math.min(page*pageSize, total)} de {total}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                    className="px-3 py-1.5 rounded-lg text-xs border border-surface-3 text-[#6B7280] hover:text-white hover:border-brand-light disabled:opacity-30 transition-colors">
              ← Anterior
            </button>
            <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages}
                    className="px-3 py-1.5 rounded-lg text-xs border border-surface-3 text-[#6B7280] hover:text-white hover:border-brand-light disabled:opacity-30 transition-colors">
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
