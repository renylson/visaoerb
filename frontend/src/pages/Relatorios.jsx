import { useState, useEffect } from 'react';
import { BarChart3, Wifi, ChevronDown, ChevronUp, ExternalLink, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../ThemeContext';

const TIPO_CONFIG = {
  hl4:  { label: 'HL4',  border: '#7C3AED', bg: '#3B0764', familia: 'Fusion'  },
  hl5d: { label: 'HL5D', border: '#8B5CF6', bg: '#4C1D95', familia: 'Fusion'  },
  hl5g: { label: 'HL5G', border: '#A78BFA', bg: '#5B21B6', familia: 'Fusion'  },
  gwc:  { label: 'GWC',  border: '#2563EB', bg: '#1E3A5F', familia: 'Legado'  },
  gwd:  { label: 'GWD',  border: '#3B82F6', bg: '#1D4ED8', familia: 'Legado'  },
  gws:  { label: 'GWS',  border: '#60A5FA', bg: '#2563EB', familia: 'Legado'  },
};

const STATUS_COR = {
  'ativado':    '#22C55E',
  'planejado':  '#3B82F6',
  'desativado': '#EF4444',
};

const ORDEM_TIPOS = ['hl4', 'gwc', 'hl5d', 'gwd', 'hl5g', 'gws'];

// Barra horizontal de progresso relativa ao maior valor
function Barra({ valor, max, cor }) {
  const pct = max > 0 ? (valor / max) * 100 : 0;
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div className="h-full rounded-full transition-all duration-500"
           style={{ width: `${pct}%`, background: cor }} />
    </div>
  );
}

// Seção de um tipo de equipamento
function SecaoTipo({ tipo, lista, limite, setLimite }) {
  const cfg  = TIPO_CONFIG[tipo] || { label: tipo.toUpperCase(), border: '#6B7280', bg: '#374151', familia: '' };
  const max  = lista[0]?.total_erbs || 1;
  const show = lista.slice(0, limite);

  return (
    <div className="rounded-2xl border overflow-hidden mb-5"
         style={{ borderColor: cfg.border + '44' }}>

      {/* Cabeçalho do tipo */}
      <div className="px-5 py-3 flex items-center justify-between"
           style={{ background: cfg.bg + 'cc' }}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold px-3 py-1 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.3)', color: cfg.border, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
          </span>
          <span className="text-white/60 text-xs">{cfg.familia}</span>
          <span className="text-white font-semibold text-sm">{lista.length} equipamentos</span>
        </div>
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <Wifi size={12}/>
          máx {lista[0]?.total_erbs} ERBs
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background: '#0D0D0D' }}>
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-2 border-b text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider"
             style={{ borderColor: '#1E1E1E' }}>
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5">Equipamento</div>
          <div className="col-span-2 text-center">ERBs</div>
          <div className="col-span-2 text-center">OEs</div>
          <div className="col-span-2 text-center">Ação</div>
        </div>

        {show.map((row, i) => {
          const statusCor = STATUS_COR[(row.status_equip || '').toLowerCase()] || '#6B7280';
          return (
            <div key={row.equipamento}
                 className="grid grid-cols-12 gap-2 px-5 py-2.5 items-center border-b hover:bg-white/[0.02] transition-colors"
                 style={{ borderColor: '#1A1A1A' }}>

              {/* Rank */}
              <div className="col-span-1 text-center">
                <span className="text-sm font-bold"
                      style={{ color: i < 3 ? cfg.border : '#6B7280' }}>
                  {i + 1}
                </span>
              </div>

              {/* Hostname + barra */}
              <div className="col-span-5 min-w-0">
                <div className="text-white font-mono text-xs truncate mb-1.5" title={row.equipamento}>
                  {row.equipamento}
                </div>
                <Barra valor={Number(row.total_erbs)} max={Number(max)} cor={cfg.border} />
                <div className="flex items-center gap-2 mt-1">
                  {row.fabricante && (
                    <span className="text-[10px] text-white/50 truncate">
                      {[row.fabricante, row.modelo].filter(Boolean).join(' · ')}
                    </span>
                  )}
                  {row.status_equip && (
                    <span className="text-[10px] font-semibold flex-shrink-0"
                          style={{ color: statusCor }}>
                      {row.status_equip}
                    </span>
                  )}
                </div>
              </div>

              {/* ERBs */}
              <div className="col-span-2 text-center">
                <span className="text-sm font-bold" style={{ color: cfg.border }}>
                  {row.total_erbs}
                </span>
              </div>

              {/* OEs */}
              <div className="col-span-2 text-center">
                <span className="text-sm text-[#B3B3B3]">{row.total_oes}</span>
              </div>

              {/* Ação */}
              <div className="col-span-2 flex justify-center">
                <a href={`/topologia?hostname=${encodeURIComponent(row.equipamento)}`}
                   onClick={e => { e.preventDefault(); window.location.href = '/topologia'; sessionStorage.setItem('topo_hostname', row.equipamento); }}
                   className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                   style={{ color: cfg.border }}>
                  <ExternalLink size={12}/>
                  Ver
                </a>
              </div>
            </div>
          );
        })}

        {/* Ver mais / menos */}
        {lista.length > 10 && (
          <div className="flex justify-center py-3">
            {limite < lista.length
              ? <button onClick={() => setLimite(l => l + 10)}
                        className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-white transition-colors px-4 py-1.5 rounded-lg border border-[#2A2A2A] hover:border-[#6B7280]">
                  <ChevronDown size={13}/> Ver mais ({lista.length - limite} restantes)
                </button>
              : <button onClick={() => setLimite(10)}
                        className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-white transition-colors px-4 py-1.5 rounded-lg border border-[#2A2A2A] hover:border-[#6B7280]">
                  <ChevronUp size={13}/> Ver menos
                </button>
            }
          </div>
        )}
      </div>
    </div>
  );
}

