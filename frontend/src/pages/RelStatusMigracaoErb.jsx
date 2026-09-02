import { useState } from 'react';
import { GitMerge, ArrowUpDown } from 'lucide-react';
import RelatorioBase from '../components/RelatorioBase';

function BarraDupla({ fusion, legado, total }) {
  const pF = total > 0 ? (fusion / total) * 100 : 0;
  const pL = total > 0 ? (legado / total) * 100 : 0;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden w-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div style={{ width: `${pF}%`, background: '#8B5CF6' }} className="h-full"/>
      <div style={{ width: `${pL}%`, background: '#EF4444' }} className="h-full"/>
    </div>
  );
}

export default function RelStatusMigracaoErb() {
  const [sortField, setSortField] = useState('legado_ativo');
  const [sortDir, setSortDir]     = useState('desc');

  const handleSort = (f) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('desc'); }
  };

  const Th = ({ field, children }) => (
    <th onClick={() => handleSort(field)}
        className="px-3 py-3 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider
                   cursor-pointer hover:text-[#9C27FF] transition-colors select-none whitespace-nowrap">
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown size={10} className={sortField === field ? 'text-[#9C27FF]' : 'opacity-30'}/>
      </span>
    </th>
  );

  return (
    <RelatorioBase
      titulo="Status de Migração por ERB"
      descricao="Visão por ERB: serviços em Fusion vs Legado (ativos), pendências e alertas"
      icone={GitMerge}
      endpoint="/api/relatorios/status-migracao-erb"
    >
      {({ rows, uf }) => {
        const erbs100Fusion  = rows.filter(r => Number(r.legado_ativo) === 0 && Number(r.fusion_ok) > 0).length;
        const erbsMistas     = rows.filter(r => Number(r.legado_ativo) > 0 && Number(r.fusion_ok) > 0).length;
        const erbs100Legado  = rows.filter(r => Number(r.legado_ativo) > 0 && Number(r.fusion_ok) === 0).length;

        const sorted = [...rows].sort((a, b) => {
          const av = Number(a[sortField] ?? 0); const bv = Number(b[sortField] ?? 0);
          if (av !== bv) return sortDir === 'asc' ? av - bv : bv - av;
          return (a.uf_sigla_erb||'').localeCompare(b.uf_sigla_erb||'');
        });

        return (
          <div>
            {/* Sumário */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: '100% Fusion', valor: erbs100Fusion,  cor: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
                { label: 'Mista',       valor: erbsMistas,     cor: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
                { label: '100% Legado', valor: erbs100Legado,  cor: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4 text-center border"
                     style={{ background: s.bg, borderColor: s.cor + '33' }}>
                  <p className="text-2xl font-bold" style={{ color: s.cor }}>{s.valor.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-white/60 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Legenda barras */}
            <div className="flex items-center gap-4 mb-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[#8B5CF6]"/> Fusion OK</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[#EF4444]"/> Legado Ativo</span>
            </div>

            <div className="rounded-xl border border-surface-3 overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2">
                    <tr>
                      <Th field="uf_sigla_erb">UF</Th>
                      <Th field="sigla_erb">ERB</Th>
                      <Th field="nome_site">Site</Th>
                      <Th field="fusion_ok">Fusion OK</Th>
                      <Th field="legado_ativo">Legado Ativo</Th>
                      <Th field="fusion_inativo">Fusion Inativo</Th>
                      <Th field="pendente_fusion">Pend. Fusion</Th>
                      <th className="px-3 py-3 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap w-36">Progresso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-3">
                    {sorted.map((r, i) => {
                      const total = Number(r.total_ativas) || 1;
                      const fOk   = Number(r.fusion_ok);
                      const lAti  = Number(r.legado_ativo);
                      const situacao = lAti === 0 && fOk > 0 ? '#8B5CF6'
                                     : lAti > 0 && fOk > 0  ? '#F59E0B'
                                     : '#EF4444';
                      return (
                        <tr key={i} className="bg-surface hover:bg-surface-2 transition-colors">
                          <td className="px-3 py-2 text-[#B3B3B3] text-xs font-semibold whitespace-nowrap">{r.uf_sigla_erb}</td>
                          <td className="px-3 py-2 text-white text-xs font-bold whitespace-nowrap"
                              style={{ color: situacao }}>{r.sigla_erb}</td>
                          <td className="px-3 py-2 text-[#B3B3B3] text-xs max-w-[160px] truncate">{r.nome_site || '—'}</td>
                          <td className="px-3 py-2 text-center text-xs font-bold text-[#8B5CF6]">{r.fusion_ok}</td>
                          <td className="px-3 py-2 text-center text-xs font-bold text-[#EF4444]">{r.legado_ativo}</td>
                          <td className="px-3 py-2 text-center text-xs text-[#F59E0B]">{r.fusion_inativo}</td>
                          <td className="px-3 py-2 text-center text-xs text-[#3B82F6]">{r.pendente_fusion}</td>
                          <td className="px-3 py-2 w-36">
                            <BarraDupla fusion={fOk} legado={lAti} total={total}/>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-[#6B7280] mt-2">{rows.length.toLocaleString('pt-BR')} ERBs{uf ? ` · UF ${uf}` : ''}</p>
          </div>
        );
      }}
    </RelatorioBase>
  );
}
