const { pool } = require('../db');
const { classificarServico, tipoEquip } = require('./classificar');

// Helper: monta filtro de UF
function ufWhere(uf, params, alias = 'o') {
  if (!uf) return '';
  params.push(uf.toUpperCase());
  return `AND ${alias}.uf_sigla_erb = $${params.length}`;
}

const FUSION_LIKE = `(o.eqpto_final ILIKE '%-hl5d-%' OR o.eqpto_final ILIKE '%-hl5g-%')`;
const LEGADO_LIKE = `(o.eqpto_final ILIKE '%-gwd-%'  OR o.eqpto_final ILIKE '%-gws-%')`;

async function listarUfs() {
  const r = await pool.query(
    `SELECT DISTINCT uf_sigla_erb FROM oe WHERE uf_sigla_erb IS NOT NULL ORDER BY 1`
  );
  return r.rows.map(row => row.uf_sigla_erb);
}

// Lista equipamentos com mais ERBs únicas passando por eles, separados por tipo
async function erbsPorEquipamento({ limite = 200, uf = '', tipo = '', soAtivadas = false }) {
  const limiteFinal = Math.min(limite, 500);
  const ufNorm = uf.trim().toUpperCase();
  const tipoNorm = tipo.trim().toLowerCase();

  const params = [limiteFinal];
  const wheres = ['o.eqpto_final IS NOT NULL'];

  if (soAtivadas) {
    wheres.push(`o.status = 'Ativada'`);
  }

  if (ufNorm) {
    params.push(ufNorm);
    wheres.push(`o.uf_sigla_erb = $${params.length}`);
  }

  const tipoPatterns = {
    hl4: '%-hl4-%', hl5d: '%-hl5d-%', hl5g: '%-hl5g-%',
    gwc: '%-gwc-%', gwd:  '%-gwd-%',  gws:  '%-gws-%',
  };
  if (tipoNorm && tipoPatterns[tipoNorm]) {
    params.push(tipoPatterns[tipoNorm]);
    wheres.push(`o.eqpto_final ILIKE $${params.length}`);
  }

  const r = await pool.query(`
    SELECT
      o.eqpto_final                                        AS equipamento,
      COUNT(DISTINCT o.sigla_erb || '|' || o.uf_sigla_erb) AS total_erbs,
      COUNT(DISTINCT o.id_rota)                            AS total_oes,
      e.status                                             AS status_equip,
      e.fabricante,
      e.modelo,
      e.endereco_ip
    FROM oe o
    LEFT JOIN equipamentos e ON e.sigla = o.eqpto_final
    WHERE ${wheres.join(' AND ')}
    GROUP BY o.eqpto_final, e.status, e.fabricante, e.modelo, e.endereco_ip
    ORDER BY total_erbs DESC
    LIMIT $1
  `, params);

  // Agrupa por tipo
  const grupos = { hl4: [], hl5d: [], hl5g: [], gwc: [], gwd: [], gws: [], outro: [] };
  for (const row of r.rows) {
    const tipoDetectado = tipoEquip(row.equipamento);
    grupos[tipoDetectado].push({ ...row, tipo: tipoDetectado });
  }

  // Remove grupos vazios e ordena por total_erbs dentro de cada grupo
  const resultado = {};
  for (const [tipoGrupo, lista] of Object.entries(grupos)) {
    if (lista.length > 0) {
      resultado[tipoGrupo] = lista.sort((a, b) => b.total_erbs - a.total_erbs);
    }
  }
  return resultado;
}

// Relatório 1: OEs Ativadas com Eqptos Não Ativos
// OE Ativada + eqpto_final Fusion + status do equipamento != ativado
async function oesAtivasEquipNaoAtivo(uf) {
  const params = [];
  const ufFilter = ufWhere(uf, params);
  const r = await pool.query(`
    SELECT
      o.id_rota, o.num_oe, o.rota, o.status AS oe_status,
      o.equip_b, o.equip_a, o.eqpto_final,
      o.sigla_erb, o.uf_sigla_erb,
      e.status AS equip_status, e.fabricante, e.modelo, e.endereco_ip,
      eb.nome_site
    FROM oe o
    JOIN equipamentos e ON e.sigla = o.eqpto_final
    LEFT JOIN erb eb ON eb.sigla_erb = o.sigla_erb AND eb.uf_sigla_erb = o.uf_sigla_erb
    WHERE o.status = 'Ativada'
      AND ${FUSION_LIKE}
      AND LOWER(e.status) != 'ativado'
      ${ufFilter}
    ORDER BY o.uf_sigla_erb, o.sigla_erb, o.eqpto_final
  `, params);
  return r.rows.map(row => ({ ...row, tipo_servico: classificarServico(row.equip_b) }));
}

