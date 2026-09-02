import { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  MarkerType, Position, Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Network, Search, Loader2, X,
  AlertCircle, ChevronRight, ChevronDown,
  Wifi, Server, Activity, Copy, Check
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../ThemeContext';

const STATUS_CLS = {
  'ativado':    'text-[#22C55E]',
  'planejado':  'text-[#3B82F6]',
  'desativado': 'text-[#EF4444]',
};

// Combobox com autocomplete para busca por hostname
function BuscaCombobox({ value, onChange, onConsultar, loading }) {
  const [query, setQuery]   = useState('');
  const [opts, setOpts]     = useState([]);
  const [open, setOpen]     = useState(false);
  const [searching, setSearching] = useState(false);
  const ref = useRef(); const timer = useRef();

  useEffect(() => { if (!value) setQuery(''); }, [value]);

  const search = (q) => {
    clearTimeout(timer.current);
    if (!q.trim()) { setOpts([]); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try { const r = await fetch(`/api/topologia/buscar?q=${encodeURIComponent(q)}`); setOpts(await r.json()); }
      finally { setSearching(false); }
    }, 250);
  };

  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      <input type="text"
             value={open ? query : value}
             onChange={e => { setQuery(e.target.value); search(e.target.value); setOpen(true); if (!e.target.value) onChange(''); }}
             onFocus={() => setOpen(true)}
             onKeyDown={e => { if (e.key === 'Escape') setOpen(false); if (e.key === 'Enter') { setOpen(false); onConsultar(value); } }}
             placeholder="Digite parte do hostname..."
             className="w-full bg-surface-2 border border-surface-3 text-white rounded-lg px-3 py-2.5 pr-8
                        text-sm font-mono focus:outline-none focus:border-brand-light transition-colors placeholder-[#6B7280]" />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
        {searching ? <Loader2 size={13} className="animate-spin text-[#6B7280]"/>
          : value ? <button onClick={() => { onChange(''); setQuery(''); }} className="text-[#6B7280] hover:text-white"><X size={13}/></button>
          : <Search size={13} className="text-[#6B7280] pointer-events-none"/>}
      </div>
      {open && opts.length > 0 && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-surface-2 border border-surface-3
                        rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto scrollbar-thin"
             style={{ minWidth: '480px' }}>
          {opts.map(o => {
            const cfg = TIPO_CONFIG[o.sigla?.toLowerCase().includes('-hl4-') ? 'hl4'
              : o.sigla?.toLowerCase().includes('-hl5d-') ? 'hl5d'
              : o.sigla?.toLowerCase().includes('-hl5g-') ? 'hl5g'
              : o.sigla?.toLowerCase().includes('-gwc-') ? 'gwc'
              : o.sigla?.toLowerCase().includes('-gwd-') ? 'gwd'
              : o.sigla?.toLowerCase().includes('-gws-') ? 'gws' : 'outro'] || TIPO_CONFIG.outro;
            return (
              <button key={o.sigla}
                      onClick={() => { onChange(o.sigla); setQuery(''); setOpen(false); onConsultar(o.sigla); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-brand-subtle transition-colors flex items-center gap-3">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ color: cfg.border, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                <span className="text-white font-mono text-sm flex-1">{o.sigla}</span>
                <span className="text-xs flex-shrink-0"
                      style={{ color: o.status?.toLowerCase() === 'ativado' ? '#22C55E' : o.status?.toLowerCase() === 'desativado' ? '#EF4444' : '#3B82F6' }}>
                  {o.status}
                </span>
                {o.endereco_ip && <span className="text-xs text-[#6B7280] flex-shrink-0 font-mono">{o.endereco_ip}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Cores por tipo de equipamento
const TIPO_CONFIG = {
  hl4:   { bg: '#3B0764', border: '#7C3AED', label: 'HL4',   familia: 'Fusion'  },
  hl5d:  { bg: '#4C1D95', border: '#8B5CF6', label: 'HL5D',  familia: 'Fusion'  },
  hl5g:  { bg: '#5B21B6', border: '#A78BFA', label: 'HL5G',  familia: 'Fusion'  },
  gwc:   { bg: '#1E3A5F', border: '#2563EB', label: 'GWC',   familia: 'Legado'  },
  gwd:   { bg: '#1D4ED8', border: '#3B82F6', label: 'GWD',   familia: 'Legado'  },
  gws:   { bg: '#2563EB', border: '#60A5FA', label: 'GWS',   familia: 'Legado'  },
  outro: { bg: '#374151', border: '#6B7280', label: '?',     familia: 'Outros'  },
};


// Combobox com busca na API

// Painel lateral do nó selecionado
function NodePanel({ no, onClose }) {
  if (!no) return null;
  const cfg = TIPO_CONFIG[no.tipo] || TIPO_CONFIG.outro;
  return (
    <div className="absolute top-4 right-4 z-20 w-72 rounded-xl border border-surface-3 bg-surface shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-3"
           style={{ background: cfg.bg }}>
        <div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md mr-2"
                style={{ background: cfg.border, color: '#fff' }}>{cfg.label}</span>
          <span className="text-white/70 text-xs">{cfg.familia}</span>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white"><X size={14}/></button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Hostname</p>
          <p className="text-white font-mono text-xs break-all">{no.id}</p>
        </div>
        {no.status && (
          <div className="flex items-center gap-2">
            <Activity size={13} className="text-[#6B7280]" />
            <span className={`text-sm font-semibold ${STATUS_CLS[(no.status||'').toLowerCase()] || 'text-[#6B7280]'}`}>
              {no.status}
            </span>
          </div>
        )}
        {no.endereco_ip && (
          <div className="flex items-center gap-2">
            <Server size={13} className="text-[#6B7280]" />
            <span className="text-white font-mono text-xs">{no.endereco_ip}</span>
          </div>
        )}
        {(TIPOS_COM_ERB.includes(no.tipo) || no.raiz) && no.erbs_atendidas?.length > 0 && (
          <div>
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-2 flex items-center gap-1">
              <Wifi size={11}/> ERBs atendidas ({no.erbs_atendidas.length})
            </p>
            <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin">
              {no.erbs_atendidas.map((e, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-md bg-surface-2">
                  <span className="text-brand-light font-bold text-xs w-10 flex-shrink-0">{e.sigla_erb}</span>
                  <span className="text-[#B3B3B3] text-xs truncate">{e.nome_site}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {(TIPOS_COM_ERB.includes(no.tipo) || no.raiz) && (!no.erbs_atendidas || no.erbs_atendidas.length === 0) && (
          <p className="text-xs text-[#6B7280] italic">Nenhuma ERB atendida diretamente</p>
        )}
      </div>
    </div>
  );
}

const TIPO_SERVICO_CLS = {
  '2G':             { bg: 'rgba(139,92,246,0.2)',  border: '#8B5CF6', color: '#A78BFA' },
  '3G':             { bg: 'rgba(109,40,217,0.2)',  border: '#6D28D9', color: '#A78BFA' },
  '4G':             { bg: 'rgba(79,70,229,0.2)',   border: '#4F46E5', color: '#818CF8' },
  '5G':             { bg: 'rgba(16,185,129,0.15)', border: '#10B981', color: '#34D399' },
  'MULTISERVIÇO (3G+4G+5G)': { bg: 'rgba(159,39,255,0.2)', border: '#9C27FF', color: '#C77DFF' },
  'SWA':            { bg: 'rgba(37,99,235,0.2)',   border: '#2563EB', color: '#60A5FA' },
  'Gerência Fonte': { bg: 'rgba(0,212,255,0.15)',  border: '#00D4FF', color: '#67E8F9' },
  'DCN Rádio':      { bg: 'rgba(0,212,255,0.15)',  border: '#00D4FF', color: '#67E8F9' },
  'Outros':         { bg: 'rgba(107,114,128,0.2)', border: '#6B7280', color: '#9CA3AF' },
};

// Nó de equipamento (HL/GW)
function CustomNode({ data }) {
  const cfg = TIPO_CONFIG[data.tipo] || TIPO_CONFIG.outro;
  return (
    <>
      <Handle type="target" position={Position.Top}    style={{ background: cfg.border, border: 'none', width: 8, height: 8 }} />
      <Handle type="target" position={Position.Left}   id="left"  style={{ background: cfg.border, border: 'none', width: 8, height: 8, opacity: 0 }} />
      <Handle type="source" position={Position.Right}  id="right" style={{ background: cfg.border, border: 'none', width: 8, height: 8, opacity: 0 }} />
      <div onClick={() => data.onSelect(data)}
           className="cursor-pointer rounded-xl px-4 py-3 min-w-[180px] text-center transition-all"
           style={{
             background: cfg.bg,
             border: `2px solid ${data.raiz ? '#C77DFF' : cfg.border}`,
             boxShadow: data.raiz ? `0 0 16px ${cfg.border}88` : 'none',
           }}>
        <div className="text-[10px] font-bold mb-1" style={{ color: cfg.border }}>{cfg.label}</div>
        <div className="text-white font-mono text-xs break-all leading-tight">{data.label}</div>
        {data.status && (
          <div className={`text-[10px] mt-1 font-semibold ${STATUS_CLS[(data.status||'').toLowerCase()] || 'text-[#6B7280]'}`}>
            {data.status}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: cfg.border, border: 'none', width: 8, height: 8 }} />
    </>
  );
}

// Nó de ERB (folha do grafo)
function ErbNode({ data }) {
  return (
    <>
      <Handle type="target" position={Position.Top}  style={{ background: '#5B21B6', border: 'none', width: 8, height: 8 }} />
      <Handle type="target" position={Position.Left} id="left" style={{ background: '#5B21B6', border: 'none', width: 8, height: 8 }} />
      <div onClick={() => data.onSelect(data)}
           className="cursor-pointer rounded-xl px-3 py-2.5 min-w-[150px] transition-all"
           style={{
             background: '#1A0A2E',
             border: '1.5px solid #5B21B6',
             boxShadow: '0 0 10px rgba(91,33,182,0.3)',
           }}>
        <div className="text-[10px] font-bold text-[#A78BFA] mb-1">ERB</div>
        <div className="text-white font-bold text-xs">{data.sigla_erb}</div>
        <div className="text-[#B3B3B3] text-[10px] truncate mb-2" title={data.nome_site}>{data.nome_site}</div>
      {data.servicos_ativos?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.servicos_ativos.map(s => {
            const sc = TIPO_SERVICO_CLS[s] || TIPO_SERVICO_CLS['Outros'];
            return (
              <span key={s} className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                {s}
              </span>
            );
          })}
        </div>
      )}
      {(!data.servicos_ativos || data.servicos_ativos.length === 0) && (
        <span className="text-[9px] text-[#6B7280] italic">Sem serviços ativos</span>
      )}
      </div>
    </>
  );
}

const nodeTypes = { custom: CustomNode, erb: ErbNode };

// Classifica relação entre dois tipos de equipamento
function classificarRelacaoTipo(tipoNo, tipoUpstream) {
  const pares = [['hl5d','hl5d'],['hl5g','hl5g'],['gwd','gwd'],['gws','gws']];
  return pares.some(([a,b]) => a === tipoNo && b === tipoUpstream) ? 'vizinho' : 'upstream';
}

// Tipos que exibem ERBs no grafo
const TIPOS_COM_ERB = ['hl5g', 'gws'];

// Constrói layout hierárquico para o grafo
function buildGraph(nos, arestas, onSelect) {
  const ORDEM  = { hl4: 0, gwc: 0, hl5d: 1, gwd: 1, hl5g: 2, gws: 2, outro: 3 };
  const NODE_W = 220;  // largura estimada nó equipamento
  const ERB_W  = 175;  // largura estimada nó ERB
  const GAP_X  = 60;   // gap horizontal mínimo entre grupos
  const GAP_Y  = 220;  // gap vertical entre camadas

  // ERBs: renderizar para HL5G/GWS sempre, e para qualquer tipo se for o nó raiz
  const erbNos    = [];
  const erbArestas = [];
  for (const n of nos) {
    if (!TIPOS_COM_ERB.includes(n.tipo) && !n.raiz) continue;
    for (const erb of (n.erbs_atendidas || [])) {
      const erbId = `erb:${n.id}:${erb.sigla_erb}`;
      erbNos.push({ id: erbId, tipo: 'erb', ...erb, _pai: n.id, raiz: false, erbs_atendidas: [] });
      erbArestas.push({ upstream: n.id, equipamento: erbId, tipo_link: 'erb' });
    }
  }

  const todosNos     = [...nos, ...erbNos];
  const todasArestas = [...arestas, ...erbArestas];

  function tipoNo(id) {
    return nos.find(x => x.id === id)?.tipo || 'outro';
  }

  const arestasClassificadas = arestas.map(a => ({
    ...a,
    relacao: classificarRelacaoTipo(tipoNo(a.equipamento), tipoNo(a.upstream)),
  }));

  // Monta camadas — vizinhos do nó raiz ficam na mesma camada
  const layers = {};
  const raiz = nos.find(r => r.raiz);
  const ordRaiz = raiz ? (ORDEM[raiz.tipo] ?? 3) : 1;

  for (const n of nos) {
    const ehVizinhoDeRaiz = arestasClassificadas.some(
      a => a.relacao === 'vizinho' &&
           (a.equipamento === n.id || a.upstream === n.id) &&
           nos.some(r => r.raiz && (r.id === a.equipamento || r.id === a.upstream) && r.id !== n.id)
    );
    const ord = ehVizinhoDeRaiz ? ordRaiz : (ORDEM[n.tipo] ?? 3);
    if (!layers[ord]) layers[ord] = [];
    if (!layers[ord].includes(n)) layers[ord].push(n);
  }

  const posMap = {};
  const layerKeys = Object.keys(layers).map(Number).sort();

  // Agrupa ERBs por pai para calcular largura de cada "grupo"
  const erbPorPai = {};
  for (const erb of erbNos) {
    if (!erbPorPai[erb._pai]) erbPorPai[erb._pai] = [];
    erbPorPai[erb._pai].push(erb);
  }

  // Calcula largura ocupada por cada nó (raiz não conta ERBs pois ficam à direita)
  function larguraGrupo(n) {
    if (n.raiz) return NODE_W;
    const erbs = erbPorPai[n.id] || [];
    if (erbs.length === 0) return NODE_W;
    return Math.max(NODE_W, erbs.length * ERB_W + (erbs.length - 1) * GAP_X);
  }

  // Posiciona equipamentos por camada com largura dinâmica
  for (const layer of layerKeys) {
    const items = layers[layer];
    const larguras = items.map(larguraGrupo);
    const totalW   = larguras.reduce((s, w) => s + w, 0) + (items.length - 1) * GAP_X;
    let x = -totalW / 2;
    items.forEach((item, i) => {
      const w = larguras[i];
      posMap[item.id] = { x: x + w / 2, y: layer * GAP_Y };
      x += w + GAP_X;
    });
  }

  // Posiciona ERBs:
  // - nó raiz → ERBs empilhadas à DIREITA no mesmo Y, espaçadas verticalmente
  // - demais nós → ERBs abaixo, centralizadas horizontalmente
  const ERB_GAP_V = 160; // espaçamento vertical entre ERBs à direita
  const ERB_OFFSET_X = NODE_W / 2 + GAP_X; // distância horizontal da borda direita do pai

  for (const [paiId, erbs] of Object.entries(erbPorPai)) {
    const paiPos  = posMap[paiId] || { x: 0, y: 0 };
    const paiNode = nos.find(n => n.id === paiId);
    const ehRaiz  = paiNode?.raiz;

    if (ehRaiz) {
      // ERBs à direita, empilhadas verticalmente centradas no Y do pai
      const totalH = erbs.length * ERB_W + (erbs.length - 1) * (ERB_GAP_V - ERB_W);
      const startY = paiPos.y - (erbs.length - 1) * ERB_GAP_V / 2;
      erbs.forEach((erb, i) => {
        posMap[erb.id] = {
          x: paiPos.x + ERB_OFFSET_X + ERB_W / 2,
          y: startY + i * ERB_GAP_V,
        };
      });
    } else {
      // ERBs abaixo, centralizadas horizontalmente
      const totalW = erbs.length * ERB_W + (erbs.length - 1) * GAP_X;
      erbs.forEach((erb, i) => {
        posMap[erb.id] = {
          x: paiPos.x - totalW / 2 + i * (ERB_W + GAP_X) + ERB_W / 2,
          y: paiPos.y + GAP_Y,
        };
      });
    }
  }

  // ERBs do raiz têm source/target à esquerda (vêm da direita do pai)
  const erbRaizIds = new Set(
    Object.entries(erbPorPai)
      .filter(([paiId]) => nos.find(n => n.id === paiId)?.raiz)
      .flatMap(([, erbs]) => erbs.map(e => e.id))
  );

  const nodes = todosNos.map(n => ({
    id: n.id,
    type: n.tipo === 'erb' ? 'erb' : 'custom',
    position: posMap[n.id] || { x: 0, y: 0 },
    data: { ...n, label: n.id, onSelect },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  }));

  // Mescla arestas de equipamentos classificadas com as de ERB
  const todasArestasClass = [
    ...arestasClassificadas.map(a => ({ ...a, tipo_link: a.relacao })),
    ...erbArestas,
  ];

  const edges = todasArestasClass.map((a, i) => {
    const isVizinho  = a.tipo_link === 'vizinho';
    const isErb      = a.tipo_link === 'erb';
    const isErbRaiz  = isErb && erbRaizIds.has(a.equipamento);
    return {
      id: `e${i}`,
      source: a.upstream,
      target: a.equipamento,
      type: isVizinho ? 'straight' : 'smoothstep',
      animated: false,
      sourceHandle: isErbRaiz ? 'right'  : undefined,
      targetHandle: isErbRaiz ? 'left'   : undefined,
      style: {
        stroke: isErb ? '#5B21B6' : isVizinho ? '#F59E0B' : '#6B7280',
        strokeWidth: isErb ? 1 : 1.5,
        strokeDasharray: isErb ? '4 3' : isVizinho ? '6 3' : undefined,
      },
      markerEnd: isVizinho ? undefined : { type: MarkerType.ArrowClosed, color: isErb ? '#5B21B6' : '#6B7280' },
      label: isVizinho ? 'vizinho' : '',
      labelStyle: { fill: '#F59E0B', fontSize: 10 },
    };
  });

  return { nodes, edges };
}

// Visualização em árvore
function ArvoreNo({ no, filhos, todos, arestas, onSelect, nivel = 0 }) {
  const [open, setOpen] = useState(nivel < 2);
  const cfg = TIPO_CONFIG[no.tipo] || TIPO_CONFIG.outro;
  const temFilhos = filhos.length > 0;
  return (
    <div>
      <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors"
           style={{ paddingLeft: `${nivel * 24 + 8}px` }}
           onClick={() => { onSelect(no); if (temFilhos) setOpen(o => !o); }}>
        <span className="w-5 flex-shrink-0 text-[#6B7280]">
          {temFilhos ? (open ? <ChevronDown size={14}/> : <ChevronRight size={14}/>) : <span className="w-3.5"/>}
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
              style={{ background: cfg.bg, color: cfg.border, border: `1px solid ${cfg.border}` }}>
          {cfg.label}
        </span>
        <span className="text-white font-mono text-xs truncate">{no.id}</span>
        {no.status && (
          <span className={`ml-auto text-[10px] flex-shrink-0 ${STATUS_CLS[(no.status||'').toLowerCase()] || 'text-[#6B7280]'}`}>
            {no.status}
          </span>
        )}
      </div>

      {/* ERBs atendidas como folhas na árvore — HL5G/GWS ou nó raiz */}
      {open && (TIPOS_COM_ERB.includes(no.tipo) || no.raiz) && no.erbs_atendidas?.length > 0 && no.erbs_atendidas.map(erb => (
        <div key={`${erb.sigla_erb}-${erb.uf_sigla_erb}`}
             className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors"
             style={{ paddingLeft: `${(nivel + 1) * 24 + 8}px` }}
             onClick={() => onSelect({ ...erb, tipo: 'erb', id: `erb:${no.id}:${erb.sigla_erb}` })}>
          <span className="w-5 flex-shrink-0" />
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ background: '#1A0A2E', color: '#A78BFA', border: '1px solid #5B21B6' }}>
            ERB
          </span>
          <div className="min-w-0">
            <div className="text-white font-bold text-xs">{erb.sigla_erb}
              <span className="text-[#6B7280] font-normal ml-1">{erb.uf_sigla_erb}</span>
            </div>
            <div className="text-[#B3B3B3] text-[10px] truncate">{erb.nome_site}</div>
            {erb.servicos_ativos?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {erb.servicos_ativos.map(s => {
                  const sc = TIPO_SERVICO_CLS[s] || TIPO_SERVICO_CLS['Outros'];
                  return (
                    <span key={s} className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                      {s}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ))}

      {open && [...new Map(filhos.map(f => [f.equipamento, f])).values()].map(f => {
        const fNo = todos.find(n => n.id === f.equipamento);
        if (!fNo) return null;
        const subFilhos = arestas.filter(a => a.upstream === fNo.id);
        return <ArvoreNo key={fNo.id} no={fNo} filhos={subFilhos} todos={todos} arestas={arestas} onSelect={onSelect} nivel={nivel + 1} />;
      })}
    </div>
  );
}

// Modal de relatório — carimbo copiável
function RelatorioModal({ grafo, onClose }) {
  const [copiado, setCopiado] = useState(false);

  if (!grafo) return null;

  // Coleta dados únicos
  const equipamentos = [...new Set(grafo.nos.filter(n => !n.raiz).map(n => n.id))].sort();
  const erbsMap = new Map();
  grafo.nos.forEach(n => {
    (n.erbs_atendidas || []).forEach(e => {
      const key = `${e.sigla_erb}|${e.uf_sigla_erb}`;
      if (!erbsMap.has(key)) erbsMap.set(key, e);
    });
  });
  const erbs = [...erbsMap.values()].sort((a, b) => a.sigla_erb.localeCompare(b.sigla_erb));

  const texto = [
    `📡 Topologia: ${grafo.hostname}`,
    ``,
    `Equipamentos no caminho: ${equipamentos.length}`,
    `ERBs atendidas: ${erbs.length}`,
    ``,
    `--- EQUIPAMENTOS ---`,
    ...equipamentos.map((e, i) => `${i + 1}. ${e}`),
    ``,
    `--- ERBs ---`,
    ...erbs.map((e, i) => `${i + 1}. ${e.sigla_erb} (${e.uf_sigla_erb}) — ${e.nome_site || '—'}`),
  ].join('\n');

  const copiar = () => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)' }}
         onClick={onClose}>
      <div className="rounded-2xl border shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
           style={{ background: '#121212', borderColor: '#2A2A2A' }}
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b"
             style={{ borderColor: '#2A2A2A' }}>
          <div>
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Wifi size={15} className="text-[#A78BFA]"/>
              Relatório de Topologia
            </h3>
            <p className="text-[#6B7280] text-xs mt-0.5 font-mono">{grafo.hostname}</p>
          </div>
          <button onClick={onClose} className="text-[#6B7280] hover:text-white transition-colors">
            <X size={16}/>
          </button>
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-2 gap-3 px-6 py-4 border-b" style={{ borderColor: '#2A2A2A' }}>
          <div className="rounded-xl p-3 text-center" style={{ background: '#1E1E1E' }}>
            <p className="text-2xl font-bold text-white">{equipamentos.length}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">Equipamentos</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: '#1E1E1E' }}>
            <p className="text-2xl font-bold" style={{ color: '#A78BFA' }}>{erbs.length}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">ERBs atendidas</p>
          </div>
        </div>

        {/* Conteúdo copiável */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin space-y-4">
          {/* Equipamentos */}
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
              Equipamentos ({equipamentos.length})
            </p>
            <div className="space-y-1">
              {equipamentos.map((e, i) => (
                <div key={e} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                     style={{ background: '#1E1E1E' }}>
                  <span className="text-[#6B7280] text-xs w-5 flex-shrink-0">{i + 1}.</span>
                  <span className="text-white font-mono text-xs">{e}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ERBs */}
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
              ERBs ({erbs.length})
            </p>
            <div className="space-y-1">
              {erbs.map((e, i) => (
                <div key={`${e.sigla_erb}|${e.uf_sigla_erb}`}
                     className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                     style={{ background: '#1E1E1E' }}>
                  <span className="text-[#6B7280] text-xs w-5 flex-shrink-0">{i + 1}.</span>
                  <span className="font-bold text-xs w-10 flex-shrink-0" style={{ color: '#A78BFA' }}>
                    {e.sigla_erb}
                  </span>
                  <span className="text-[#6B7280] text-xs flex-shrink-0">{e.uf_sigla_erb}</span>
                  <span className="text-white text-xs truncate">{e.nome_site || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botão copiar */}
        <div className="px-6 py-4 border-t" style={{ borderColor: '#2A2A2A' }}>
          <button onClick={copiar}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
                  style={{ background: copiado ? '#22C55E' : 'linear-gradient(135deg,#660099,#9C27FF)' }}>
            {copiado ? <><Check size={14}/> Copiado!</> : <><Copy size={14}/> Copiar relatório</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TopologiaPage() {
  const { theme } = useTheme();
  const [view, setView]             = useState('grafo');
  const [busca, setBusca]           = useState('');
  const [grafo, setGrafo]           = useState(null);
  const [noSelecionado, setNoSelecionado] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [erro, setErro]             = useState('');
  const [modalAberto, setModalAberto] = useState(false);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);

  const handleSelect = useCallback((no) => setNoSelecionado(no), []);

  const consultar = async (hostname) => {
    const h = (hostname || busca).trim();
    if (!h) return;
    setBusca(h);
    setLoading(true);
    setErro('');
    setGrafo(null);
    setNoSelecionado(null);
    try {
      const res  = await fetch(`/api/topologia/${encodeURIComponent(h)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      if (data.nos.length === 0) { setErro('Nenhuma relação cadastrada para este equipamento.'); }
      else {
        setGrafo(data);
        const { nodes, edges } = buildGraph(data.nos, data.arestas, handleSelect);
        setRfNodes(nodes);
        setRfEdges(edges);
      }
    } catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  };

  // Raízes da árvore = nós sem upstream cadastrado no grafo
  const raizesArvore = grafo
    ? grafo.nos.filter(n => !grafo.arestas.some(a => a.equipamento === n.id))
    : [];

  return (
    <div className="flex min-h-screen" style={{ background: theme.colorBg }}>
      <Sidebar />
      <main className="ml-60 flex-1 flex flex-col min-h-screen">

        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur border-b px-8 py-4"
                style={{ background: `${theme.colorBg}e6`, borderColor: theme.colorBorder }}>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Network size={18} className="text-[#9C27FF]" />
              Topologia de Equipamentos
            </h1>
            <p className="text-xs text-[#6B7280] mt-0.5">Visualização de dependências upstream/downstream</p>
          </div>
        </header>

        <div className="flex-1 flex flex-col px-8 py-6">
            <>
              <div className="flex items-end gap-3 mb-6">
                <div className="flex-1 space-y-1.5 max-w-xl">
                  <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block">
                    Hostname do equipamento
                  </label>
                  <BuscaCombobox value={busca} onChange={setBusca}
                                 onConsultar={consultar} loading={loading} />
                </div>
                <button onClick={() => consultar()} disabled={!busca.trim() || loading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white
                                   bg-brand-gradient hover:opacity-90 disabled:opacity-40 transition-opacity whitespace-nowrap">
                  {loading ? <><Loader2 size={14} className="animate-spin"/> Buscando...</> : <><Search size={14}/> Consultar</>}
                </button>

                {/* Contador ERBs — aparece após consultar */}
                {grafo && (() => {
                  const erbs = new Set();
                  grafo.nos.forEach(n => (n.erbs_atendidas || []).forEach(e => erbs.add(`${e.sigla_erb}|${e.uf_sigla_erb}`)));
                  const total = erbs.size;
                  return (
                    <button onClick={() => setModalAberto(true)}
                            className="flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all hover:opacity-90 active:scale-95 ml-2"
                            style={{
                              background: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.15))',
                              border: '2px solid rgba(239,68,68,0.6)',
                              boxShadow: '0 0 20px rgba(239,68,68,0.25)',
                            }}>
                      <Wifi size={20} className="text-[#EF4444] flex-shrink-0"/>
                      <div className="text-left">
                        <p className="text-3xl font-black leading-none tracking-tight" style={{ color: '#EF4444' }}>{total}</p>
                        <p className="text-[10px] text-[#EF4444]/80 mt-0.5 uppercase tracking-widest font-semibold">ERBs</p>
                      </div>
                    </button>
                  );
                })()}
              </div>

              {erro && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#EF4444] mb-4">
                  <AlertCircle size={16}/><span className="text-sm">{erro}</span>
                </div>
              )}

              {grafo && (
                <>
                  {/* Toggle grafo / árvore */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-[#6B7280]">
                      {grafo.nos.length} nós · {grafo.arestas.length} conexões
                    </p>
                    <div className="flex gap-1 p-1 rounded-lg" style={{ background: theme.colorSurface2 }}>
                      {[['grafo','Grafo'],['arvore','Árvore']].map(([v,l]) => (
                        <button key={v} onClick={() => setView(v)}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all
                                  ${view === v ? 'bg-brand text-white' : 'text-[#6B7280] hover:text-white'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Legenda */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(TIPO_CONFIG).filter(([k]) => k !== 'outro').map(([k, v]) => (
                      <span key={k} className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold"
                            style={{ background: '#0D0D0D', color: '#FFFFFF', border: `1px solid ${v.border}` }}>
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: v.border }} />
                        {v.label}
                        <span className="font-normal text-[#9CA3AF]">{v.familia}</span>
                      </span>
                    ))}
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold"
                          style={{ background: '#0D0D0D', color: '#FFFFFF', border: '1px solid #5B21B6' }}>
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: '#1A0A2E', border: '1px solid #5B21B6' }} />
                      ERB <span className="font-normal text-[#9CA3AF]">Site</span>
                    </span>
                  </div>

                  {/* Visualizações */}
                  <div className="relative flex-1 min-h-[500px] rounded-xl border border-surface-3 overflow-hidden"
                       style={{ background: '#0D0D0D' }}>

                    {view === 'grafo' && (
                      <ReactFlow nodes={rfNodes} edges={rfEdges}
                                 onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                                 nodeTypes={nodeTypes} fitView
                                 style={{ background: 'transparent' }}>
                        <Background color="#2A2A2A" gap={20} />
                        <Controls style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }} />
                        <MiniMap nodeColor={n => TIPO_CONFIG[n.data?.tipo]?.border || '#6B7280'}
                                 style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }} />
                      </ReactFlow>
                    )}

                    {view === 'arvore' && (
                      <div className="p-4 overflow-auto h-full scrollbar-thin">
                        {raizesArvore.length === 0
                          ? <p className="text-[#6B7280] text-sm">Nenhuma raiz encontrada na hierarquia.</p>
                          : raizesArvore.map(raiz => (
                              <ArvoreNo key={raiz.id} no={raiz}
                                        filhos={grafo.arestas.filter(a => a.upstream === raiz.id)}
                                        todos={grafo.nos} arestas={grafo.arestas}
                                        onSelect={handleSelect} nivel={0} />
                            ))
                        }
                      </div>
                    )}

                    <NodePanel no={noSelecionado} onClose={() => setNoSelecionado(null)} />
                  </div>
                </>
              )}

              {!grafo && !erro && !loading && (
                <div className="flex flex-col items-center justify-center h-72 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-brand-subtle flex items-center justify-center mb-4">
                    <Network size={28} className="text-brand-light"/>
                  </div>
                  <h3 className="text-white font-semibold text-base mb-1">Consulte a topologia</h3>
                  <p className="text-[#6B7280] text-sm max-w-xs">
                    Informe o hostname de um equipamento para visualizar sua árvore de dependências.
                  </p>
                </div>
              )}
            </>
        </div>
      </main>
      {modalAberto && <RelatorioModal grafo={grafo} onClose={() => setModalAberto(false)} />}
    </div>
  );
}
