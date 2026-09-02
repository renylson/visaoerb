const { pool } = require('../db');
const { classificarServico, tipoEquip } = require('./classificar');

async function buscarPorHostname(q) {
  const r = await pool.query(
    `SELECT DISTINCT sigla, status, endereco_ip, sigla_erb, uf_sigla_erb, fabricante, modelo
     FROM equipamentos
     WHERE sigla ILIKE $1
     ORDER BY sigla
     LIMIT 20`,
    [`%${q}%`]
  );
  return r.rows;
}

async function listarPorErb(sigla, uf) {
  const r = await pool.query(
    `SELECT DISTINCT sigla, status, endereco_ip, sigla_erb, uf_sigla_erb
     FROM equipamentos
     WHERE sigla_erb = $1
       ${uf ? 'AND uf_sigla_erb = $2' : ''}
     ORDER BY sigla`,
    uf ? [sigla.toUpperCase(), uf.toUpperCase()] : [sigla.toUpperCase()]
  );
  return r.rows;
}

async function listarRelacoes(equipamento) {
  const r = await pool.query(
    `SELECT t.id, t.equipamento, t.upstream, t.porta_equipamento, t.porta_upstream, t.observacao, t.criado_em,
            e1.status AS eq_status, e1.endereco_ip AS eq_ip,
            e2.status AS up_status, e2.endereco_ip AS up_ip
     FROM topologia t
     LEFT JOIN equipamentos e1 ON e1.sigla = t.equipamento
     LEFT JOIN equipamentos e2 ON e2.sigla = t.upstream
     WHERE t.equipamento = $1 OR t.upstream = $1
     ORDER BY t.criado_em DESC`,
    [equipamento]
  );
  return r.rows;
}

async function buscarGrafo(hostname) {
  // Busca toda a árvore conectada via recursão bidirecional
  const r = await pool.query(`
    WITH RECURSIVE
    -- Sobe: hostname → upstream → upstream do upstream...
    subindo AS (
      SELECT equipamento, upstream, porta_equipamento, porta_upstream FROM topologia WHERE equipamento = $1
      UNION
      SELECT t.equipamento, t.upstream, t.porta_equipamento, t.porta_upstream
      FROM topologia t
      INNER JOIN subindo s ON t.equipamento = s.upstream
    ),
    -- Desce: hostname ← equipamentos que têm hostname como upstream
    descendo AS (
      SELECT equipamento, upstream, porta_equipamento, porta_upstream FROM topologia WHERE upstream = $1
      UNION
      SELECT t.equipamento, t.upstream, t.porta_equipamento, t.porta_upstream
      FROM topologia t
      INNER JOIN descendo d ON t.upstream = d.equipamento
    ),
    todos AS (
      SELECT equipamento, upstream, porta_equipamento, porta_upstream FROM subindo
      UNION
      SELECT equipamento, upstream, porta_equipamento, porta_upstream FROM descendo
    )
    SELECT DISTINCT equipamento, upstream, porta_equipamento, porta_upstream FROM todos
  `, [hostname]);

  // Coleta todos os hostnames únicos do grafo
  const hostnames = new Set([hostname]);
  for (const row of r.rows) {
    hostnames.add(row.equipamento);
    hostnames.add(row.upstream);
  }

  // Enriquece nós com dados da tabela equipamentos
  const hostsArr = [...hostnames];
  const eqRes = await pool.query(
    `SELECT sigla, status, endereco_ip, sigla_erb, uf_sigla_erb
     FROM equipamentos
     WHERE sigla = ANY($1)`,
    [hostsArr]
  );
  const eqMap = {};
  for (const e of eqRes.rows) eqMap[e.sigla] = e;

  // ERBs atendidas por cada nó — com serviços Ativados agrupados por ERB
  const erbRes = await pool.query(
    `SELECT o.eqpto_final, o.sigla_erb, o.uf_sigla_erb, e.nome_site,
            o.equip_b, o.status AS oe_status
     FROM oe o
     LEFT JOIN erb e ON e.sigla_erb = o.sigla_erb AND e.uf_sigla_erb = o.uf_sigla_erb
     WHERE o.eqpto_final = ANY($1) AND o.eqpto_final IS NOT NULL
     ORDER BY o.sigla_erb, o.equip_b`,
    [hostsArr]
  );

  // Agrupa por eqpto_final → sigla_erb, coleta tipos de serviço ativos
  const erbMap = {};
  for (const row of erbRes.rows) {
    const key = row.eqpto_final;
    if (!erbMap[key]) erbMap[key] = {};
    const erbKey = `${row.sigla_erb}|${row.uf_sigla_erb}`;
    if (!erbMap[key][erbKey]) {
      erbMap[key][erbKey] = {
        sigla_erb: row.sigla_erb,
        uf_sigla_erb: row.uf_sigla_erb,
        nome_site: row.nome_site,
        servicos_ativos: [],
      };
    }
    if ((row.oe_status || '').toLowerCase() === 'ativada') {
      const tipo = classificarServico(row.equip_b);
      const entry = erbMap[key][erbKey];
      if (!entry.servicos_ativos.includes(tipo)) entry.servicos_ativos.push(tipo);
    }
  }

  // Converte para array por eqpto_final
  const erbMapFinal = {};
  for (const [host, erbs] of Object.entries(erbMap)) {
    erbMapFinal[host] = Object.values(erbs);
  }

  // Monta lista de nós
  const nos = hostsArr.map(h => ({
    id: h,
    tipo: tipoEquip(h),
    status:       eqMap[h]?.status       || null,
    endereco_ip:  eqMap[h]?.endereco_ip  || null,
    sigla_erb:    eqMap[h]?.sigla_erb    || null,
    uf_sigla_erb: eqMap[h]?.uf_sigla_erb || null,
    erbs_atendidas: erbMapFinal[h] || [],
    raiz: h === hostname,
  }));

  return { hostname, nos, arestas: r.rows };
}

async function criarRelacao({ equipamento, upstream, portaEquipamento, portaUpstream, observacao }) {
  const r = await pool.query(
    `INSERT INTO topologia (equipamento, upstream, porta_equipamento, porta_upstream, observacao)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [equipamento, upstream, portaEquipamento || null, portaUpstream || null, observacao || null]
  );
  return r.rows[0];
}

async function atualizarRelacao(id, { portaEquipamento, portaUpstream, observacao }) {
  const r = await pool.query(
    `UPDATE topologia
     SET porta_equipamento = COALESCE($2, porta_equipamento),
         porta_upstream     = COALESCE($3, porta_upstream),
         observacao         = COALESCE($4, observacao)
     WHERE id = $1
     RETURNING *`,
    [id, portaEquipamento ?? null, portaUpstream ?? null, observacao ?? null]
  );
  return r.rows[0];
}

async function removerRelacao(id) {
  await pool.query('DELETE FROM topologia WHERE id = $1', [id]);
}

module.exports = {
  buscarPorHostname,
  listarPorErb,
  listarRelacoes,
  buscarGrafo,
  criarRelacao,
  atualizarRelacao,
  removerRelacao,
};
