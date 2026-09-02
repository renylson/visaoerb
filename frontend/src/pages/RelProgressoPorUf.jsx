import { useState } from 'react';
import { TrendingUp, Loader2, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../ThemeContext';

function Barra({ valor, total, cor }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: cor }}/>
      </div>
      <span className="text-xs font-bold w-10 text-right" style={{ color: cor }}>{pct}%</span>
      <span className="text-[10px] text-[#6B7280] w-20">{valor}/{total}</span>
    </div>
  );
}

export default function RelProgressoPorUf() {
  const { theme } = useTheme();
  const [dados, setDados]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState('');
  const [gerado, setGerado]   = useState(false);

  const gerar = async () => {
    setLoading(true); setErro(''); setDados(null);
    try {
      const r = await fetch('/api/relatorios/progresso-por-uf');
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro);
      setDados(d.filter(r => r.uf)); setGerado(true);
    } catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  };

  const totais = dados ? {
    erbs:  dados.reduce((s,r) => s + Number(r.total_erbs), 0),
    movelFusion: dados.reduce((s,r) => s + Number(r.movel_com_fusion), 0),
    movelTotal:  dados.reduce((s,r) => s + Number(r.movel_com_servico), 0),
    b2bFusion:   dados.reduce((s,r) => s + Number(r.b2b_com_fusion), 0),
    b2bTotal:    dados.reduce((s,r) => s + Number(r.b2b_com_servico), 0),
  } : null;

  return (
    <div className="flex min-h-screen" style={{ background: theme.colorBg }}>
      <Sidebar current="/relatorios/progresso-por-uf"/>
      <main className="ml-60 flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 backdrop-blur border-b px-8 py-4"
                style={{ background: `${theme.colorBg}e6`, borderColor: theme.colorBorder }}>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-[#9C27FF]"/>
            Progresso de Migração por UF
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">% de ERBs com serviços Fusion · separado por Móvel (3G/4G/5G) e B2B (SWA)</p>
        </header>

        <div className="flex-1 px-8 py-6">
          <div className="rounded-2xl border p-6 mb-6 flex items-center gap-4"
               style={{ background: theme.colorSurface, borderColor: theme.colorBorder }}>
            <p className="text-sm text-[#6B7280] flex-1">Este relatório não requer filtro de UF — exibe todas as UFs comparadas.</p>
            <button onClick={gerar} disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white
                               bg-brand-gradient hover:opacity-90 disabled:opacity-40 transition-opacity whitespace-nowrap">
              {loading ? <><Loader2 size={14} className="animate-spin"/> Gerando...</> : <><Search size={14}/> Gerar</>}
            </button>
          </div>

          {erro && <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#EF4444] text-sm mb-4">{erro}</div>}

          {dados && (
            <>
              {/* Totais globais */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-2xl border p-5" style={{ background: theme.colorSurface, borderColor: theme.colorBorder }}>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#9C27FF]"/> Serviços Móvel (3G/4G/5G)
                  </p>
                  <Barra valor={totais.movelFusion} total={totais.movelTotal} cor="#9C27FF"/>
                  <p className="text-[10px] text-[#6B7280] mt-2">ERBs com ao menos 1 serviço móvel em Fusion</p>
                </div>
                <div className="rounded-2xl border p-5" style={{ background: theme.colorSurface, borderColor: theme.colorBorder }}>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#0066FF]"/> B2B (SWA)
                  </p>
                  <Barra valor={totais.b2bFusion} total={totais.b2bTotal} cor="#0066FF"/>
                  <p className="text-[10px] text-[#6B7280] mt-2">ERBs com ao menos 1 serviço B2B em Fusion</p>
                </div>
              </div>

              {/* Tabela por UF */}
              <div className="rounded-xl border border-surface-3 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">UF</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">ERBs</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider w-64">Móvel Fusion</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider w-64">B2B Fusion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-3">
                    {dados.sort((a,b) => {
                      const pA = a.movel_com_servico > 0 ? a.movel_com_fusion / a.movel_com_servico : 0;
                      const pB = b.movel_com_servico > 0 ? b.movel_com_fusion / b.movel_com_servico : 0;
                      return pB - pA;
                    }).map(r => (
                      <tr key={r.uf} className="bg-surface hover:bg-surface-2 transition-colors">
                        <td className="px-4 py-3 text-white font-bold text-sm">{r.uf}</td>
                        <td className="px-4 py-3 text-[#B3B3B3] text-sm">{r.total_erbs}</td>
                        <td className="px-4 py-3 w-64">
                          <Barra valor={Number(r.movel_com_fusion)} total={Number(r.movel_com_servico)} cor="#9C27FF"/>
                        </td>
                        <td className="px-4 py-3 w-64">
                          {Number(r.b2b_com_servico) > 0
                            ? <Barra valor={Number(r.b2b_com_fusion)} total={Number(r.b2b_com_servico)} cor="#0066FF"/>
                            : <span className="text-[10px] text-[#6B7280]">Sem B2B</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!gerado && !loading && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-subtle flex items-center justify-center mb-4">
                <TrendingUp size={28} className="text-brand-light"/>
              </div>
              <h3 className="text-white font-semibold text-base mb-1">Clique em Gerar para ver o progresso</h3>
              <p className="text-[#6B7280] text-sm">Exibe todas as UFs ordenadas por % de migração Móvel.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
