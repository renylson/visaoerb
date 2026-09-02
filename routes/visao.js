const express = require('express');
const { z } = require('zod');
const { handleRouteError } = require('../lib/handleRouteError');
const erbService = require('../services/erbService');

const router = express.Router();

const siglasQuerySchema = z.object({
  uf: z.string({ error: 'Parâmetro uf obrigatório.' }).trim().min(1, 'Parâmetro uf obrigatório.'),
});

// GET /visao/massiva/:eqpto_final
router.get('/massiva/:eqpto', async (req, res) => {
  try {
    const resultado = await erbService.buscarVisaoMassiva(req.params.eqpto);
    res.json(resultado);
  } catch (err) {
    handleRouteError(res, err, 'visao');
  }
});

// GET /visao/ufs
router.get('/ufs', async (_req, res) => {
  try {
    res.json(await erbService.listarUfs());
  } catch (err) {
    handleRouteError(res, err, 'visao');
  }
});

// GET /visao/siglas?uf=PE
router.get('/siglas', async (req, res) => {
  const parsed = siglasQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ erro: parsed.error.issues[0].message });
  }
  try {
    res.json(await erbService.listarSiglasPorUf(parsed.data.uf));
  } catch (err) {
    handleRouteError(res, err, 'visao');
  }
});

// GET /visao/:uf/:sigla?nome_site=...
router.get('/:uf/:sigla', async (req, res) => {
  const { uf, sigla } = req.params;
  const { nome_site } = req.query;
  try {
    res.json(await erbService.buscarVisaoErb(uf, sigla, nome_site));
  } catch (err) {
    handleRouteError(res, err, 'visao');
  }
});

module.exports = router;
