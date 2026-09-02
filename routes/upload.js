const express = require('express');
const multer  = require('multer');
const { processUpload, TABLE_CONFIG } = require('../services/upsert');
const { handleRouteError } = require('../lib/handleRouteError');

const router  = express.Router();
const upload  = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(csv|txt|xml)$/i;
    cb(null, allowed.test(file.originalname));
  },
});

// Lista tabelas disponíveis
router.get('/tabelas', (req, res) => {
  const tabelas = Object.keys(TABLE_CONFIG).map(key => ({
    key,
    label: key.toUpperCase(),
  }));
  res.json(tabelas);
});

// Upload e upsert
router.post('/:tabela', upload.single('arquivo'), async (req, res) => {
  const { tabela } = req.params;

  if (!req.file) {
    return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
  }

  if (!TABLE_CONFIG[tabela]) {
    return res.status(400).json({ erro: `Tabela "${tabela}" não configurada.` });
  }

  try {
    const resultado = await processUpload(tabela, req.file.buffer);
    res.json({ sucesso: true, tabela, ...resultado });
  } catch (err) {
    handleRouteError(res, err, 'upload');
  }
});

module.exports = router;
