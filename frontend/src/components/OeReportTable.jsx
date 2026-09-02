import { useState } from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_OE = {
  'ativada':   'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/25',
  'a migrar':  'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/25',
  'à ativar':  'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/25',
  'migrada':   'bg-[#6B7280]/15 text-[#6B7280] border-[#6B7280]/25',
};
const STATUS_EQUIP = {
  'ativado':    'text-[#22C55E]',
  'planejado':  'text-[#3B82F6]',
  'desativado': 'text-[#EF4444]',
};
const TIPO_COLORS = {
  '2G':                    'bg-[#9C27FF]/15 text-[#C77DFF] border-[#9C27FF]/25',
  '3G':                    'bg-[#9C27FF]/15 text-[#C77DFF] border-[#9C27FF]/25',
  '4G':                    'bg-[#9C27FF]/15 text-[#C77DFF] border-[#9C27FF]/25',
  '5G':                    'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/25',
  'MULTISERVIÇO (3G+4G+5G)':'bg-[#9C27FF]/15 text-[#C77DFF] border-[#9C27FF]/25',
  'SWA':                   'bg-[#0066FF]/15 text-[#4D9DFF] border-[#0066FF]/25',
  'Gerência Fonte':        'bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/25',
  'DCN Rádio':             'bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/25',
  'Outros':                'bg-[#6B7280]/15 text-[#6B7280] border-[#6B7280]/25',
};

function Badge({ label, cls }) {
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${cls}`}>{label}</span>;
}

export default function OeReportTable({ rows, showEquipStatus = true, pageSize = 50 }) {
  const [sortField, setSortField] = useState('uf_sigla_erb');
  const [sortDir, setSortDir]     = useState('asc');
  const [page, setPage]           = useState(1);

  const handleSort = (f) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('asc'); }
    setPage(1);
  };

  const sorted = [...rows].sort((a, b) => {
    const av = (a[sortField] ?? '').toString();
    const bv = (b[sortField] ?? '').toString();
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const total  = sorted.length;
  const pages  = Math.ceil(total / pageSize);
  const sliced = sorted.slice((page - 1) * pageSize, page * pageSize);

  const Th = ({ field, children }) => (
    <th onClick={() => handleSort(field)}
        className="px-3 py-3 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider
                   cursor-pointer hover:text-[#9C27FF] transition-colors select-none whitespace-nowrap">
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown size={10} className={sortField === field ? 'text-[#9C27FF]' : 'opacity-30'} />
      </span>
    </th>
  );

  return (
    <div>
      <p className="text-xs text-[#6B7280] mb-2">{total.toLocaleString('pt-BR')} registros</p>
      <div className="rounded-xl border border-surface-3 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-surface-2">
              <tr>
                <Th field="uf_sigla_erb">UF</Th>
                <Th field="sigla_erb">Sigla ERB</Th>
                <Th field="nome_site">Nome do Site</Th>
                <Th field="oe_status">Status OE</Th>
                <Th field="tipo_servico">Tipo</Th>
                <Th field="num_oe">Num OE</Th>
                <Th field="eqpto_final">Eqpto Final</Th>
                {showEquipStatus && <Th field="equip_status">Status Equip</Th>}
                <Th field="equip_b">Equip B</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-3">
              {sliced.map((r, i) => {
                const oeStatusCls = STATUS_OE[(r.oe_status||'').toLowerCase()] || STATUS_OE['migrada'];
                const tipoCls     = TIPO_COLORS[r.tipo_servico] || TIPO_COLORS['Outros'];
                const equipCls    = STATUS_EQUIP[(r.equip_status||'').toLowerCase()] || 'text-[#6B7280]';
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
