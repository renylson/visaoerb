import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, Loader2, ChevronDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../ThemeContext';

export default function Importacao() {
  const { theme } = useTheme();
  const [tabelas, setTabelas]     = useState([]);
  const [tabela, setTabela]       = useState('');
  const [arquivo, setArquivo]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [fase, setFase]           = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro]           = useState('');
  const fileRef = useRef();
  const tickerRef = useRef();

  useEffect(() => {
    fetch('/upload/tabelas')
      .then(r => r.json())
      .then(data => { setTabelas(data); if (data.length) setTabela(data[0].key); })
      .catch(() => {});
  }, []);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) { setArquivo(f); setResultado(null); setErro(''); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tabela || !arquivo) return;

    setLoading(true);
    setResultado(null);
    setErro('');
    setProgresso(30);
    setFase('Enviando arquivo…');

    let pct = 30;
    tickerRef.current = setInterval(() => {
      pct = Math.min(pct + 4, 85);
      setProgresso(pct);
      setFase(pct < 60 ? 'Enviando arquivo…' : 'Processando registros no banco…');
    }, 800);

    try {
      const fd = new FormData();
      fd.append('arquivo', arquivo);
      const res  = await fetch(`/upload/${tabela}`, { method: 'POST', body: fd });
      const data = await res.json();
      clearInterval(tickerRef.current);
      setProgresso(100);
      setFase('Concluído!');
      setTimeout(() => {
        setLoading(false);
        setProgresso(0);
        if (!res.ok || data.erro) setErro(data.erro || 'Erro desconhecido.');
        else setResultado(data);
      }, 500);
    } catch {
      clearInterval(tickerRef.current);
      setLoading(false);
      setProgresso(0);
      setErro('Falha na comunicação com o servidor.');
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: theme.colorBg }}>
      <Sidebar current="/importacao" />

      <main className="ml-60 flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 backdrop-blur border-b px-8 py-4"
                style={{ background: `${theme.colorBg}e6`, borderColor: theme.colorBorder }}>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload size={18} className="text-[#9C27FF]" />
            Importação de Dados
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">Importe arquivos CSV, TXT ou XML para o banco de dados</p>
        </header>

        <div className="flex-1 flex items-start justify-center px-8 py-10">
          <div className="w-full max-w-lg">
            <form onSubmit={handleSubmit} className="rounded-xl border p-8 space-y-6"
                  style={{ background: theme.colorSurface, borderColor: theme.colorBorder }}>

              {/* Tabela */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  Tabela de destino
                </label>
                <div className="relative">
                  <select value={tabela} onChange={e => setTabela(e.target.value)}
                          className="appearance-none w-full rounded-lg px-3 py-2.5 pr-8 text-sm text-white
                                     focus:outline-none transition-colors cursor-pointer"
                          style={{ background: theme.colorSurface2, border: `1px solid ${theme.colorBorder}` }}>
                    {tabelas.map(t => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                </div>
              </div>

              {/* Arquivo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  Arquivo (CSV · TXT · XML)
                </label>
                <div onClick={() => fileRef.current.click()}
                     className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed cursor-pointer transition-colors hover:border-[#9C27FF]/60"
                     style={{ background: theme.colorSurface2, borderColor: theme.colorBorder }}>
                  <FileText size={18} className="text-[#6B7280] flex-shrink-0" />
                  <span className={`text-sm truncate ${arquivo ? 'text-white' : 'text-[#6B7280]'}`}>
                    {arquivo ? arquivo.name : 'Clique para escolher o arquivo…'}
                  </span>
                  <span className="ml-auto text-xs px-2.5 py-1 rounded-md flex-shrink-0 text-white"
                        style={{ background: theme.colorSurface }}>
                    Escolher
                  </span>
                  <input ref={fileRef} type="file" accept=".csv,.txt,.xml" className="hidden" onChange={handleFile} />
                </div>
              </div>

              {/* Barra de progresso */}
              {loading && (
                <div className="space-y-2">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme.colorBorder }}>
                    <div className="h-full rounded-full transition-all duration-300"
                         style={{ width: `${progresso}%`, background: `linear-gradient(90deg, ${theme.colorPrimary}, ${theme.colorPrimaryLight})` }} />
                  </div>
                  <p className="text-xs text-[#6B7280] text-center">{fase}</p>
                </div>
              )}

              {/* Botão */}
              <button type="submit" disabled={!tabela || !arquivo || loading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold
                                 text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: `linear-gradient(135deg, ${theme.colorPrimary}, ${theme.colorPrimaryLight})` }}>
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Processando…</>
                  : <><Upload size={15} /> Importar dados</>}
              </button>
            </form>

            {/* Erro */}
            {erro && (
              <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#EF4444]">
                <XCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span className="text-sm">{erro}</span>
              </div>
            )}

            {/* Resultado */}
            {resultado && (
              <div className="mt-4 rounded-xl border border-[#22C55E]/25 bg-[#22C55E]/5 p-6">
                <p className="flex items-center gap-2 text-[#22C55E] font-semibold text-sm mb-5">
                  <CheckCircle2 size={16} /> Importação concluída
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total de linhas', value: resultado.total,    color: '#E5E7EB' },
                    { label: 'Inseridos',        value: resultado.inserted, color: '#22C55E' },
                    { label: 'Atualizados',      value: resultado.updated,  color: '#3B82F6' },
                    { label: 'Erros',            value: resultado.errors,   color: '#EF4444' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-lg p-4 text-center"
                         style={{ background: theme.colorSurface2, border: `1px solid ${theme.colorBorder}` }}>
                      <p className="text-2xl font-bold" style={{ color }}>
                        {(value ?? 0).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-1">{label}</p>
                    </div>
                  ))}
                </div>
                {resultado.errorDetails?.length > 0 && (
                  <div className="mt-4 max-h-36 overflow-y-auto scrollbar-thin space-y-1">
                    <p className="text-xs font-semibold text-[#EF4444] mb-2">Detalhes dos erros:</p>
                    {resultado.errorDetails.map((e, i) => (
                      <p key={i} className="text-xs text-[#EF4444]/80 border-b border-[#EF4444]/10 pb-1">
                        ID {e.row}: {e.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