export default function Relatorios() {
  const { theme } = useTheme();
  const [dados, setDados]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro]       = useState('');
  const [limites, setLimites] = useState({});

  useEffect(() => {
    fetch('/api/relatorios/erbs-por-equipamento?limite=200')
      .then(r => r.json())
      .then(d => {
        setDados(d);
        // Inicializa limites com 10 por tipo
        const init = {};
        Object.keys(d).forEach(t => { init[t] = 10; });
        setLimites(init);
      })
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  const setLimite = (tipo, fn) =>
    setLimites(prev => ({ ...prev, [tipo]: fn(prev[tipo] || 10) }));

  // Totalizadores globais
  const totalEquip = dados ? Object.values(dados).reduce((s, l) => s + l.length, 0) : 0;
  const maxErbs    = dados ? Math.max(...Object.values(dados).flatMap(l => l.map(r => Number(r.total_erbs)))) : 0;

  return (
    <div className="flex min-h-screen" style={{ background: theme.colorBg }}>
      <Sidebar current="/relatorios" />
      <main className="ml-60 flex-1 flex flex-col min-h-screen">

        <header className="sticky top-0 z-30 backdrop-blur border-b px-8 py-4"
                style={{ background: `${theme.colorBg}e6`, borderColor: theme.colorBorder }}>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 size={18} className="text-[#9C27FF]"/>
            Relatórios
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">Análises e métricas da rede</p>
        </header>

        <div className="flex-1 px-8 py-6">

          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={28} className="animate-spin text-brand-light"/>
            </div>
          )}

          {erro && (
            <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#EF4444] text-sm">
              {erro}
            </div>
          )}

          {dados && (
            <>
              {/* Título do relatório */}
              <div className="mb-6">
                <h2 className="text-white font-bold text-base flex items-center gap-2 mb-1">
                  <Wifi size={16} className="text-[#A78BFA]"/>
                  Equipamentos com mais ERBs
                </h2>
                <p className="text-[#6B7280] text-xs">
                  {totalEquip} equipamentos · máx {maxErbs} ERBs em um único equipamento
                </p>
              </div>

              {/* Seções por tipo na ordem hierárquica */}
              {ORDEM_TIPOS.filter(t => dados[t]?.length > 0).map(tipo => (
                <SecaoTipo
                  key={tipo}
                  tipo={tipo}
                  lista={dados[tipo]}
                  limite={limites[tipo] || 10}
                  setLimite={(fn) => setLimite(tipo, fn)}
                />
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
