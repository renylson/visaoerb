const { parse }    = require('csv-parse');
const iconv        = require('iconv-lite');
const { parseStringPromise } = require('xml2js');
const { pool }     = require('../db');

const TABLE_CONFIG = {
  erb: {
    format:     'csv',
    primaryKey: 'id_site',
    columns: [
      { csv: 'idSite',                   db: 'id_site',                  type: 'integer' },
      { csv: 'idSiteScience',             db: 'id_site_science',          type: 'integer' },
      { csv: 'SiglaSite',                db: 'sigla_site',               type: 'text'    },
      { csv: 'NomeSite',                 db: 'nome_site',                type: 'text'    },
      { csv: 'Status',                   db: 'status',                   type: 'text'    },
      { csv: 'Endereco',                 db: 'endereco',                 type: 'text'    },
      { csv: 'RegiaoOperacional',        db: 'regiao_operacional',       type: 'text'    },
      { csv: 'Localidade',               db: 'localidade',               type: 'text'    },
      { csv: 'Municipio',                db: 'municipio',                type: 'text'    },
      { csv: 'CodArea',                  db: 'cod_area',                 type: 'integer' },
      { csv: 'UF',                       db: 'uf',                       type: 'text'    },
      { csv: 'CEP',                      db: 'cep',                      type: 'text'    },
      { csv: 'Altitude',                 db: 'altitude',                 type: 'numeric' },
      { csv: 'Latitude',                 db: 'latitude',                 type: 'text'    },
      { csv: 'Longitude',                db: 'longitude',                type: 'text'    },
      { csv: 'Proprietario',             db: 'proprietario',             type: 'text'    },
      { csv: 'CCC',                      db: 'ccc',                      type: 'text'    },
      { csv: 'NodeB',                    db: 'node_b',                   type: 'text'    },
      { csv: 'Coletor',                  db: 'coletor',                  type: 'text'    },
      { csv: 'Concentrador',             db: 'concentrador',             type: 'text'    },
      { csv: 'Repetidor',                db: 'repetidor',                type: 'text'    },
      { csv: 'Fibra',                    db: 'fibra',                    type: 'text'    },
      { csv: 'MetroEthernet',            db: 'metro_ethernet',           type: 'text'    },
      { csv: 'PontoPassagem',            db: 'ponto_passagem',           type: 'text'    },
      { csv: 'NumSitar',                 db: 'num_sitar',                type: 'text'    },
      { csv: 'ServicoAnatel',             db: 'servico_anatel',           type: 'text'    },
      { csv: 'TFI',                      db: 'tfi',                      type: 'text'    },
      { csv: 'TipoTorre',                db: 'tipo_torre',               type: 'text'    },
      { csv: 'AlturaTorre',              db: 'altura_torre',             type: 'text'    },
      { csv: 'ProprietarioTorre',        db: 'proprietario_torre',       type: 'text'    },
      { csv: 'TipoConstrucaoEstrutura',  db: 'tipo_construcao_estrutura',type: 'text'    },
      { csv: 'TipoEstrutura',            db: 'tipo_estrutura',           type: 'text'    },
      { csv: 'AlturaEstrutura',          db: 'altura_estrutura',         type: 'text'    },
    ],
  },

  equipamentos: {
    format:     'csv',
    primaryKey: 'id_equip_trans',
    columns: [
      { csv: 'idEquipTrans',        db: 'id_equip_trans',     type: 'integer'   },
      { csv: 'Sigla',               db: 'sigla',              type: 'text_lower' },
      { csv: 'Nome',                db: 'nome',               type: 'text'      },
      { csv: 'Utilizacao',          db: 'utilizacao',         type: 'text'      },
      { csv: 'Status',              db: 'status',             type: 'text'      },
      { csv: 'OEAtivacao',          db: 'oe_ativacao',        type: 'integer'   },
      { csv: 'DataAtivacao',        db: 'data_ativacao',      type: 'timestamp' },
      { csv: 'OEDesativacao',       db: 'oe_desativacao',     type: 'integer'   },
      { csv: 'DataDesativacao',     db: 'data_desativacao',   type: 'timestamp' },
      { csv: 'SiglaSite',           db: 'sigla_site',         type: 'text'      },
      { csv: 'NomedoSite',          db: 'nome_site',          type: 'text'      },
      { csv: 'Proprietario',        db: 'proprietario',       type: 'text'      },
      { csv: 'Fabricante',          db: 'fabricante',         type: 'text'      },
      { csv: 'Modelo',              db: 'modelo',             type: 'text'      },
      { csv: 'TipoEquipamento',     db: 'tipo_equipamento',   type: 'text'      },
      { csv: 'NShelfs',             db: 'num_shelfs',         type: 'integer'   },
      { csv: 'ReleaseSW',           db: 'release_sw',         type: 'text'      },
      { csv: 'ReleaseHW',           db: 'release_hw',         type: 'text'      },
      { csv: 'ReleaseOP',           db: 'release_op',         type: 'text'      },
      { csv: 'Rede',                db: 'rede',               type: 'text'      },
      { csv: 'NNSAP',               db: 'num_nsap',           type: 'text'      },
      { csv: 'EnderecoIP',          db: 'endereco_ip',        type: 'text'      },
      { csv: 'Configuracao',        db: 'configuracao',       type: 'text'      },
      { csv: 'ProjetoInstalacao',   db: 'projeto_instalacao', type: 'text'      },
      { csv: 'siglaRack',            db: 'sigla_rack',         type: 'text'      },
      { csv: 'NumRackSlot',         db: 'num_rack_slot',      type: 'text'      },
      { csv: 'Ocupacao',            db: 'ocupacao',           type: 'text'      },
    ],
  },

  oe: {
    format:     'xml',
    xmlRoot:    'ROOT',
    xmlRecord:  'tabConsolidado',
    primaryKey: 'id_rota',
    columns: [
      { csv: 'idRota',      db: 'id_rota',      type: 'integer' },
      { csv: 'Regional',    db: 'regional',     type: 'text'    },
      { csv: 'UF',          db: 'uf',           type: 'text'    },
      { csv: 'NumEILD',     db: 'num_eild',     type: 'bigint'  },
      { csv: 'NumOE',       db: 'num_oe',       type: 'integer' },
      { csv: 'Status',      db: 'status',       type: 'text'    },
      { csv: 'EquipA',      db: 'equip_a',      type: 'text'    },
      { csv: 'EquipB',      db: 'equip_b',      type: 'text'    },
      { csv: 'Rota',        db: 'rota',         type: 'text'    },
      { csv: 'EqptoAprox',  db: 'eqpto_aprox',  type: 'text'    },
      { csv: 'Tecnologia',  db: 'tecnologia',   type: 'text'    },
      { csv: 'SiteA',       db: 'site_a',       type: 'text'    },
      { csv: 'SiteB',       db: 'site_b',       type: 'text'    },
      { csv: 'EnderecoA',   db: 'endereco_a',   type: 'text'    },
      { csv: 'EnderecoB',   db: 'endereco_b',   type: 'text'    },
    ],
  },
};

