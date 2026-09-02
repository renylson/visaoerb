import { useState, useEffect, useRef } from 'react';
import { GitFork, Search, Loader2, X, Plus, CheckCircle2, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../ThemeContext';
import { tipoEquip, TIPO_EQUIP_CONFIG as TIPO_EQUIP } from '../lib/status';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CLS = {
  'ativado':    '#22C55E',
  'planejado':  '#3B82F6',
  'desativado': '#EF4444',
};

// Tipos que só aceitam upstream (sem downstream)
const APENAS_UPSTREAM = ['hl5g', 'gws'];

// Classifica a relação entre dois equipamentos
function classificarRelacao(tipoEquip, tipoUpstream) {
  // Mesmo nível hierárquico → Vizinho (anel)
  const vizinhos = [
    ['hl5d','hl5d'], ['hl5g','hl5g'],
    ['gwd','gwd'],   ['gws','gws'],
  ];
  if (vizinhos.some(([a,b]) => a === tipoEquip && b === tipoUpstream)) return 'Vizinho';
  return 'Upstream';
}

// Cor do label de relação
const RELACAO_COR = {
  'Upstream': '#22C55E',
  'Vizinho':  '#F59E0B',
};

// ─── Combobox hostname ───────────────────────────────────────────────────────

function HostnameCombobox({ value, onChange, placeholder, autoFocus }) {
  const [query, setQuery]   = useState('');
  const [opts, setOpts]     = useState([]);
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [display, setDisplay] = useState('');
  const ref = useRef(); const timer = useRef();

  useEffect(() => { if (!value) { setDisplay(''); setQuery(''); } }, [value]);

  const search = (q) => {
    clearTimeout(timer.current);
    if (!q.trim()) { setOpts([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try { const r = await fetch(`/api/topologia/buscar?q=${encodeURIComponent(q)}`); setOpts(await r.json()); }
      finally { setLoading(false); }
    }, 250);
  };

  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input autoFocus={autoFocus} type="text"
             value={open ? query : display}
             onChange={e => { setQuery(e.target.value); search(e.target.value); setOpen(true); if (!e.target.value) onChange(''); }}
             onFocus={() => setOpen(true)}
             onKeyDown={e => e.key === 'Escape' && setOpen(false)}
             placeholder={placeholder}
             className="w-full bg-[#0D0D0D] border border-[#2A2A2A] text-white rounded-lg px-3 py-2 text-xs
                        font-mono focus:outline-none focus:border-[#8B5CF6] transition-colors placeholder-[#6B7280] pr-7" />
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        {loading ? <Loader2 size={11} className="animate-spin text-[#6B7280]" />
          : value ? <button onClick={() => { onChange(''); setDisplay(''); setQuery(''); }} className="text-[#6B7280] hover:text-white"><X size={11}/></button>
          : <Search size={11} className="text-[#6B7280] pointer-events-none"/>}
      </div>
      {open && opts.length > 0 && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[#1E1E1E] border border-[#2A2A2A]
                        rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto scrollbar-thin"
             style={{ minWidth: '420px' }}>
          {opts.map(o => {
            const t = tipoEquip(o.sigla); const cfg = TIPO_EQUIP[t];
            return (
              <button key={o.sigla} onClick={() => { equipCache[o.sigla] = o; onChange(o.sigla); setDisplay(o.sigla); setQuery(''); setOpen(false); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-[rgba(139,92,246,0.15)] transition-colors flex items-center gap-3">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ color: cfg.border, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                <span className="text-white font-mono text-sm flex-1">{o.sigla}</span>
                <span className="text-xs flex-shrink-0" style={{ color: STATUS_CLS[(o.status||'').toLowerCase()] || '#6B7280' }}>{o.status}</span>
                {o.endereco_ip && <span className="text-xs text-[#6B7280] flex-shrink-0 font-mono">{o.endereco_ip}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Cache de detalhes de equipamentos ──────────────────────────────────────

const equipCache = {};

async function fetchEquipInfo(hostname) {
  if (!hostname) return null;
  if (equipCache[hostname] !== undefined) return equipCache[hostname];
  equipCache[hostname] = null; // marca como carregando
  try {
    const r = await fetch(`/api/topologia/buscar?q=${encodeURIComponent(hostname)}`);
    const list = await r.json();
    const found = list.find(e => e.sigla === hostname) || null;
    equipCache[hostname] = found;
    return found;
  } catch { return null; }
}

// ─── Nó visual ──────────────────────────────────────────────────────────────

// Componente de porta editável inline
function PortaTag({ valor, placeholder, onSave, cor }) {
  const [editando, setEditando] = useState(false);
  const [v, setV] = useState(valor || '');
  const confirmar = () => { onSave(v.trim() || null); setEditando(false); };
  if (editando) return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <input autoFocus value={v} onChange={e => setV(e.target.value)}
             onKeyDown={e => { if (e.key === 'Enter') confirmar(); if (e.key === 'Escape') setEditando(false); }}
             placeholder={placeholder}
             className="w-20 bg-[#0D0D0D] border border-[#F59E0B] text-white rounded px-1.5 py-0.5 text-xs font-mono focus:outline-none text-center" />
      <button onClick={confirmar} className="text-[#22C55E] hover:opacity-80"><CheckCircle2 size={12}/></button>
      <button onClick={() => setEditando(false)} className="text-[#6B7280] hover:text-white text-xs">✕</button>
    </div>
  );
  return (
    <span onClick={e => { e.stopPropagation(); setEditando(true); }}
          className="text-xs font-mono px-2 py-0.5 rounded-md cursor-pointer hover:opacity-80 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.45)', color: cor || '#D1D5DB' }}
          title="Clique para editar">
      {valor || <span className="italic opacity-50">porta?</span>}
    </span>
  );
}

// links = array de { id, portaLocal, portaRemota, onEditLocal, onEditRemota, onRemove }
// isCentral: nó consultado — links.portaCentral + links.outro
function No({ hostname, isCentral, tipoCentral, links = [], relacoes = [] }) {
  const [info, setInfo] = useState(equipCache[hostname] || null);
  const tipo   = tipoEquip(hostname);
  const cfg    = TIPO_EQUIP[tipo];
  const relacao = tipoCentral && !isCentral ? classificarRelacao(tipo, tipoCentral) : null;

  useEffect(() => {
    if (!hostname) return;
    fetchEquipInfo(hostname).then(d => setInfo(d));
  }, [hostname]);

  return (
    <div className="relative flex flex-col items-center group">
      {relacao && (
        <div className="mb-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full"
             style={{ background: `${RELACAO_COR[relacao]}22`, color: RELACAO_COR[relacao], border: `1px solid ${RELACAO_COR[relacao]}44` }}>
          {relacao}
        </div>
      )}
      <div className="rounded-2xl px-5 py-4 text-center transition-all"
           style={{
             minWidth: isCentral ? 240 : 210,
             maxWidth: 280,
             background: cfg.bg,
             border: `2px solid ${isCentral ? '#C77DFF' : cfg.border}`,
             boxShadow: isCentral ? `0 0 24px ${cfg.border}66` : `0 4px 12px rgba(0,0,0,0.4)`,
           }}>
        <div className="text-xs font-bold mb-1.5" style={{ color: cfg.border }}>{cfg.label}</div>
        <div className="text-white font-mono text-xs break-all leading-snug">{hostname}</div>

        {info && (
          <div className="mt-3 space-y-1 text-left border-t pt-2.5"
               style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
            {(info.fabricante || info.modelo) && (
              <div className="text-xs text-white/90 truncate">
                {[info.fabricante, info.modelo].filter(Boolean).join(' · ')}
              </div>
            )}
            {info.endereco_ip && (
              <div className="text-xs font-mono truncate" style={{ color: cfg.border }}>
                {info.endereco_ip}
              </div>
            )}
            {info.status && (
              <div className="text-xs font-semibold"
                   style={{ color: STATUS_CLS[(info.status||'').toLowerCase()] || '#6B7280' }}>
                {info.status}
              </div>
            )}
          </div>
        )}

        {/* Nó normal: um bloco por link (local ↔ remota) + botão remover por link */}
        {!isCentral && links.length > 0 && (
          <div className="mt-3 border-t pt-2.5 space-y-2" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
            {links.map((lk, i) => (
              <div key={lk.id} className="relative">
                {links.length > 1 && (
                  <div className="text-[10px] text-white/50 mb-1 font-semibold">Link {i + 1}</div>
                )}
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <PortaTag valor={lk.portaLocal} placeholder="local"
                            onSave={v => lk.onEditLocal(v)} cor={cfg.border} />
                  <span className="text-[10px] text-[#6B7280]">↔</span>
                  <PortaTag valor={lk.portaRemota} placeholder="remota"
                            onSave={v => lk.onEditRemota(v)} cor="#6B7280" />
                  <button onClick={lk.onRemove}
                          className="ml-1 text-[#EF4444]/50 hover:text-[#EF4444] transition-colors">
                    <X size={11}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Nó central: por vizinho/upstream/downstream mostra cada link com porta central */}
        {isCentral && relacoes.length > 0 && (
          <div className="mt-3 border-t pt-2.5 space-y-2" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
            {relacoes.map((r, i) => (
              <div key={r.id} className="text-left">
                {r.showLabel && (
                  <div className="text-[10px] text-white/60 mb-0.5 truncate" title={r.outro}>
                    → {r.outro.split('-').slice(-3).join('-')}
                  </div>
                )}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {relacoes.filter(x => x.outro === r.outro).length > 1 && (
                    <span className="text-[9px] text-[#6B7280]">L{i + 1}</span>
                  )}
                  <PortaTag valor={r.portaCentral} placeholder="porta"
                            onSave={v => r.onEdit(v)} cor={cfg.border} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Nó para adicionar novo upstream/downstream
function NoAdicionar({ label, onConfirm, tipoCentral, hostnameCentral }) {
  const [aberto, setAberto]         = useState(false);
  const [hostname, setHostname]     = useState('');
  const [portaEquip, setPortaEquip] = useState('');
  const [portaUpstr, setPortaUpstr] = useState('');
  const [preview, setPreview]       = useState(null);

  const onSelectHostname = (h) => {
    setHostname(h);
    if (h) fetchEquipInfo(h).then(d => setPreview(d));
    else setPreview(null);
  };

  const confirmar = () => {
    if (!hostname.trim()) return;
    onConfirm(hostname.trim(), portaEquip.trim() || null, portaUpstr.trim() || null);
    setHostname(''); setPortaEquip(''); setPortaUpstr(''); setAberto(false); setPreview(null);
  };

  const tipo     = tipoEquip(hostname);
  const cfg      = TIPO_EQUIP[tipo];
  const relacao  = tipoCentral && hostname ? classificarRelacao(tipo, tipoCentral) : null;

  if (!aberto) return (
    <button onClick={() => setAberto(true)}
            className="rounded-2xl px-5 py-4 text-center border-2 border-dashed transition-all
                       hover:border-[#8B5CF6] hover:bg-[rgba(139,92,246,0.08)] group"
            style={{ minWidth: 200, borderColor: '#2A2A2A', background: 'transparent' }}>
      <Plus size={20} className="mx-auto mb-2 text-[#6B7280] group-hover:text-[#8B5CF6] transition-colors"/>
      <div className="text-sm text-[#6B7280] group-hover:text-[#8B5CF6] transition-colors font-medium">{label}</div>
    </button>
  );

  return (
    <div className="rounded-2xl p-4 space-y-3"
         style={{ minWidth: 240, background: '#1E1E1E', border: '2px solid #8B5CF6' }}>

      {/* Preview do equipamento selecionado */}
      {hostname && (
        <div className="rounded-xl px-3 py-2.5 text-center"
             style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}>
          {relacao && (
            <div className="text-xs font-bold mb-1"
                 style={{ color: RELACAO_COR[relacao] }}>{relacao}</div>
          )}
          <div className="text-xs font-bold mb-1" style={{ color: cfg.border }}>{cfg.label}</div>
          <div className="text-white font-mono text-xs break-all">{hostname}</div>
          {preview && (
            <div className="mt-2 border-t pt-2 space-y-0.5 text-left"
                 style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              {(preview.fabricante || preview.modelo) && (
                <div className="text-xs text-white/70 truncate">
                  {[preview.fabricante, preview.modelo].filter(Boolean).join(' · ')}
                </div>
              )}
              {preview.endereco_ip && (
                <div className="text-xs font-mono" style={{ color: cfg.border }}>{preview.endereco_ip}</div>
              )}
              {preview.status && (
                <div className="text-xs font-semibold"
                     style={{ color: STATUS_CLS[(preview.status||'').toLowerCase()] || '#6B7280' }}>
                  {preview.status}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <HostnameCombobox value={hostname} onChange={onSelectHostname}
                        placeholder="Digite hostname..." autoFocus />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-[#6B7280] uppercase tracking-wider block mb-1">
            Porta deste equipamento
          </label>
          <input type="text" value={portaEquip} onChange={e => setPortaEquip(e.target.value)}
                 placeholder="ex: 0/3/0"
                 onKeyDown={e => e.key === 'Enter' && confirmar()}
                 className="w-full bg-[#0D0D0D] border border-[#2A2A2A] text-white rounded-lg px-3 py-2 text-sm
                            font-mono focus:outline-none focus:border-[#8B5CF6] placeholder-[#6B7280]" />
        </div>
        <div>
          <label className="text-[10px] text-[#6B7280] uppercase tracking-wider block mb-1">
            Porta de {hostnameCentral || 'central'}
          </label>
          <input type="text" value={portaUpstr} onChange={e => setPortaUpstr(e.target.value)}
                 placeholder="ex: 0/1/0"
                 onKeyDown={e => e.key === 'Enter' && confirmar()}
                 className="w-full bg-[#0D0D0D] border border-[#2A2A2A] text-white rounded-lg px-3 py-2 text-sm
                            font-mono focus:outline-none focus:border-[#8B5CF6] placeholder-[#6B7280]" />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={confirmar} disabled={!hostname}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40
                           transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#660099,#9C27FF)' }}>
          <CheckCircle2 size={13} className="inline mr-1"/>Confirmar
        </button>
        <button onClick={() => { setAberto(false); setHostname(''); setPortaEquip(''); setPortaUpstr(''); setPreview(null); }}
                className="px-3 py-2 rounded-lg text-sm text-[#6B7280] border border-[#2A2A2A] hover:text-white transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Seta SVG entre nós ─────────────────────────────────────────────────────

function Seta({ dir }) {
  return (
    <div className="flex flex-col items-center py-1">
      {dir === 'down'
        ? <ArrowDown size={20} className="text-[#5B21B6]"/>
        : <ArrowUp   size={20} className="text-[#5B21B6]"/>}
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function Vizinhos() {
  const { theme } = useTheme();
  const [modoSelecao, setModoSelecao] = useState('hostname');
  const [equipamento, setEquipamento] = useState('');
  const [relacoes, setRelacoes]       = useState([]);
  const [msg, setMsg]                 = useState(null);

  // Busca por ERB
  const [siglaErb, setSiglaErb] = useState('');
  const [ufErb, setUfErb]       = useState('');
  const [equipsErb, setEquipsErb] = useState([]);
  const [loadingErb, setLoadingErb] = useState(false);
  const [buscouErb, setBuscouErb]   = useState(false);

  const carregarRelacoes = async (eq) => {
    if (!eq) { setRelacoes([]); return; }
    const r = await fetch(`/api/topologia/listar?equipamento=${encodeURIComponent(eq)}`);
    setRelacoes(await r.json());
  };

  useEffect(() => { carregarRelacoes(equipamento); }, [equipamento]);

  const buscarPorErb = async () => {
    if (!siglaErb.trim()) return;
    setLoadingErb(true); setBuscouErb(false);
    const p = new URLSearchParams({ sigla: siglaErb.trim() });
    if (ufErb.trim()) p.set('uf', ufErb.trim());
    const r = await fetch(`/api/topologia/por-erb?${p}`);
    setEquipsErb(await r.json());
    setBuscouErb(true); setLoadingErb(false);
  };

  const salvarRelacao = async (outroHostname, portaEquip, portaUpstream, isDownstream = false) => {
    setMsg(null);
    // isDownstream: o "outro" é o filho, o central é o upstream
    // porta_equipamento = porta do filho (equipamento), porta_upstream = porta do central (upstream)
    const body = isDownstream
      ? { equipamento: outroHostname, upstream: equipamento, porta_equipamento: portaEquip, porta_upstream: portaUpstream }
      : { equipamento, upstream: outroHostname, porta_equipamento: portaEquip, porta_upstream: portaUpstream };
    try {
      const res = await fetch('/api/topologia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      setMsg({ tipo: 'ok', texto: 'Salvo!' });
      setTimeout(() => setMsg(null), 2000);
      carregarRelacoes(equipamento);
    } catch (e) { setMsg({ tipo: 'erro', texto: e.message }); }
  };

  const removerRelacao = async (id) => {
    await fetch(`/api/topologia/${id}`, { method: 'DELETE' });
    carregarRelacoes(equipamento);
  };

  // Edita porta de um lado específico da relação (PATCH pelo id)
  const editarPorta = async (id, campo, valor) => {
    await fetch(`/api/topologia/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [campo]: valor }),
    });
    carregarRelacoes(equipamento);
  };

  const tipo      = tipoEquip(equipamento);
  const temDownstream = equipamento && !APENAS_UPSTREAM.includes(tipo);
  const upstreams  = relacoes.filter(r => r.equipamento === equipamento);
  const downstreams = relacoes.filter(r => r.upstream   === equipamento);

  return (
    <div className="flex min-h-screen" style={{ background: theme.colorBg }}>
      <Sidebar />
      <main className="ml-60 flex-1 flex flex-col min-h-screen">

        <header className="sticky top-0 z-30 backdrop-blur border-b px-8 py-4"
                style={{ background: `${theme.colorBg}e6`, borderColor: theme.colorBorder }}>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <GitFork size={18} className="text-[#9C27FF]" />
            Equipamentos
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">Gerencie as relações upstream/downstream de cada equipamento</p>
        </header>

        <div className="flex-1 px-8 py-6">

          {/* ── Seleção do equipamento ── */}
          <div className="max-w-xl mb-8 rounded-xl border p-5 space-y-4"
               style={{ background: theme.colorSurface, borderColor: theme.colorBorder }}>
            <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: theme.colorSurface2 }}>
              {[['hostname','Por hostname'],['erb','Por sigla ERB']].map(([v,l]) => (
                <button key={v} onClick={() => { setModoSelecao(v); setEquipsErb([]); setBuscouErb(false); }}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all
                          ${modoSelecao === v ? 'bg-brand text-white' : 'text-[#6B7280] hover:text-white'}`}>
                  {l}
                </button>
              ))}
            </div>

            {modoSelecao === 'hostname' && (
              <HostnameCombobox value={equipamento} onChange={setEquipamento}
                                placeholder="Digite parte do hostname..." />
            )}

            {modoSelecao === 'erb' && (
              <div className="space-y-3">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Sigla ERB</label>
                    <input value={siglaErb} onChange={e => setSiglaErb(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && buscarPorErb()}
                           placeholder="ex: VMA"
                           className="w-full bg-surface-2 border border-surface-3 text-white rounded-lg px-3 py-2 text-xs
                                      font-mono focus:outline-none focus:border-brand-light placeholder-[#6B7280]" />
                  </div>
                  <div className="w-20 space-y-1">
                    <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">UF</label>
                    <input value={ufErb} onChange={e => setUfErb(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && buscarPorErb()}
                           placeholder="PE"
                           className="w-full bg-surface-2 border border-surface-3 text-white rounded-lg px-3 py-2 text-xs
                                      font-mono focus:outline-none focus:border-brand-light placeholder-[#6B7280]" />
                  </div>
                  <button onClick={buscarPorErb} disabled={!siglaErb.trim() || loadingErb}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white
                                     disabled:opacity-40 flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#660099,#9C27FF)' }}>
                    {loadingErb ? <Loader2 size={12} className="animate-spin"/> : <Search size={12}/>} Buscar
                  </button>
                </div>
                {buscouErb && equipsErb.length === 0 && (
                  <p className="text-xs text-[#6B7280]">Nenhum equipamento encontrado.</p>
                )}
                {equipsErb.length > 0 && (
                  <div className="rounded-lg border border-surface-3 overflow-hidden max-h-40 overflow-y-auto scrollbar-thin">
                    {equipsErb.map(o => {
                      const t = tipoEquip(o.sigla); const cfg = TIPO_EQUIP[t];
                      return (
                        <button key={o.sigla}
                                onClick={() => { setEquipamento(o.sigla); setModoSelecao('hostname'); setEquipsErb([]); setBuscouErb(false); }}
                                className="w-full text-left px-3 py-2.5 hover:bg-brand-subtle transition-colors flex items-center gap-2 border-t border-surface-3 first:border-0">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                                style={{ color: cfg.border, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                          <span className="text-white font-mono text-xs flex-1 truncate">{o.sigla}</span>
                          <span className="text-xs flex-shrink-0" style={{ color: STATUS_CLS[(o.status||'').toLowerCase()] || '#6B7280' }}>{o.status}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Diagrama visual ── */}
          {equipamento && (() => {
            // Separa upstreams reais de vizinhos
            const upstreamsReais = upstreams.filter(r => classificarRelacao(tipo, tipoEquip(r.upstream)) === 'Upstream');
            const vizinhos       = upstreams.filter(r => classificarRelacao(tipo, tipoEquip(r.upstream)) === 'Vizinho');

            // Agrupa links por hostname
            function agrupar(lista, hostnameKey) {
              const map = new Map();
              for (const r of lista) {
                const h = r[hostnameKey];
                if (!map.has(h)) map.set(h, []);
                map.get(h).push(r);
              }
              return [...map.entries()].map(([h, rows]) => ({ hostname: h, rows }));
            }
            const upstreamsAgrupados  = agrupar(upstreamsReais, 'upstream');
            const vizinhosAgrupados   = agrupar(vizinhos, 'upstream');
            const downstreamsAgrupados = agrupar(downstreams, 'equipamento');

            return (
              <div className="select-none w-full overflow-x-auto pb-4">

                {/* Feedback */}
                {msg && (
                  <div className={`mb-6 flex items-center gap-2 text-sm px-4 py-2 rounded-lg w-fit mx-auto
                    ${msg.tipo === 'ok' ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'}`}>
                    {msg.tipo === 'ok' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
                    {msg.texto}
                  </div>
                )}

                {/* UPSTREAMS REAIS — acima */}
                <div className="flex flex-col items-center mb-2">
                  <div className="text-xs font-semibold text-[#22C55E]/70 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <ArrowUp size={12}/> Upstream
                  </div>
                  <div className="flex items-start gap-6 flex-wrap justify-center">
                    {upstreamsAgrupados.map(({ hostname: h, rows }) => (
                      <No key={h} hostname={h} tipoCentral={tipo}
                          links={rows.map(r => ({
                            id: r.id,
                            portaLocal: r.porta_upstream,
                            portaRemota: r.porta_equipamento,
                            onEditLocal:  v => editarPorta(r.id, 'porta_upstream', v),
                            onEditRemota: v => editarPorta(r.id, 'porta_equipamento', v),
                            onRemove: () => removerRelacao(r.id),
                          }))} />
                    ))}
                    <NoAdicionar label="+ Upstream"
                                 tipoCentral={tipo}
                                 hostnameCentral={equipamento}
                                 onConfirm={(h, pe, pu) => salvarRelacao(h, pe, pu, false)} />
                  </div>
                  <Seta dir="down" />
                </div>

                {/* LINHA CENTRAL: vizinhos ── central ── vizinhos */}
                <div className="flex items-center justify-center gap-0">

                  {/* Vizinhos à esquerda */}
                  <div className="flex items-center gap-3">
                    {vizinhosAgrupados.map(({ hostname: h, rows }) => (
                      <div key={h} className="flex items-center gap-2">
                        <No hostname={h} tipoCentral={tipo}
                            links={rows.map(r => ({
                              id: r.id,
                              portaLocal: r.porta_upstream,
                              portaRemota: r.porta_equipamento,
                              onEditLocal:  v => editarPorta(r.id, 'porta_upstream', v),
                              onEditRemota: v => editarPorta(r.id, 'porta_equipamento', v),
                              onRemove: () => removerRelacao(r.id),
                            }))} />
                        <div className="w-8 h-0.5 flex-shrink-0" style={{ background: '#F59E0B44' }}/>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <NoAdicionar label="+ Vizinho"
                                   tipoCentral={tipo}
                                   hostnameCentral={equipamento}
                                   onConfirm={(h, pe, pu) => salvarRelacao(h, pe, pu, false)} />
                      <div className="w-8 h-0.5 flex-shrink-0" style={{ background: '#F59E0B44' }}/>
                    </div>
                  </div>

                  {/* NÓ CENTRAL — agrupa relações por vizinho, mostra porta central de cada link */}
                  <No hostname={equipamento} isCentral
                      relacoes={[
                        ...upstreamsAgrupados.flatMap(({ hostname: h, rows }) =>
                          rows.map((r, i) => ({
                            id: r.id, outro: h,
                            showLabel: i === 0,
                            portaCentral: r.porta_equipamento,
                            onEdit: v => editarPorta(r.id, 'porta_equipamento', v),
                          }))
                        ),
                        ...vizinhosAgrupados.flatMap(({ hostname: h, rows }) =>
                          rows.map((r, i) => ({
                            id: r.id, outro: h,
                            showLabel: i === 0,
                            portaCentral: r.porta_equipamento,
                            onEdit: v => editarPorta(r.id, 'porta_equipamento', v),
                          }))
                        ),
                        ...downstreamsAgrupados.flatMap(({ hostname: h, rows }) =>
                          rows.map((r, i) => ({
                            id: r.id, outro: h,
                            showLabel: i === 0,
                            portaCentral: r.porta_upstream,
                            onEdit: v => editarPorta(r.id, 'porta_upstream', v),
                          }))
                        ),
                      ]} />

                </div>

                {/* DOWNSTREAMS — abaixo */}
                {temDownstream && (
                  <div className="flex flex-col items-center mt-2">
                    <Seta dir="down" />
                    <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <ArrowDown size={12}/> Downstream
                    </div>
                    <div className="flex items-start gap-6 flex-wrap justify-center">
                      {downstreamsAgrupados.map(({ hostname: h, rows }) => (
                        <No key={h} hostname={h} tipoCentral={tipo}
                            links={rows.map(r => ({
                              id: r.id,
                              portaLocal: r.porta_equipamento,
                              portaRemota: r.porta_upstream,
                              onEditLocal:  v => editarPorta(r.id, 'porta_equipamento', v),
                              onEditRemota: v => editarPorta(r.id, 'porta_upstream', v),
                              onRemove: () => removerRelacao(r.id),
                            }))} />
                      ))}
                      <NoAdicionar label="+ Downstream"
                                   tipoCentral={tipo}
                                   hostnameCentral={equipamento}
                                   onConfirm={(h, pe, pu) => salvarRelacao(h, pe, pu, true)} />
                    </div>
                  </div>
                )}

                {!temDownstream && vizinhos.length === 0 && upstreamsReais.length === 0 && (
                  <p className="text-center mt-3 text-xs text-[#6B7280] italic">
                    Nenhuma relação cadastrada ainda.
                  </p>
                )}
              </div>
            );
          })()}

          {!equipamento && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-subtle flex items-center justify-center mb-4">
                <GitFork size={28} className="text-brand-light"/>
              </div>
              <h3 className="text-white font-semibold text-base mb-1">Selecione um equipamento</h3>
              <p className="text-[#6B7280] text-sm max-w-xs">
                Busque pelo hostname ou pela sigla da ERB para gerenciar os vizinhos.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
