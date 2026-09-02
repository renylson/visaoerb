import { useState, useMemo } from 'react';
import { Search, Loader2, AlertCircle, Layers, ExternalLink, ChevronDown, ChevronRight, ArrowUpDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../ThemeContext';

const STATUS_OE = {
  'ativada':   'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/25',
  'a migrar':  'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/25',
  'à ativar':  'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/25',
  'migrada':   'bg-[#6B7280]/15 text-[#6B7280] border-[#6B7280]/25',
};

const TIPO_COLORS = {
  '2G':             'bg-[#9C27FF]/15 text-[#9C27FF] border-[#9C27FF]/25',
  '3G':             'bg-[#9C27FF]/15 text-[#9C27FF] border-[#9C27FF]/25',
  '4G':             'bg-[#9C27FF]/15 text-[#9C27FF] border-[#9C27FF]/25',
  '5G':             'bg-[#9C27FF]/15 text-[#9C27FF] border-[#9C27FF]/25',
  'MULTISERVIÇO (3G+4G+5G)': 'bg-[#9C27FF]/15 text-[#9C27FF] border-[#9C27FF]/25',
  'SWA':            'bg-[#0066FF]/15 text-[#4D9DFF] border-[#0066FF]/25',
  'Gerência Fonte': 'bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/25',
  'DCN Rádio':      'bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/25',
  'Outros':         'bg-[#6B7280]/15 text-[#6B7280] border-[#6B7280]/25',
};
const STATUS_ERB = {
  'ativado':    'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/25',
  'desativado': 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/25',
};

function Badge({ label, colorCls }) {
  if (!label) return <span className="text-[#6B7280]">—</span>;
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${colorCls}`}>{label}</span>;
}

// Agrupa OEs por ERB (sigla_erb + uf_sigla_erb + nome_site)
function agrupar(registros) {
  const map = new Map();
  for (const r of registros) {
    const key = `${r.uf_sigla_erb}|${r.sigla_erb}|${r.nome_site}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        uf_sigla_erb: r.uf_sigla_erb,
        sigla_erb:    r.sigla_erb,
        nome_site:    r.nome_site,
        erb_status:   r.erb_status,
        municipio:    r.municipio,
        oes: [],
      });
    }
    map.get(key).oes.push(r);
  }
  return [...map.values()];
}

