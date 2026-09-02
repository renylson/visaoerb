const express = require('express');
const { z } = require('zod');
const { handleRouteError } = require('../lib/handleRouteError');
const topologiaService = require('../services/topologiaService');

const router = express.Router();

const requiredField = z.string({ error: 'equipamento e upstream são obrigatórios' })
  .trim().min(1, 'equipamento e upstream são obrigatórios');

const criarRelacaoSchema = z.object({
  equipamento: requiredField,
  upstream: requiredField,
  porta_equipamento: z.string().trim().min(1).nullish(),
  porta_upstream: z.string().trim().min(1).nullish(),
  observacao: z.string().trim().min(1).nullish(),
}).refine(data => data.equipamento !== data.upstream, {
  error: 'equipamento e upstream não podem ser iguais',
  path: ['upstream'],
});

const atualizarRelacaoSchema = z.object({
  porta_equipamento: z.string().trim().min(1).nullish(),
  porta_upstream: z.string().trim().min(1).nullish(),
  observacao: z.string().trim().min(1).nullish(),
});

// GET /topologia/buscar?q=texto — autocomplete por hostname
router.get('/buscar', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  try {
    res.json(await topologiaService.buscarPorHostname(q));
  } catch (err) {
    handleRouteError(res, err, 'topologia');
  }
});

// GET /topologia/por-erb?sigla=VMA&uf=PE — equipamentos de uma ERB
router.get('/por-erb', async (req, res) => {
  const { sigla, uf } = req.query;
  if (!sigla) return res.status(400).json({ erro: 'sigla obrigatória' });
  try {
    res.json(await topologiaService.listarPorErb(sigla, uf));
  } catch (err) {
    handleRouteError(res, err, 'topologia');
  }
});

// GET /topologia/listar?equipamento=hostname — relações cadastradas
router.get('/listar', async (req, res) => {
  const { equipamento } = req.query;
  if (!equipamento) return res.status(400).json({ erro: 'equipamento obrigatório' });
  try {
    res.json(await topologiaService.listarRelacoes(equipamento));
  } catch (err) {
    handleRouteError(res, err, 'topologia');
  }
});

// GET /topologia/:hostname — grafo completo (ancestrais + descendentes)
router.get('/:hostname', async (req, res) => {
  try {
    res.json(await topologiaService.buscarGrafo(req.params.hostname));
  } catch (err) {
    handleRouteError(res, err, 'topologia');
  }
});

// POST /topologia — cria novo link (sempre insere, permite múltiplos entre mesmo par)
router.post('/', async (req, res) => {
  const parsed = criarRelacaoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: parsed.error.issues[0].message });
  }
  const { equipamento, upstream, porta_equipamento, porta_upstream, observacao } = parsed.data;
  try {
    const relacao = await topologiaService.criarRelacao({
      equipamento,
      upstream,
      portaEquipamento: porta_equipamento,
      portaUpstream: porta_upstream,
      observacao,
    });
    res.json(relacao);
  } catch (err) {
    handleRouteError(res, err, 'topologia');
  }
});

// PATCH /topologia/:id — edita portas de um link existente
router.patch('/:id', async (req, res) => {
  const parsed = atualizarRelacaoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: parsed.error.issues[0].message });
  }
  const { porta_equipamento, porta_upstream, observacao } = parsed.data;
  try {
    const relacao = await topologiaService.atualizarRelacao(req.params.id, {
      portaEquipamento: porta_equipamento,
      portaUpstream: porta_upstream,
      observacao,
    });
    res.json(relacao);
  } catch (err) {
    handleRouteError(res, err, 'topologia');
  }
});

// DELETE /topologia/:id — remove relação
router.delete('/:id', async (req, res) => {
  try {
    await topologiaService.removerRelacao(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    handleRouteError(res, err, 'topologia');
  }
});

module.exports = router;
