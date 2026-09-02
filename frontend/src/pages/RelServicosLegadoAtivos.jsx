import { ChevronDown, Zap } from 'lucide-react';
import RelatorioBase from '../components/RelatorioBase';
import OeReportTable from '../components/OeReportTable';

const TIPOS = ['2G','3G','4G','5G','MULTISERVIÇO (3G+4G+5G)','SWA','Gerência Fonte','DCN Rádio','Outros'];

export default function RelServicosLegadoAtivos() {
  return (
    <RelatorioBase
      titulo="Serviços Legado ainda Ativos"
      descricao="OEs Ativadas com equipamento final Legado (GWD/GWS) — serviços que ainda precisam migrar para Fusion"
      icone={Zap}
      endpoint="/api/relatorios/servicos-legado-ativos"
      filtrosExtra={({ extraParams, setExtraParams }) => (
        <div className="flex flex-col gap-1.5 w-64">
          <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Tipo de Serviço</label>
          <div className="relative">
            <select value={extraParams.servico || ''}
                    onChange={e => setExtraParams(p => ({ ...p, servico: e.target.value }))}
                    className="appearance-none w-full bg-surface-2 border border-surface-3 text-white rounded-lg
                               px-3 py-2.5 text-sm focus:outline-none focus:border-brand-light cursor-pointer">
              <option value="">Todos os tipos</option>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"/>
          </div>
        </div>
      )}
    >
      {({ rows: allRows, uf, extraParams }) => {
        const rows = extraParams.servico
          ? allRows.filter(r => r.tipo_servico === extraParams.servico)
          : allRows;

        // Contadores por tipo
        const porTipo = TIPOS.reduce((acc, t) => {
          const n = allRows.filter(r => r.tipo_servico === t).length;
          if (n > 0) acc[t] = n;
          return acc;
        }, {});

        return (
          <div>
            {/* Badges de contagem por tipo */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(porTipo).map(([t, n]) => (
                <button key={t}
                        onClick={() => {/* só visual */}}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold border bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/25">
                  {t} · {n}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
              <Zap size={15} className="text-[#EF4444] flex-shrink-0"/>
              <p className="text-xs text-[#EF4444]">
                <strong>{rows.length}</strong> OEs Ativadas ainda no Legado
                {uf ? ` · UF ${uf}` : ''}
                {extraParams.servico ? ` · ${extraParams.servico}` : ''}
              </p>
            </div>
            <OeReportTable rows={rows} showEquipStatus={true} />
          </div>
        );
      }}
    </RelatorioBase>
  );
}