function toDbValue(raw, type) {
  // Normaliza quebras de linha e espaços múltiplos (comum em campos XML multilinha)
  const v = (raw || '').replace(/[\r\n]+\s*/g, ' ').trim();
  if (v === '' || v === '-') return null;
  if (type === 'integer' || type === 'bigint') {
    const n = parseInt(v.replace(',', '.'), 10);
    return isNaN(n) ? null : n;
  }
  if (type === 'numeric') {
    const n = parseFloat(v.replace(',', '.'));
    return isNaN(n) ? null : n;
  }
  if (type === 'timestamp') {
    // aceita DD/MM/YYYY HH:MM:SS ou DD/MM/YYYY
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
    if (!m) return null;
    const [, d, mo, y, hh = '00', mm = '00', ss = '00'] = m;
    return new Date(`${y}-${mo}-${d}T${hh}:${mm}:${ss}`);
  }
  if (type === 'text_lower') return v.toLowerCase();
  return v;
}

async function parseXml(fileBuffer, config) {
  const xmlStr  = fileBuffer.toString('utf8');
  const parsed  = await parseStringPromise(xmlStr, { explicitArray: false, trim: true });
  const root    = parsed[config.xmlRoot];
  const records = root[config.xmlRecord];
  // xml2js retorna objeto único se há só 1 registro; normaliza para array
  return Array.isArray(records) ? records : [records];
}

