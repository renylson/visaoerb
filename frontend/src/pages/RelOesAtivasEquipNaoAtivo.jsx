import { AlertTriangle } from 'lucide-react';
import RelatorioBase from '../components/RelatorioBase';
import OeReportTable from '../components/OeReportTable';
import { useTheme } from '../ThemeContext';

export default function RelOesAtivasEquipNaoAtivo() {
  const { theme } = useTheme();
  return (
    <RelatorioBase
      titulo="OEs Ativas · Eqptos Não Ativos"
      descricao="OEs com status Ativada cujo equipamento final Fusion está inativo ou planejado"
      icone={AlertTriangle}
      endpoint="/api/relatorios/oes-ativas-equip-nao-ativo"
    >
      {({ rows, uf }) => (
        <div>
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
            <AlertTriangle size={15} className="text-[#EF4444] flex-shrink-0"/>
            <p className="text-xs text-[#EF4444]">
              <strong>{rows.length}</strong> OEs Ativadas com equipamento Fusion inativo
              {uf ? ` · UF ${uf}` : ''}
            </p>
          </div>
          <OeReportTable rows={rows} showEquipStatus={true} />
        </div>
      )}
    </RelatorioBase>
  );
}