export default function VisaoMassivaERB() {
  const { theme } = useTheme();
  const [query, setQuery]         = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [erro, setErro]           = useState('');
  const [expanded, setExpanded]   = useState(new Set());
  const [filterUf, setFilterUf]   = useState('');
  const [sortField, setSortField] = useState('uf_sigla_erb');
  const [sortDir, setSortDir]     = useState('asc');

  const consultar = async (e) => {
    e?.preventDefault();
    const eqpto = query.trim();
    if (!eqpto) return;
    setLoading(true);
    setErro('');
    setResultado(null);
    setExpanded(new Set());
    setFilterUf('');
    try {
      const res  = await fetch(`/visao/massiva/${encodeURIComponent(eqpto)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro desconhecido');
      if (data.total === 0) setErro(`Nenhuma OE encontrada com eqpto_final = "${eqpto}".`);
      else setResultado(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (key) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const grupos = useMemo(() => {
    if (!resultado) return [];
    let g = agrupar(resultado.registros);
    if (filterUf) g = g.filter(x => x.uf_sigla_erb === filterUf);
    g.sort((a, b) => {
      const av = (a[sortField] ?? '').toString();
      const bv = (b[sortField] ?? '').toString();
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return g;
  }, [resultado, filterUf, sortField, sortDir]);

  const ufOpcoes = resultado
    ? [...new Set(resultado.registros.map(r => r.uf_sigla_erb))].filter(Boolean).sort()
    : [];

  const Th = ({ field, children }) => (
    <th onClick={() => handleSort(field)}
        className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider
                   cursor-pointer hover:text-[#9C27FF] transition-colors select-none whitespace-nowrap">
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown size={11} className={sortField === field ? 'text-[#9C27FF]' : 'opacity-30'} />
      </span>
    </th>
  );

  return (
    <div className="flex min-h-screen" style={{ background: theme.colorBg }}>
      <Sidebar current="/app/massiva" />

      <main className="ml-60 flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur border-b px-8 py-4"
                style={{ background: `${theme.colorBg}e6`, borderColor: theme.colorBorder }}>
          <div className="flex items-center justify-between gap-6">
            <div className="flex-shrink-0">
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers size={18} className="text-[#9C27FF]" />
                Visão Massiva ERB
              </h1>
              <p className="text-xs text-[#6B7280] mt-0.5">
                ERBs com OE vinculadas a um equipamento final
              </p>
            </div>
            <form onSubmit={consultar} className="flex items-end gap-3 flex-1 max-w-2xl justify-end">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  Hostname do Eqpto Final
                </label>
                <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                       placeholder="ex: i-br-pe-pta-ptw-hl5g-01"
                       className="w-full bg-surface-2 border border-surface-3 text-white rounded-lg
                                  px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-brand-light
                                  transition-colors placeholder-[#6B7280]" />
              </div>
              <button type="submit" disabled={!query.trim() || loading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white
                                 bg-brand-gradient hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed
                                 transition-opacity shadow-lg shadow-brand/20 whitespace-nowrap flex-shrink-0">
                {loading ? <><Loader2 size={14} className="animate-spin" /> Buscando...</> : <><Search size={14} /> Buscar</>}
              </button>
            </form>
          </div>
        </header>

        <div className="flex-1 px-8 py-6">

          {/* Estado inicial */}
          {!resultado && !erro && !loading && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-subtle flex items-center justify-center mb-4">
                <Layers size={28} className="text-brand-light" />
              </div>
              <h3 className="text-white font-semibold text-base mb-1">Busca por Equipamento Final</h3>
              <p className="text-[#6B7280] text-sm max-w-sm">
                Informe o hostname do equipamento final para listar todas as ERBs com OEs associadas.
              </p>
            </div>
          )}

          {erro && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#EF4444] mb-6">
              <AlertCircle size={16} /><span className="text-sm">{erro}</span>
            </div>
          )}

          {resultado && (
            <>
              {/* Resumo */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Equipamento consultado</p>
                  <p className="text-white font-mono font-semibold text-sm">{resultado.eqpto_final}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#6B7280] text-xs">{grupos.length} ERBs · {resultado.total} OEs</span>
                  <select value={filterUf} onChange={e => setFilterUf(e.target.value)}
                          className="bg-surface-2 border border-surface-3 text-[#B3B3B3] text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-brand-light">
                    <option value="">Todos UFs</option>
                    {ufOpcoes.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Tabela com linhas agrupadas por ERB */}
              <div className="rounded-xl border border-surface-3 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2">
                    <tr>
                      <th className="w-8" />
                      <Th field="uf_sigla_erb">UF</Th>
                      <Th field="sigla_erb">Sigla ERB</Th>
                      <Th field="nome_site">Nome do Site</Th>
                      <Th field="erb_status">Status ERB</Th>
                      <Th field="municipio">Município</Th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">
                        Tipos de Serviço
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupos.map((grupo) => {
                      const open = expanded.has(grupo.key);
                      const erbCls = STATUS_ERB[(grupo.erb_status || '').toLowerCase()] || 'bg-[#6B7280]/15 text-[#6B7280] border-[#6B7280]/25';

                      // Mini badges com contagem por tipo de serviço
                      const oeResumo = Object.entries(
                        grupo.oes.reduce((acc, o) => {
                          const t = o.tipo_servico || 'Outros';
                          acc[t] = (acc[t] || 0) + 1;
                          return acc;
                        }, {})
                      );

                      return [
                        /* Linha ERB */
                        <tr key={grupo.key}
                            onClick={() => toggleExpand(grupo.key)}
                            className="border-t border-surface-3 bg-surface hover:bg-surface-2 cursor-pointer transition-colors">
                          <td className="pl-3 pr-1 py-3 text-[#6B7280]">
                            {open
                              ? <ChevronDown size={14} className="text-brand-light" />
                              : <ChevronRight size={14} />}
                          </td>
                          <td className="px-3 py-3 text-[#B3B3B3] text-xs font-semibold whitespace-nowrap">
                            {grupo.uf_sigla_erb}
                          </td>
                          <td className="px-3 py-3 text-white text-xs font-bold whitespace-nowrap">
                            {grupo.sigla_erb}
                          </td>
                          <td className="px-3 py-3 text-[#B3B3B3] text-xs max-w-[220px] truncate" title={grupo.nome_site}>
                            {grupo.nome_site ?? '—'}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <Badge label={grupo.erb_status} colorCls={`border ${erbCls}`} />
                          </td>
                          <td className="px-3 py-3 text-[#B3B3B3] text-xs whitespace-nowrap">
                            {grupo.municipio ?? '—'}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 flex-wrap">
                              {oeResumo.map(([tipo]) => {
                                const cls = TIPO_COLORS[tipo] || TIPO_COLORS['Outros'];
                                return (
                                  <span key={tipo} className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${cls}`}>
                                    {tipo}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            <a href={`/app/?uf=${grupo.uf_sigla_erb}&sigla=${grupo.sigla_erb}&nome_site=${encodeURIComponent(grupo.nome_site || '')}`}
                               target="_blank" rel="noreferrer"
                               className="flex items-center gap-1 text-xs text-[#9C27FF] hover:text-[#C77DFF] transition-colors">
                              <ExternalLink size={12} /> Ver ERB
                            </a>
                          </td>
                        </tr>,

                        /* Linhas de OE (expandidas) */
                        open && (
                          <tr key={`${grupo.key}-oes`}>
                            <td colSpan={8} className="p-0 bg-surface-2/50">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-t border-surface-3">
                                    <th className="w-8" />
                                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Num OE</th>
                                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Status OE</th>
                                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Tipo</th>
                                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Tecnologia</th>
                                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Rota</th>
                                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Equip B</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {grupo.oes.map((oe, i) => {
                                    const oeCls = STATUS_OE[(oe.oe_status || '').toLowerCase()] || STATUS_OE['migrada'];
                                    return (
                                      <tr key={i} className="border-t border-surface-3/50 hover:bg-surface-3/30 transition-colors">
                                        <td className="w-8" />
                                        <td className="px-4 py-2 font-mono text-[#B3B3B3] whitespace-nowrap">{oe.num_oe ?? '—'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                          <Badge label={oe.oe_status} colorCls={`border ${oeCls}`} />
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                          <Badge label={oe.tipo_servico} colorCls={`border ${TIPO_COLORS[oe.tipo_servico] || TIPO_COLORS['Outros']}`} />
                                        </td>
                                        <td className="px-4 py-2 text-[#B3B3B3] whitespace-nowrap">{oe.tecnologia ?? '—'}</td>
                                        <td className="px-4 py-2 font-mono text-[#B3B3B3] whitespace-nowrap">{oe.rota}</td>
                                        <td className="px-4 py-2 text-[#B3B3B3] max-w-[200px] truncate" title={oe.equip_b}>{oe.equip_b ?? '—'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        ),
                      ];
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
