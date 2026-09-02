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

function Router() {
  const path = window.location.pathname;
  if (path === '/config'     || path.endsWith('/config'))     return <Configuracoes />;
  if (path === '/massiva'    || path.endsWith('/massiva'))    return <VisaoMassivaERB />;
  if (path === '/importacao' || path.endsWith('/importacao')) return <Importacao />;
  if (path === '/topologia'  || path.endsWith('/topologia'))  return <TopologiaPage />;
  if (path === '/vizinhos'    || path.endsWith('/vizinhos'))   return <Vizinhos />;
  if (path.endsWith('/erb-por-equipamento'))       return <RelErbPorEquipamento />;
  if (path.endsWith('/status-migracao-erb'))       return <RelStatusMigracaoErb />;
  if (path.endsWith('/progresso-por-uf'))          return <RelProgressoPorUf />;
  if (path.endsWith('/erbs-pendentes'))            return <RelErbsPendentes />;
  if (path.endsWith('/oes-ativas-equip-nao-ativo'))return <RelOesAtivasEquipNaoAtivo />;
  if (path.endsWith('/oes-a-ativar-equip-ativo'))  return <RelOesAtivarEquipAtivo />;
  if (path.endsWith('/servicos-legado-ativos'))    return <RelServicosLegadoAtivos />;
  if (path === '/relatorios' || path.endsWith('/relatorios')) return <Relatorios />;
  return <VisaoERB />;
}

export default function App() {
  return (
    <ThemeProvider>
      <Router />
    </ThemeProvider>
  );
}