function normalizeKey(s) {
  return s
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')   // remove diacríticos (acentos)
    .replace(/[°º]/g, '')      // remove símbolo de grau (N° → N)
    .replace(/\s+/g, '')       // remove espaços (Nome do Site → NomeSite)
    .replace(/[^A-Za-z0-9]/g, '') // remove qualquer outro especial
    .trim();
}

function mergeWrappedLines(csvString) {
  // Registros sempre começam com dígito (idEquipTrans, idSite...).
  // Tudo que não começa com dígito — incluindo linhas vazias — é continuação
  // do campo multilinha do registro anterior e deve ser colado nele.
  const lines = csvString.split(/\r?\n/);
  const merged = [];
  for (const line of lines) {
    const isNewRecord = /^\d/.test(line);
    const isHeader    = merged.length === 0; // primeira linha é sempre o cabeçalho
    if (isHeader || isNewRecord) {
      merged.push(line);
    } else {
      // linha vazia ou continuação de campo: cola no registro anterior
      const trimmed = line.trim();
      if (trimmed !== '') {
        merged[merged.length - 1] += ' ' + trimmed;
      }
      // linha completamente vazia: ignora (não adiciona entrada nova)
    }
  }
  return merged.join('\n');
}

async function parseCsv(fileBuffer) {
  // Arquivos exportados do sistema vêm em Windows-1252 (Latin-1 estendido)
  const raw       = iconv.decode(fileBuffer, 'win1252');
  const csvString = mergeWrappedLines(raw);
  return new Promise((resolve, reject) => {
    parse(csvString, {
      delimiter: ';',
      columns: headers => headers.map(normalizeKey),
      trim: true,
      skip_empty_lines: true,
      relax_column_count: true,
      quote: false,
    }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

async function processUpload(tableName, fileBuffer) {
  const config = TABLE_CONFIG[tableName];
  if (!config) throw new Error(`Tabela "${tableName}" não configurada.`);

  const { primaryKey, columns, format } = config;
  const dbCols = columns.map(c => c.db);

  const colList   = dbCols.map(c => `"${c}"`).join(', ');
  const valPlaces = dbCols.map((_, i) => `$${i + 1}`).join(', ');
  const updateSet = dbCols
    .filter(c => c !== primaryKey)
    .map(c => `"${c}" = EXCLUDED."${c}"`)
    .join(', ');

  const sql = `
    INSERT INTO ${tableName} (${colList})
    VALUES (${valPlaces})
    ON CONFLICT ("${primaryKey}") DO UPDATE SET ${updateSet}
    RETURNING xmax
  `;

  const records = format === 'xml'
    ? await parseXml(fileBuffer, config)
    : await parseCsv(fileBuffer);

  let inserted = 0;
  let updated  = 0;
  let errors   = 0;
  const errorDetails = [];

  const client = await pool.connect();
  try {
    for (const row of records) {
      try {
        const values = columns.map(col => toDbValue(row[col.csv], col.type));
        const result = await client.query(sql, values);
        if (result.rows[0]?.xmax === '0') inserted++;
        else updated++;
      } catch (err) {
        errors++;
        errorDetails.push({ row: row[columns[0].csv], error: err.message });
      }
    }
  } finally {
    client.release();
  }

  return {
    total: records.length,
    inserted,
    updated,
    errors,
    errorDetails: errorDetails.slice(0, 20),
  };
}

module.exports = { processUpload, TABLE_CONFIG };
