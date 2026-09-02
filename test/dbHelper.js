// Helper para os testes de integração: cria o schema no Postgres de teste
// (mesmo initDatabase do app) e dá uma forma simples de popular/limpar dados
// entre testes, para exercitar as rotas contra um banco real — inclusive as
// colunas GENERATED (sigla_erb/uf_sigla_erb) cujo bug de schema motivou parte
// deste projeto ser revisitado.
const { pool, initDatabase } = require('../db');

async function setupDatabase() {
  await initDatabase();
}

async function limparTabelas() {
  await pool.query('TRUNCATE erb, oe, equipamentos, topologia RESTART IDENTITY CASCADE');
}

async function inserirErb(overrides = {}) {
  const erb = {
    id_site: 1, id_site_science: 1, sigla_site: 'FKASP', nome_site: 'JARDIM EXEMPLO',
    status: 'Ativado', uf: 'SP',
    ...overrides,
  };
  await pool.query(
    `INSERT INTO erb (id_site, id_site_science, sigla_site, nome_site, status, uf)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [erb.id_site, erb.id_site_science, erb.sigla_site, erb.nome_site, erb.status, erb.uf]
  );
  return erb;
}

async function inserirEquipamento(overrides = {}) {
  const eq = {
    id_equip_trans: 1, sigla: 'i-br-sp-fka-fka-hl5d-01', status: 'Ativado',
    sigla_site: 'FKASP', nome_site: 'JARDIM EXEMPLO', fabricante: 'Huawei', modelo: 'ATN950D',
    endereco_ip: '192.0.2.10/32',
    ...overrides,
  };
  await pool.query(
    `INSERT INTO equipamentos (id_equip_trans, sigla, status, sigla_site, nome_site, fabricante, modelo, endereco_ip)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [eq.id_equip_trans, eq.sigla, eq.status, eq.sigla_site, eq.nome_site, eq.fabricante, eq.modelo, eq.endereco_ip]
  );
  return eq;
}

async function inserirOe(overrides = {}) {
  const oe = {
    id_rota: 1, regional: 'SE', uf: 'SE', num_oe: 1, status: 'Ativada',
    equip_a: 'COREFAKE', equip_b: 'i-fka-01', rota: 'COREFAKE-FKASP',
    eqpto_aprox: 'i-br-sp-core-core-hl3-01 - i-br-sp-fka-fka-hl5d-01',
    ...overrides,
  };
  await pool.query(
    `INSERT INTO oe (id_rota, regional, uf, num_oe, status, equip_a, equip_b, rota, eqpto_aprox)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [oe.id_rota, oe.regional, oe.uf, oe.num_oe, oe.status, oe.equip_a, oe.equip_b, oe.rota, oe.eqpto_aprox]
  );
  return oe;
}

module.exports = { pool, setupDatabase, limparTabelas, inserirErb, inserirEquipamento, inserirOe };
