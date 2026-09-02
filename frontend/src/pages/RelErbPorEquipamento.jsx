import { useState, useEffect } from 'react';
import { Wifi, ChevronDown, ChevronUp, Loader2, Search, RotateCcw } from 'lucide-react';
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
const ORDEM_TIPOS = ['hl4', 'gwc', 'hl5d', 'gwd', 'hl5g', 'gws'];
const STATUS_COR  = { 'ativado': '#22C55E', 'planejado': '#3B82F6', 'desativado': '#EF4444' };

function Barra({ valor, max, cor }) {
  const pct = max > 0 ? (valor / max) * 100 : 0;
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: cor }} />
    </div>
  );
}

function SecaoTipo({ tipo, lista, limite, setLimite }) {
  const cfg  = TIPO_CONFIG[tipo] || { label: tipo.toUpperCase(), border: '#6B7280', bg: '#374151' };
  const max  = lista[0]?.total_erbs || 1;
  const show = lista.slice(0, limite);

  return (
    <div className="rounded-2xl border overflow-hidden mb-5" style={{ borderColor: cfg.border + '44' }}>
      {/* Header do tipo */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ background: cfg.bg + 'cc' }}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold px-3 py-1 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.3)', color: cfg.border, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
          </span>
          <span className="text-white/60 text-xs">{cfg.familia}</span>
          <span className="text-white font-semibold text-sm">{lista.length} equipamentos</span>
        </div>
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <Wifi size={12}/> máx {lista[0]?.total_erbs} ERBs
        </div>
      </div>

      <div style={{ background: '#0D0D0D' }}>
        <div className="grid grid-cols-12 gap-2 px-5 py-2 border-b text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider"
             style={{ borderColor: '#1E1E1E' }}>
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-6">Equipamento</div>
          <div className="col-span-2 text-center">ERBs</div>
          <div className="col-span-3 text-center">OEs</div>
        </div>

        {show.map((row, i) => {
          const statusCor = STATUS_COR[(row.status_equip || '').toLowerCase()] || '#6B7280';
          return (
            <div key={row.equipamento}
                 className="grid grid-cols-12 gap-2 px-5 py-2.5 items-center border-b hover:bg-white/[0.02] transition-colors"
                 style={{ borderColor: '#1A1A1A' }}>
              <div className="col-span-1 text-center">
                <span className="text-sm font-bold" style={{ color: i < 3 ? cfg.border : '#6B7280' }}>{i + 1}</span>
              </div>
              <div className="col-span-6 min-w-0">
                <div className="text-white font-mono text-xs truncate mb-1.5" title={row.equipamento}>{row.equipamento}</div>
                <Barra valor={Number(row.total_erbs)} max={Number(max)} cor={cfg.border} />
                <div className="flex items-center gap-2 mt-1">
                  {row.fabricante && (
                    <span className="text-[10px] text-white/50 truncate">
                      {[row.fabricante, row.modelo].filter(Boolean).join(' · ')}
                    </span>
                  )}
                  {row.status_equip && (
                    <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: statusCor }}>
                      {row.status_equip}
                    </span>
                  )}
                </div>
              </div>
              <div className="col-span-2 text-center">
                <span className="text-sm font-bold" style={{ color: cfg.border }}>{row.total_erbs}</span>
              </div>
              <div className="col-span-3 text-center">
                <span className="text-sm text-[#B3B3B3]">{row.total_oes}</span>
              </div>
            </div>
          );
        })}

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

