const express = require('express');
const { handleRouteError } = require('../lib/handleRouteError');
const relatoriosService = require('../services/relatoriosService');

const router = express.Router();

// GET /relatorios/ufs — lista UFs distintas disponíveis
router.get('/ufs', async (_req, res) => {
  try {
    res.json(await relatoriosService.listarUfs());
  } catch (err) {
    handleRouteError(res, err, 'relatorios');
  }
});

// GET /relatorios/erbs-por-equipamento?limite=200&uf=PE&tipo=hl5d
router.get('/erbs-por-equipamento', async (req, res) => {
  try {
    const resultado = await relatoriosService.erbsPorEquipamento({
      limite: parseInt(req.query.limite) || 200,
      uf: req.query.uf || '',
      tipo: req.query.tipo || '',
      soAtivadas: req.query.soAtivadas === 'true',
    });
    res.json(resultado);
  } catch (err) {
    handleRouteError(res, err, 'relatorios');
  }
});

// ─── Relatório 1: OEs Ativadas com Eqptos Não Ativos ─────────────────────────
router.get('/oes-ativas-equip-nao-ativo', async (req, res) => {
  try {
    res.json(await relatoriosService.oesAtivasEquipNaoAtivo((req.query.uf || '').trim()));
  } catch (err) {
    handleRouteError(res, err, 'relatorios');
  }
});

// ─── Relatório 2: OEs a Ativar com Eqptos Ativos ─────────────────────────────
router.get('/oes-a-ativar-equip-ativo', async (req, res) => {
  try {
    res.json(await relatoriosService.oesAAtivarEquipAtivo((req.query.uf || '').trim()));
  } catch (err) {
    handleRouteError(res, err, 'relatorios');
  }
});

// ─── Relatório 3: Status de Migração por ERB ─────────────────────────────────
router.get('/status-migracao-erb', async (req, res) => {
  try {
    res.json(await relatoriosService.statusMigracaoErb((req.query.uf || '').trim()));
  } catch (err) {
    handleRouteError(res, err, 'relatorios');
  }
});

// ─── Relatório 4: ERBs pendentes de migração (OE A Migrar/À Ativar + Fusion) ─
router.get('/erbs-pendentes', async (req, res) => {
  try {
    const uf = (req.query.uf || '').trim();
    const servico = (req.query.servico || '').trim();
    res.json(await relatoriosService.erbsPendentes(uf, servico));
  } catch (err) {
    handleRouteError(res, err, 'relatorios');
  }
});

// ─── Relatório 5: Progresso de migração por UF ────────────────────────────────
router.get('/progresso-por-uf', async (_req, res) => {
  try {
    res.json(await relatoriosService.progressoPorUf());
  } catch (err) {
    handleRouteError(res, err, 'relatorios');
  }
});

// ─── Relatório 6: Serviços Legado ainda Ativos ────────────────────────────────
router.get('/servicos-legado-ativos', async (req, res) => {
  try {
    res.json(await relatoriosService.servicosLegadoAtivos((req.query.uf || '').trim()));
  } catch (err) {
    handleRouteError(res, err, 'relatorios');
  }
});

module.exports = router;