// Relatório 2: OEs a Ativar com Eqptos Ativos
// OE A Migrar/À Ativar + eqpto_final Fusion + status do equipamento = ativado
async function oesAAtivarEquipAtivo(uf) {
  const params = [];
  const ufFilter = ufWhere(uf, params);
  const r = await pool.query(`
    SELECT
      o.id_rota, o.num_oe, o.rota, o.status AS oe_status,
      o.equip_b, o.equip_a, o.eqpto_final,
      o.sigla_erb, o.uf_sigla_erb,
      e.status AS equip_status, e.fabricante, e.modelo, e.endereco_ip,
      eb.nome_site
    FROM oe o
    JOIN equipamentos e ON e.sigla = o.eqpto_final
    LEFT JOIN erb eb ON eb.sigla_erb = o.sigla_erb AND eb.uf_sigla_erb = o.uf_sigla_erb
    WHERE o.status IN ('A Migrar', 'À Ativar')
      AND ${FUSION_LIKE}
      AND LOWER(e.status) = 'ativado'
      ${ufFilter}
    ORDER BY o.uf_sigla_erb, o.sigla_erb, o.status, o.equip_b
  `, params);
  return r.rows.map(row => ({ ...row, tipo_servico: classificarServico(row.equip_b) }));
}

// Relatório 3: Status de Migração por ERB
async function statusMigracaoErb(uf) {
  const params = [];
  const ufFilter = ufWhere(uf, params);
  const r = await pool.query(`
    SELECT
      o.sigla_erb, o.uf_sigla_erb, eb.nome_site,
      COUNT(*) FILTER (WHERE o.status='Ativada' AND ${FUSION_LIKE} AND LOWER(e.status)='ativado') AS fusion_ok,
      COUNT(*) FILTER (WHERE o.status='Ativada' AND ${LEGADO_LIKE})                               AS legado_ativo,
      COUNT(*) FILTER (WHERE o.status='Ativada' AND ${FUSION_LIKE} AND LOWER(e.status)!='ativado') AS fusion_inativo,
      COUNT(*) FILTER (WHERE o.status IN ('A Migrar','À Ativar') AND ${FUSION_LIKE})              AS pendente_fusion,
      COUNT(*) FILTER (WHERE o.status IN ('A Migrar','À Ativar') AND ${LEGADO_LIKE})              AS pendente_legado,
      COUNT(*) FILTER (WHERE o.status = 'Ativada')                                               AS total_ativas
    FROM oe o
    LEFT JOIN equipamentos e ON e.sigla = o.eqpto_final
    LEFT JOIN erb eb ON eb.sigla_erb = o.sigla_erb AND eb.uf_sigla_erb = o.uf_sigla_erb
    WHERE o.eqpto_final IS NOT NULL
      ${ufFilter}
    GROUP BY o.sigla_erb, o.uf_sigla_erb, eb.nome_site
    ORDER BY legado_ativo DESC, o.uf_sigla_erb, o.sigla_erb
  `, params);
  return r.rows;
}

// Relatório 4: ERBs pendentes de migração (OE A Migrar/À Ativar + Fusion)
async function erbsPendentes(uf, servico) {
  const params = [];
  const ufFilter = ufWhere(uf, params);
  const r = await pool.query(`
    SELECT
      o.id_rota, o.num_oe, o.rota, o.status AS oe_status,
      o.equip_b, o.eqpto_final,
      o.sigla_erb, o.uf_sigla_erb,
      e.status AS equip_status, e.fabricante, e.modelo,
      eb.nome_site
    FROM oe o
    LEFT JOIN equipamentos e ON e.sigla = o.eqpto_final
    LEFT JOIN erb eb ON eb.sigla_erb = o.sigla_erb AND eb.uf_sigla_erb = o.uf_sigla_erb
    WHERE o.status IN ('A Migrar', 'À Ativar')
      AND ${FUSION_LIKE}
      ${ufFilter}
    ORDER BY o.uf_sigla_erb, o.sigla_erb, o.status
  `, params);
  const rows = r.rows.map(row => ({ ...row, tipo_servico: classificarServico(row.equip_b) }));
  return servico ? rows.filter(row => row.tipo_servico === servico) : rows;
}

