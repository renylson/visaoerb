import { Clock } from 'lucide-react';
import RelatorioBase from '../components/RelatorioBase';
import OeReportTable from '../components/OeReportTable';

export default function RelOesAtivarEquipAtivo() {
  return (
    <RelatorioBase
      titulo="OEs a Ativar · Eqptos Ativos"
      descricao="OEs com status A Migrar ou À Ativar cujo equipamento final Fusion já está ativado — ação necessária"
      icone={Clock}
      endpoint="/api/relatorios/oes-a-ativar-equip-ativo"
    >
      {({ rows, uf }) => (
        <div>
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20">
            <Clock size={15} className="text-[#F59E0B] flex-shrink-0"/>
            <p className="text-xs text-[#F59E0B]">
              <strong>{rows.length}</strong> OEs pendentes com equipamento Fusion já ativo — providenciar ativação/migração
              {uf ? ` · UF ${uf}` : ''}
            </p>
          </div>
          <OeReportTable rows={rows} showEquipStatus={false} />
        </div>
      )}
    </RelatorioBase>
  );
}
