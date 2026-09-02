const express = require('express');
const path    = require('path');
const { initDatabase } = require('./db');
const uploadRouter    = require('./routes/upload');
const visaoRouter     = require('./routes/visao');
const topologiaRouter = require('./routes/topologia');
const relatoriosRouter = require('./routes/relatorios');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API routes (antes do static para não serem interceptadas)
app.use('/upload',    uploadRouter);
app.use('/visao',     visaoRouter);
app.use('/topologia',  topologiaRouter);
app.use('/relatorios',     relatoriosRouter);
app.use('/api/relatorios', relatoriosRouter);

// Serve o build do React como raiz
app.use(express.static(path.join(__dirname, 'public', 'app')));

// SPA fallback — todas as rotas não-API entregam o index.html do React
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app', 'index.html'));
});

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Falha ao iniciar:', err);
    process.exit(1);
  }
}

start();
