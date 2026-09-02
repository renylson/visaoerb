import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, HelpCircle, ArrowUpDown, Network } from 'lucide-react';

const STATUS_OE = {
  'ativada':    'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/25',
  'a migrar':   'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/25',
  'à ativar':   'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/25',
  'migrada':    'bg-[#6B7280]/15 text-[#6B7280] border-[#6B7280]/25',
};

const TIPO_COLORS = {
  '2G':          'bg-[#9C27FF]/15 text-[#9C27FF] border-[#9C27FF]/25',
  '3G':          'bg-[#9C27FF]/15 text-[#9C27FF] border-[#9C27FF]/25',
  '4G':          'bg-[#9C27FF]/15 text-[#9C27FF] border-[#9C27FF]/25',
  '5G':          'bg-[#9C27FF]/15 text-[#9C27FF] border-[#9C27FF]/25',
  'MULTISERVIÇO (3G+4G+5G)': 'bg-[#9C27FF]/15 text-[#9C27FF] border-[#9C27FF]/25',
  'SWA':         'bg-[#0066FF]/15 text-[#4D9DFF] border-[#0066FF]/25',
  'Gerência Fonte': 'bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/25',
  'DCN Rádio':   'bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/25',
  'Outros':      'bg-[#6B7280]/15 text-[#6B7280] border-[#6B7280]/25',
};

const FLAG_CONFIG = {
  ok:       { Icon: CheckCircle2, color: 'text-[#22C55E]' },
  migrado:  { Icon: CheckCircle2, color: 'text-[#3B82F6]' },
  critico:  { Icon: XCircle,      color: 'text-[#EF4444]' },
  pendente: { Icon: Clock,        color: 'text-[#F59E0B]' },
  sem_eqpto:{ Icon: HelpCircle,   color: 'text-[#6B7280]' },
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
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir]     = useState('asc');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  if (!oe?.length) return null;

  const tipos   = [...new Set(oe.map(r => r.tipo_servico))].sort();
  const statuses = [...new Set(oe.map(r => r.status))].sort();

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  let rows = [...oe];
  if (filterTipo)   rows = rows.filter(r => r.tipo_servico === filterTipo);
  if (filterStatus) rows = rows.filter(r => r.status === filterStatus);
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
                        ? (TIPO_COLORS[tipo] || TIPO_COLORS.Outros)
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
                <Th field="num_oe">Num OE</Th>
                <Th field="status">Status</Th>
                <Th field="tipo_servico">Tipo</Th>
                <Th field="tecnologia">Tecnologia</Th>
                <Th field="rota">Rota</Th>
                <Th field="equip_b">Equip B</Th>
                <Th field="eqpto_final">Eqpto Final</Th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  Consistência
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-3">
              {rows.map((row, i) => {
                const statusCls = STATUS_OE[(row.status || '').toLowerCase()] || STATUS_OE['migrada'];
                const tipoCls   = TIPO_COLORS[row.tipo_servico] || TIPO_COLORS.Outros;
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