export default function RelErbPorEquipamento() {
  const { theme } = useTheme();

  // Filtros
  const [ufs, setUfs]         = useState([]);
  const [soAtivadas, setSoAtivadas] = useState(false);
  const [ufSel, setUfSel]     = useState('');
  const [tipoSel, setTipoSel] = useState('');

  // Resultado
  const [dados, setDados]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState('');
  const [limites, setLimites] = useState({});
  const [gerado, setGerado]   = useState(false);

  useEffect(() => {
    fetch('/api/relatorios/ufs').then(r => r.json()).then(setUfs).catch(() => {});
  }, []);

  const gerar = async () => {
    setLoading(true);
    setErro('');
    setDados(null);
    const params = new URLSearchParams({ limite: '500' });
    if (ufSel)      params.set('uf',         ufSel);
    if (tipoSel)    params.set('tipo',        tipoSel);
    if (soAtivadas) params.set('soAtivadas', 'true');
    try {
      const r = await fetch(`/api/relatorios/erbs-por-equipamento?${params}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro);
      setDados(d);
      const init = {};
      Object.keys(d).forEach(t => { init[t] = 10; });
      setLimites(init);
      setGerado(true);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  const limpar = () => {
    setUfSel(''); setTipoSel(''); setSoAtivadas(false);
    setDados(null); setGerado(false); setErro('');
  };

  const tiposDisponiveis = tipoSel
    ? ORDEM_TIPOS.filter(t => t === tipoSel && dados?.[t]?.length > 0)
    : ORDEM_TIPOS.filter(t => dados?.[t]?.length > 0);

  const totalEquip = dados ? Object.values(dados).reduce((s, l) => s + l.length, 0) : 0;
  const totalErbs  = dados ? Math.max(...Object.values(dados).flatMap(l => l.map(r => Number(r.total_erbs))), 0) : 0;

  return (
    <div className="flex min-h-screen" style={{ background: theme.colorBg }}>
      <Sidebar current="/relatorios/erb-por-equipamento" />
      <main className="ml-60 flex-1 flex flex-col min-h-screen">

        <header className="sticky top-0 z-30 backdrop-blur border-b px-8 py-4"
                style={{ background: `${theme.colorBg}e6`, borderColor: theme.colorBorder }}>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Wifi size={18} className="text-[#9C27FF]"/>
            Quantidade de ERB por Equipamento
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">Equipamentos ordenados por quantidade de ERBs atendidas</p>
        </header>

        <div className="flex-1 px-8 py-6">

          {/* Painel de filtros */}
          <div className="rounded-2xl border p-6 mb-6"
               style={{ background: theme.colorSurface, borderColor: theme.colorBorder }}>
            <h3 className="text-sm font-semibold text-white mb-4">Filtros</h3>
            <div className="flex items-end gap-4 flex-wrap">

              {/* UF */}
              <div className="flex flex-col gap-1.5 w-36">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">UF</label>
                <select value={ufSel} onChange={e => setUfSel(e.target.value)}
                        className="bg-surface-2 border border-surface-3 text-white rounded-lg px-3 py-2.5 text-sm
                                   focus:outline-none focus:border-brand-light appearance-none cursor-pointer">
                  <option value="">Todas as UFs</option>
                  {ufs.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              {/* Tipo */}
              <div className="flex flex-col gap-1.5 w-52">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Tipo de Equipamento</label>
                <select value={tipoSel} onChange={e => setTipoSel(e.target.value)}
                        className="bg-surface-2 border border-surface-3 text-white rounded-lg px-3 py-2.5 text-sm
                                   focus:outline-none focus:border-brand-light appearance-none cursor-pointer">
                  <option value="">Todos os tipos</option>
                  {ORDEM_TIPOS.map(t => (
                    <option key={t} value={t}>{TIPO_CONFIG[t].label} — {TIPO_CONFIG[t].familia}</option>
                  ))}
                </select>
              </div>

              {/* Toggle só Ativadas */}
              <div className="flex flex-col gap-1.5 pb-0.5">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  Considerar ERBs
                </label>
                <button onClick={() => setSoAtivadas(v => !v)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border"
                        style={{
                          background: soAtivadas ? 'rgba(34,197,94,0.12)' : 'var(--color-surface2, #1E1E1E)',
                          borderColor: soAtivadas ? '#22C55E' : '#2A2A2A',
                          color: soAtivadas ? '#22C55E' : '#6B7280',
                        }}>
                  {/* Toggle pill */}
                  <span className="w-9 h-5 rounded-full flex items-center px-0.5 transition-all flex-shrink-0"
                        style={{ background: soAtivadas ? '#22C55E' : '#374151' }}>
                    <span className="w-4 h-4 bg-white rounded-full shadow transition-transform"
                          style={{ transform: soAtivadas ? 'translateX(16px)' : 'translateX(0)' }}/>
                  </span>
                  Somente Ativadas
                </button>
              </div>

              {/* Botões */}
              <div className="flex gap-2 pb-0.5">
                <button onClick={gerar} disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white
                                   bg-brand-gradient hover:opacity-90 disabled:opacity-40 transition-opacity whitespace-nowrap">
                  {loading ? <><Loader2 size={14} className="animate-spin"/> Gerando...</> : <><Search size={14}/> Gerar relatório</>}
                </button>
                {gerado && (
                  <button onClick={limpar}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-[#6B7280]
                                     border border-surface-3 hover:text-white hover:border-brand-light transition-colors">
                    <RotateCcw size={14}/> Limpar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#EF4444] text-sm mb-4">
              {erro}
            </div>
          )}

          {/* Resultado */}
          {dados && (
            <>
              <div className="flex items-center gap-4 mb-5">
                <p className="text-[#6B7280] text-xs">
                  {totalEquip} equipamentos
                  {ufSel ? ` · UF ${ufSel}` : ' · Todas as UFs'}
                  {tipoSel ? ` · ${TIPO_CONFIG[tipoSel]?.label}` : ' · Todos os tipos'}
                  {soAtivadas ? ' · Somente Ativadas' : ' · Todos os status'}
                </p>
                <p className="text-xs font-semibold" style={{ color: '#A78BFA' }}>
                  <Wifi size={11} className="inline mr-1"/> máx {totalErbs} ERBs
                </p>
              </div>

              {tiposDisponiveis.length === 0 && (
                <p className="text-[#6B7280] text-sm text-center py-12">Nenhum resultado encontrado para os filtros selecionados.</p>
              )}

              {tiposDisponiveis.map(tipo => (
                <SecaoTipo
                  key={tipo}
                  tipo={tipo}
                  lista={dados[tipo]}
                  limite={limites[tipo] || 10}
                  setLimite={fn => setLimites(prev => ({ ...prev, [tipo]: fn(prev[tipo] || 10) }))}
                />
              ))}
            </>
          )}

          {!gerado && !loading && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-subtle flex items-center justify-center mb-4">
                <Wifi size={28} className="text-brand-light"/>
              </div>
              <h3 className="text-white font-semibold text-base mb-1">Configure os filtros e gere o relatório</h3>
              <p className="text-[#6B7280] text-sm max-w-xs">
                Selecione a UF e o tipo de equipamento desejados, ou deixe em branco para ver todos.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
