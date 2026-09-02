// Loga o erro real no servidor mas nunca expõe detalhes internos (nomes de
// tabela/coluna, mensagens do driver do Postgres) na resposta ao cliente.
function handleRouteError(res, err, context) {
  console.error(`[${context}]`, err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { handleRouteError };