// Relatório 5: Progresso de migração por UF
async function progressoPorUf() {
  const r = await pool.query(`
    WITH base AS (
      SELECT
        o.sigla_erb, o.uf_sigla_erb,
        -- Móvel (3G/4G/5G): considera serviço ok se OE Ativada + Fusion + equip ativado
        COUNT(DISTINCT CASE
          WHEN o.status='Ativada' AND ${FUSION_LIKE} AND LOWER(e.status)='ativado'
           AND o.equip_b ~* '^[WTS]|^M(?!\\.)' THEN o.sigla_erb||'|'||o.uf_sigla_erb END) AS movel_fusion,
        COUNT(DISTINCT CASE
          WHEN o.status='Ativada' AND o.equip_b ~* '^[WTS]|^M(?!\\.)' THEN o.sigla_erb||'|'||o.uf_sigla_erb END) AS movel_total,
        -- B2B (SWA)
        COUNT(DISTINCT CASE
          WHEN o.status='Ativada' AND ${FUSION_LIKE} AND LOWER(e.status)='ativado'
           AND array_length(string_to_array(o.equip_b,'-'),1)=7
           AND split_part(o.equip_b,'-',6)='swa' THEN o.sigla_erb||'|'||o.uf_sigla_erb END) AS b2b_fusion,
        COUNT(DISTINCT CASE
          WHEN o.status='Ativada'
           AND array_length(string_to_array(o.equip_b,'-'),1)=7
           AND split_part(o.equip_b,'-',6)='swa' THEN o.sigla_erb||'|'||o.uf_sigla_erb END) AS b2b_total
      FROM oe o
      LEFT JOIN equipamentos e ON e.sigla = o.eqpto_final
      WHERE o.eqpto_final IS NOT NULL
      GROUP BY o.sigla_erb, o.uf_sigla_erb
    )
    SELECT
      uf_sigla_erb AS uf,
      COUNT(DISTINCT sigla_erb||'|'||uf_sigla_erb) AS total_erbs,
      SUM(CASE WHEN movel_fusion > 0 AND movel_total > 0 THEN 1 ELSE 0 END) AS movel_com_fusion,
      SUM(CASE WHEN movel_total > 0 THEN 1 ELSE 0 END) AS movel_com_servico,
      SUM(CASE WHEN b2b_fusion > 0 AND b2b_total > 0 THEN 1 ELSE 0 END) AS b2b_com_fusion,
      SUM(CASE WHEN b2b_total > 0 THEN 1 ELSE 0 END) AS b2b_com_servico
    FROM base
    GROUP BY uf_sigla_erb
    ORDER BY uf_sigla_erb
  `);
  return r.rows;
}

// Relatório 6: Serviços Legado ainda Ativos
async function servicosLegadoAtivos(uf) {
  const params = [];
  const ufFilter = ufWhere(uf, params);
  const r = await pool.query(`
    SELECT
      o.id_rota, o.num_oe, o.rota, o.status AS oe_status,
      o.equip_b, o.eqpto_final,
      o.sigla_erb, o.uf_sigla_erb,
      e.status AS equip_status, e.fabricante, e.modelo,
      eb.nome_site
    FROM oe o
    LEFT JOIN equipamentos e ON e.sigla = o.eqpto_final
    LEFT JOIN erb eb ON eb.sigla_erb = o.sigla_erb AND eb.uf_sigla_erb = o.uf_sigla_erb
    WHERE o.status = 'Ativada'
      AND ${LEGADO_LIKE}
      ${ufFilter}
    ORDER BY o.uf_sigla_erb, o.sigla_erb, o.equip_b
  `, params);
  return r.rows.map(row => ({ ...row, tipo_servico: classificarServico(row.equip_b) }));
}

module.exports = {
  listarUfs,
  erbsPorEquipamento,
  oesAtivasEquipNaoAtivo,
  oesAAtivarEquipAtivo,
  statusMigracaoErb,
  erbsPendentes,
  progressoPorUf,
  servicosLegadoAtivos,
};
