require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'visaovivoerb',
  user: process.env.DB_USER || 'visaovivoerb',
  password: process.env.DB_PASSWORD,
});

const CREATE_EQUIPAMENTOS_TABLE = `
  CREATE TABLE IF NOT EXISTS equipamentos (
    id_equip_trans      INTEGER PRIMARY KEY,
    sigla               TEXT,
    nome                TEXT,
    utilizacao          TEXT,
    status              TEXT,
    oe_ativacao         INTEGER,
    data_ativacao       TIMESTAMP,
    oe_desativacao      INTEGER,
    data_desativacao    TIMESTAMP,
    sigla_site          TEXT,
    nome_site           TEXT,
    proprietario        TEXT,
    fabricante          TEXT,
    modelo              TEXT,
    tipo_equipamento    TEXT,
    num_shelfs          INTEGER,
    release_sw          TEXT,
    release_hw          TEXT,
    release_op          TEXT,
    rede                TEXT,
    num_nsap            TEXT,
    endereco_ip         TEXT,
    configuracao        TEXT,
    projeto_instalacao  TEXT,
    sigla_rack          TEXT,
    num_rack_slot       TEXT,
    ocupacao            TEXT,
    sigla_erb           TEXT GENERATED ALWAYS AS (UPPER(LEFT(sigla_site, 3))) STORED,
    uf_sigla_erb        TEXT GENERATED ALWAYS AS (UPPER(SUBSTRING(sigla_site, 4, 2))) STORED
  );
`;

const CREATE_OE_TABLE = `
  CREATE TABLE IF NOT EXISTS oe (
    id_rota         INTEGER PRIMARY KEY,
    regional        TEXT,
    uf              TEXT,
    num_eild        BIGINT,
    num_oe          INTEGER,
    status          TEXT,
    equip_a         TEXT,
    equip_b         TEXT,
    rota            TEXT,
    eqpto_aprox     TEXT,
    tecnologia      TEXT,
    site_a          TEXT,
    site_b          TEXT,
    endereco_a      TEXT,
    endereco_b      TEXT,
    sigla_erb       TEXT GENERATED ALWAYS AS (UPPER(LEFT(SPLIT_PART(rota, '-', 2), 3))) STORED,
    uf_sigla_erb    TEXT GENERATED ALWAYS AS (UPPER(SUBSTRING(SPLIT_PART(rota, '-', 2), 4, 2))) STORED,
    eqpto_final     TEXT GENERATED ALWAYS AS ((regexp_match(eqpto_aprox, '.*(?:^|[ /])((?:i-br-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-hl5[dg]-[a-z0-9]+)|(?:m-br-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-gw[ds]-[a-z0-9]+))'))[1]) STORED
  );
`;

const CREATE_ERB_TABLE = `
  CREATE TABLE IF NOT EXISTS erb (
    id_site               INTEGER PRIMARY KEY,
    id_site_science       INTEGER,
    sigla_site            TEXT,
    nome_site             TEXT,
    status                TEXT,
    endereco              TEXT,
    regiao_operacional    TEXT,
    localidade            TEXT,
    municipio             TEXT,
    cod_area              INTEGER,
    uf                    TEXT,
    cep                   TEXT,
    altitude              NUMERIC,
    latitude              TEXT,
    longitude             TEXT,
    proprietario          TEXT,
    ccc                   TEXT,
    node_b                TEXT,
    coletor               TEXT,
    concentrador          TEXT,
    repetidor             TEXT,
    fibra                 TEXT,
    metro_ethernet        TEXT,
    ponto_passagem        TEXT,
    num_sitar             TEXT,
    servico_anatel        TEXT,
    tfi                   TEXT,
    tipo_torre            TEXT,
    altura_torre          TEXT,
    proprietario_torre    TEXT,
    tipo_construcao_estrutura TEXT,
    tipo_estrutura        TEXT,
    altura_estrutura      TEXT,
    sigla_erb             TEXT GENERATED ALWAYS AS (UPPER(LEFT(sigla_site, 3))) STORED,
    uf_sigla_erb          TEXT GENERATED ALWAYS AS (UPPER(SUBSTRING(sigla_site, 4, 2))) STORED
  );
`;

const CREATE_TOPOLOGIA_TABLE = `
  CREATE TABLE IF NOT EXISTS topologia (
    id            SERIAL PRIMARY KEY,
    equipamento        TEXT NOT NULL,
    upstream           TEXT NOT NULL,
    porta_equipamento  TEXT,
    porta_upstream     TEXT,
    observacao         TEXT,
    link_id       TEXT,
    criado_em     TIMESTAMP DEFAULT NOW()
  );
`;

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(CREATE_ERB_TABLE);
    await client.query(CREATE_OE_TABLE);
    await client.query(CREATE_EQUIPAMENTOS_TABLE);
    await client.query(CREATE_TOPOLOGIA_TABLE);
    console.log('Tabelas erb, oe, equipamentos e topologia verificadas/criadas com sucesso.');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDatabase };
