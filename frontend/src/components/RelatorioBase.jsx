import { useState, useEffect } from 'react';
import { Search, RotateCcw, Loader2, ChevronDown } from 'lucide-react';
import Sidebar from './Sidebar';
import { useTheme } from '../ThemeContext';

export default function RelatorioBase({ titulo, descricao, icone: Icon, endpoint, children, filtrosExtra }) {
  const { theme } = useTheme();
  const [ufs, setUfs]       = useState([]);
  const [uf, setUf]         = useState('');
  const [rows, setRows]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro]     = useState('');
  const [gerado, setGerado] = useState(false);
  const [extraParams, setExtraParams] = useState({});

  useEffect(() => {
    fetch('/api/relatorios/ufs').then(r => r.json()).then(setUfs).catch(() => {});
  }, []);

  const gerar = async () => {
    setLoading(true); setErro(''); setRows(null);
    const p = new URLSearchParams();
    if (uf) p.set('uf', uf);
    Object.entries(extraParams).forEach(([k,v]) => { if (v) p.set(k, v); });
    try {
      const r = await fetch(`${endpoint}?${p}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro);
      setRows(d); setGerado(true);
    } catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  };

  const limpar = () => { setUf(''); setRows(null); setGerado(false); setErro(''); setExtraParams({}); };

  return (
    <div className="flex min-h-screen" style={{ background: theme.colorBg }}>
      <Sidebar />
      <main className="ml-60 flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 backdrop-blur border-b px-8 py-4"
                style={{ background: `${theme.colorBg}e6`, borderColor: theme.colorBorder }}>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            {Icon && <Icon size={18} className="text-[#9C27FF]"/>}
            {titulo}
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">{descricao}</p>
        </header>

        <div className="flex-1 px-8 py-6">
          {/* Filtros */}
          <div className="rounded-2xl border p-6 mb-6"
               style={{ background: theme.colorSurface, borderColor: theme.colorBorder }}>
            <h3 className="text-sm font-semibold text-white mb-4">Filtros</h3>
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex flex-col gap-1.5 w-36">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">UF</label>
                <div className="relative">
                  <select value={uf} onChange={e => setUf(e.target.value)}
                          className="appearance-none w-full bg-surface-2 border border-surface-3 text-white rounded-lg
                                     px-3 py-2.5 text-sm focus:outline-none focus:border-brand-light cursor-pointer">
                    <option value="">Todas as UFs</option>
                    {ufs.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"/>
                </div>
              </div>

              {filtrosExtra && filtrosExtra({ extraParams, setExtraParams })}

              <div className="flex gap-2 pb-0.5">
                <button onClick={gerar} disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white
                                   bg-brand-gradient hover:opacity-90 disabled:opacity-40 transition-opacity whitespace-nowrap">
                  {loading ? <><Loader2 size={14} className="animate-spin"/> Gerando...</> : <><Search size={14}/> Gerar</>}
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

          {erro && (
            <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#EF4444] text-sm mb-4">{erro}</div>
          )}

          {rows !== null && children({ rows, uf, extraParams })}

          {!gerado && !loading && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-subtle flex items-center justify-center mb-4">
                {Icon && <Icon size={28} className="text-brand-light"/>}
              </div>
              <h3 className="text-white font-semibold text-base mb-1">Configure os filtros e gere o relatório</h3>
              <p className="text-[#6B7280] text-sm">Selecione a UF ou deixe em branco para todas.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
