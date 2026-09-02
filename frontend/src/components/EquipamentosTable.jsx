import { useState } from 'react';
import { Copy, Check, Server, ArrowUpDown } from 'lucide-react';

const STATUS_EQUIP = {
  'ativado':    'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/25',
  'planejado':  'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/25',
  'desativado': 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/25',
};

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
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir]     = useState('asc');

  if (!equipamentos?.length) return null;

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  let rows = [...equipamentos];
  if (sortField) {
    rows.sort((a, b) => {
      const av = (a[sortField] ?? '').toString();
      const bv = (b[sortField] ?? '').toString();
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  const Th = ({ field, children }) => (
    <th onClick={() => handleSort(field)}
        className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider cursor-pointer hover:text-brand-light transition-colors select-none whitespace-nowrap">
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown size={11} className={sortField === field ? 'text-brand-light' : 'opacity-30'} />
      </span>
    </th>
  );

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
                <Th field="sigla">Hostname</Th>
                <Th field="status">Status</Th>
                <Th field="id_equip_trans">ID SMTX</Th>
                <Th field="fabricante">Fabricante</Th>
                <Th field="modelo">Modelo</Th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">
                  IP
                </th>
                <Th field="oe_ativacao">OE Ativação</Th>
                <Th field="data_ativacao">Dt. Ativação</Th>
                <Th field="oe_desativacao">OE Desativ.</Th>
                <Th field="data_desativacao">Dt. Desativ.</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-3">
              {rows.map((eq, i) => {
                const statusCls = STATUS_EQUIP[(eq.status || '').toLowerCase()] || 'bg-[#6B7280]/15 text-[#6B7280] border-[#6B7280]/25';
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
