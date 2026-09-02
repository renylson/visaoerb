import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, AlertCircle, ChevronDown, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ErbCard from '../components/ErbCard';
import OeTable from '../components/OeTable';
import EquipamentosTable from '../components/EquipamentosTable';

// Combobox com busca — abre dropdown ao focar, filtra ao digitar
function Combobox({ label, value, onChange, options, placeholder, disabled }) {
  const [open, setOpen]           = useState(false);
  const [query, setQuery]         = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef              = useRef();
  const inputRef                  = useRef();

  // Sincroniza o label quando value é limpo externamente
  useEffect(() => {
    if (!value) setSelectedLabel('');
  }, [value]);

  const displayText = selectedLabel;

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleSelect = (opt) => {
    onChange(opt.value, opt);
    setSelectedLabel(opt.label);
    setQuery('');
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setOpen(true);
    if (!e.target.value) onChange('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('', null);
    setQuery('');
    setSelectedLabel('');
    inputRef.current?.focus();
  };

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Navega com teclado
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    if (e.key === 'Enter' && filtered.length === 1) handleSelect(filtered[0]);
    if (e.key === 'ArrowDown') setOpen(true);
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={open ? query : displayText}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-surface-2 border border-surface-3 text-white rounded-lg
                     px-3 py-2.5 pr-16 text-sm focus:outline-none focus:border-brand-light transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed placeholder-[#6B7280]"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !disabled && (
            <button onClick={handleClear} className="text-[#6B7280] hover:text-white transition-colors p-0.5">
              <X size={12} />
            </button>
          )}
          <ChevronDown size={13} className={`text-[#6B7280] transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>

        {/* Dropdown */}
        {open && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface-2 border border-surface-3
                          rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto scrollbar-thin">
            {filtered.length === 0
              ? <p className="px-3 py-3 text-sm text-[#6B7280] text-center">Nenhum resultado</p>
              : filtered.map((o, i) => (
                  <button key={`${o.value}-${i}`} onClick={() => handleSelect(o)}
                          className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-brand-subtle
                            ${o.value === value ? 'text-brand-light font-semibold bg-brand-subtle' : 'text-white'}`}>
                    {o.label}
                  </button>
                ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

export default function VisaoERB() {
  const [ufs, setUfs]             = useState([]);
  const [siglas, setSiglas]       = useState([]);
  const [uf, setUf]               = useState('');
  const [sigla, setSigla]         = useState('');
  const [nomeSite, setNomeSite]   = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [erro, setErro]           = useState('');
  const [loadingUfs, setLoadingUfs] = useState(true);

  useEffect(() => {
    fetch('/visao/ufs')
      .then(r => r.json())
      .then(data => setUfs(data))
      .catch(() => setErro('Erro ao carregar UFs.'))
      .finally(() => setLoadingUfs(false));
  }, []);

  useEffect(() => {
    if (!uf) { setSiglas([]); setSigla(''); setNomeSite(''); return; }
    fetch(`/visao/siglas?uf=${uf}`)
      .then(r => r.json())
      .then(data => setSiglas(data))
      .catch(() => {});
    setSigla('');
    setNomeSite('');
    setResultado(null);
  }, [uf]);

  const consultar = async () => {
    if (!uf || !sigla) return;
    setLoading(true);
    setErro('');
    setResultado(null);
    try {
      const params = nomeSite ? `?nome_site=${encodeURIComponent(nomeSite)}` : '';
      const res  = await fetch(`/visao/${uf}/${sigla}${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro desconhecido');
      setResultado(data);
      if (!data.erb) setErro(`Nenhum site encontrado para ${sigla} / ${uf}.`);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      <Sidebar current="/" />

      <main className="ml-60 flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur border-b border-surface-3 px-8 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-shrink-0">
              <h1 className="text-lg font-bold text-white">Visão ERB</h1>
              <p className="text-xs text-[#6B7280] mt-0.5">Consulta de sites, serviços e equipamentos</p>
            </div>

            {/* Barra de busca */}
            <div className="flex items-end gap-3 flex-1 max-w-2xl justify-end">
              <div className="w-28">
                <Combobox
                  label="UF"
                  value={uf}
                  onChange={setUf}
                  placeholder={loadingUfs ? 'Carregando...' : 'Digite ou selecione'}
                  disabled={loadingUfs}
                  options={ufs.map(u => ({ value: u, label: u }))}
                />
              </div>
              <div className="w-[420px]">
                <Combobox
                  label="Sigla ERB"
                  value={sigla}
                  onChange={(val, opt) => {
                    setSigla(opt?.siglaErb || val.split('|')[0]);
                    setNomeSite(opt?.nomeSite || '');
                  }}
                  placeholder={uf ? 'Digite sigla ou nome...' : 'Primeiro selecione UF'}
                  disabled={!uf}
                  options={siglas.map(s => ({ value: `${s.sigla_erb}|${s.nome_site}`, label: `${s.sigla_erb} — ${s.nome_site}`, nomeSite: s.nome_site, siglaErb: s.sigla_erb }))}
                />
              </div>
              <button
                onClick={consultar}
                disabled={!uf || !sigla || loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white
                           bg-brand-gradient hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed
                           transition-opacity shadow-lg shadow-brand/20 whitespace-nowrap flex-shrink-0">
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Consultando...</>
                  : <><Search size={14} /> Consultar</>}
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <div className="flex-1 px-8 py-6">
          {!resultado && !erro && !loading && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-subtle flex items-center justify-center mb-4">
                <Search size={28} className="text-brand-light" />
              </div>
              <h3 className="text-white font-semibold text-base mb-1">Consulte um site</h3>
              <p className="text-[#6B7280] text-sm max-w-xs">
                Selecione ou digite a UF e a sigla da ERB para visualizar os dados completos do site.
              </p>
            </div>
          )}

          {erro && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#EF4444] mb-6">
              <AlertCircle size={16} />
              <span className="text-sm">{erro}</span>
            </div>
          )}

          {resultado && (
            <>
              <ErbCard erb={resultado.erb} />
              <EquipamentosTable equipamentos={resultado.equipamentos} />
              <OeTable oe={resultado.oe} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
