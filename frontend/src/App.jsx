import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import VisaoERB from './pages/VisaoERB';
import VisaoMassivaERB from './pages/VisaoMassivaERB';
import Configuracoes from './pages/Configuracoes';
import Importacao from './pages/Importacao';
import TopologiaPage from './pages/Topologia';
import Vizinhos from './pages/Vizinhos';
import Relatorios from './pages/Relatorios';
import RelErbPorEquipamento        from './pages/RelErbPorEquipamento';
import RelStatusMigracaoErb        from './pages/RelStatusMigracaoErb';
import RelProgressoPorUf           from './pages/RelProgressoPorUf';
import RelErbsPendentes            from './pages/RelErbsPendentes';
import RelOesAtivasEquipNaoAtivo   from './pages/RelOesAtivasEquipNaoAtivo';
import RelOesAtivarEquipAtivo      from './pages/RelOesAtivarEquipAtivo';
import RelServicosLegadoAtivos     from './pages/RelServicosLegadoAtivos';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<VisaoERB />} />
          <Route path="/massiva" element={<VisaoMassivaERB />} />
          <Route path="/topologia" element={<TopologiaPage />} />
          <Route path="/vizinhos" element={<Vizinhos />} />
          <Route path="/importacao" element={<Importacao />} />
          <Route path="/config" element={<Configuracoes />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/relatorios/erb-por-equipamento" element={<RelErbPorEquipamento />} />
          <Route path="/relatorios/status-migracao-erb" element={<RelStatusMigracaoErb />} />
          <Route path="/relatorios/progresso-por-uf" element={<RelProgressoPorUf />} />
          <Route path="/relatorios/erbs-pendentes" element={<RelErbsPendentes />} />
          <Route path="/relatorios/oes-ativas-equip-nao-ativo" element={<RelOesAtivasEquipNaoAtivo />} />
          <Route path="/relatorios/oes-a-ativar-equip-ativo" element={<RelOesAtivarEquipAtivo />} />
          <Route path="/relatorios/servicos-legado-ativos" element={<RelServicosLegadoAtivos />} />
          <Route path="*" element={<VisaoERB />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
