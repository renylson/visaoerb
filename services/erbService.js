const { pool } = require('../db');
const { classificarServico } = require('./classificar');

// Determina a inconsistência cruzando OE × Equipamentos
function classificarInconsistencia(eqptoFinal, equipamentos, oeStatus) {
  if (!eqptoFinal) return { flag: 'sem_eqpto', label: 'Sem equipamento', detalhe: 'eqpto_final não identificado' };

  const equip = equipamentos.find(e => e.sigla === eqptoFinal);
  if (!equip) return { flag: 'sem_eqpto', label: 'Sem equipamento', detalhe: `${eqptoFinal} não encontrado na tabela equipamentos` };

  const equipStatus = (equip.status || '').toLowerCase();
  const oeStatusNorm = (oeStatus || '').toLowerCase();

  // OE Migrada → já foi concluída, independente do equip
  if (oeStatusNorm === 'migrada') {
    return { flag: 'migrado', label: 'Migrado', detalhe: 'OE concluída — serviço migrado' };
  }

  // OE Ativada + equip Desativado → problema real, precisa atenção
  if (oeStatusNorm === 'ativada' && equipStatus === 'desativado') {
    return {
      flag: 'critico',
      label: 'OE ativa / equip desativado',
      detalhe: `A OE está Ativada mas ${eqptoFinal} está Desativado — verificar urgente`,
    };
  }

  // OE Ativada + equip Ativado → consistente
  if (oeStatusNorm === 'ativada' && equipStatus === 'ativado') {
    return { flag: 'ok', label: 'Consistente', detalhe: 'OE e equipamento ativos' };
  }

  // OE A Migrar ou À Ativar + equip Ativado → providenciar
  if (['a migrar', 'à ativar'].includes(oeStatusNorm) && equipStatus === 'ativado') {
    const acao = oeStatusNorm === 'a migrar' ? 'Providenciar migração' : 'Providenciar ativação';
    return {
      flag: 'pendente',
      label: acao,
      detalhe: `OE está "${oeStatus}" com equipamento já ativo — ação necessária`,
    };
  }

  // OE A Migrar ou À Ativar + equip Desativado
  if (['a migrar', 'à ativar'].includes(oeStatusNorm) && equipStatus === 'desativado') {
    return {
      flag: 'critico',
      label: 'Equip desativado',
      detalhe: `OE "${oeStatus}" mas ${eqptoFinal} está Desativado`,
    };
  }

  // Demais casos (Planejado, etc.)
  return {
    flag: 'sem_eqpto',
    label: `Equip ${equip.status}`,
    detalhe: `${eqptoFinal} está com status ${equip.status}`,
  };
}

async function listarUfs() {
  const r = await pool.query(
    `SELECT DISTINCT uf_sigla_erb FROM erb WHERE uf_sigla_erb IS NOT NULL ORDER BY 1`
  );
  return r.rows.map(row => row.uf_sigla_erb);
}

async function listarSiglasPorUf(uf) {
  const r = await pool.query(
    `SELECT DISTINCT sigla_erb, nome_site FROM erb
     WHERE uf_sigla_erb = $1 AND sigla_erb IS NOT NULL
     ORDER BY sigla_erb`,
    [uf]
  );
  return r.rows;
}

async function buscarVisaoMassiva(eqptoFinal) {
  const r = await pool.query(
    `SELECT
       o.id_rota,
       o.num_oe,
       o.rota,
       o.status        AS oe_status,
       o.tecnologia,
       o.equip_a,
       o.equip_b,
       o.eqpto_final,
       o.sigla_erb,
       o.uf_sigla_erb,
       e.nome_site,
       e.status        AS erb_status,
       e.municipio,
       e.endereco
     FROM oe o
     LEFT JOIN erb e
       ON e.sigla_erb     = o.sigla_erb
      AND e.uf_sigla_erb  = o.uf_sigla_erb
     WHERE o.eqpto_final = $1
     ORDER BY o.uf_sigla_erb, o.sigla_erb, o.status`,
    [eqptoFinal]
  );
  const registros = r.rows.map(row => ({
    ...row,
    tipo_servico: classificarServico(row.equip_b),
  }));
  return { eqpto_final: eqptoFinal, total: r.rows.length, registros };
}

async function buscarVisaoErb(uf, sigla, nomeSite) {
  const siglaUp = sigla.toUpperCase();

  // ERB: filtra por nome_site quando fornecido (resolve duplicatas de sigla na mesma UF)
  const erbRes = await pool.query(
    `SELECT id_site, id_site_science, sigla_erb, uf_sigla_erb,
            nome_site, status, endereco, localidade, municipio, cod_area
     FROM erb
     WHERE uf_sigla_erb = $1 AND sigla_erb = $2
       ${nomeSite ? 'AND nome_site = $3' : ''}
     LIMIT 1`,
    nomeSite ? [uf, siglaUp, nomeSite] : [uf, siglaUp]
  );

  const erb = erbRes.rows[0] || null;
  const nomeSiteResolvido = erb?.nome_site || nomeSite;

  const [oeRes, equipRes] = await Promise.all([
    pool.query(
      `SELECT id_rota, num_oe, num_eild, status, rota,
              equip_a, equip_b, eqpto_aprox, eqpto_final,
              tecnologia, site_a, site_b
       FROM oe WHERE uf_sigla_erb = $1 AND sigla_erb = $2
       ORDER BY status, equip_b`,
      [uf, siglaUp]
    ),
    pool.query(
      // Cruza pelo nome_site para isolar equipamentos do site correto
      `SELECT id_equip_trans, sigla, sigla_erb, nome_site, status,
              oe_ativacao, data_ativacao, oe_desativacao, data_desativacao,
              fabricante, modelo, endereco_ip
       FROM equipamentos
       WHERE uf_sigla_erb = $1 AND sigla_erb = $2
         ${nomeSiteResolvido ? 'AND nome_site = $3' : ''}
       ORDER BY status, data_ativacao`,
      nomeSiteResolvido ? [uf, siglaUp, nomeSiteResolvido] : [uf, siglaUp]
    ),
  ]);

  const equipamentos = equipRes.rows;

  const oe = oeRes.rows.map(row => ({
    ...row,
    tipo_servico:   classificarServico(row.equip_b),
    inconsistencia: classificarInconsistencia(row.eqpto_final, equipamentos, row.status),
  }));

  return { erb, oe, equipamentos };
}

module.exports = { listarUfs, listarSiglasPorUf, buscarVisaoMassiva, buscarVisaoErb };
