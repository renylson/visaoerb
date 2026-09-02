import { ListTodo, ChevronDown } from 'lucide-react';
import RelatorioBase from '../components/RelatorioBase';
import OeReportTable from '../components/OeReportTable';

const TIPOS = ['2G','3G','4G','5G','MULTISERVIÇO (3G+4G+5G)','SWA','Gerência Fonte','DCN Rádio','Outros'];

export default function RelErbsPendentes() {
  return (
    <RelatorioBase
      titulo="ERBs Pendentes de Migração"
      descricao="OEs A Migrar ou À Ativar com equipamento final Fusion — o que ainda falta executar"
      icone={ListTodo}
      endpoint="/api/relatorios/erbs-pendentes"
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
      {({ rows, uf, extraParams }) => (
        <div>
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20">
            <ListTodo size={15} className="text-[#3B82F6] flex-shrink-0"/>
            <p className="text-xs text-[#3B82F6]">
              <strong>{rows.length}</strong> OEs pendentes com equipamento Fusion
              {uf ? ` · UF ${uf}` : ''}
              {extraParams.servico ? ` · ${extraParams.servico}` : ''}
            </p>
          </div>
          <OeReportTable rows={rows} showEquipStatus={true} />
        </div>
      )}
    </RelatorioBase>
  );
}
