import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';

const app = require('../app');
const { pool, setupDatabase, limparTabelas, inserirErb, inserirEquipamento, inserirOe } = require('./dbHelper');

describe('routes/relatorios', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    await limparTabelas();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/relatorios/status-migracao-erb', () => {
    it('agrega contadores fusion/legado por ERB', async () => {
      await inserirEquipamento({ id_equip_trans: 1, sigla: 'i-br-sp-fka-fka-hl5d-01', status: 'Ativado', sigla_site: 'FKASP' });
      await inserirOe({
        id_rota: 1, status: 'Ativada', equip_b: 'WFKA1', rota: 'COREFAKE-FKASP',
        eqpto_aprox: 'RNCFAKEVRI/01 - i-br-sp-fka-fka-hl5d-01',
      });

      const res = await request(app).get('/api/relatorios/status-migracao-erb');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].sigla_erb).toBe('FKA');
      expect(Number(res.body[0].fusion_ok)).toBe(1);
      expect(Number(res.body[0].total_ativas)).toBe(1);
    });
  });

  describe('GET /api/relatorios/erbs-pendentes', () => {
    it('lista apenas OEs pendentes com equipamento Fusion, filtrando por serviço', async () => {
      await inserirOe({
        id_rota: 1, status: 'À Ativar', equip_b: 'WFKA1', rota: 'COREFAKE-FKASP',
        eqpto_aprox: 'RNCFAKEVRI/01 - i-br-sp-fka-fka-hl5d-01',
      });
      await inserirOe({
        id_rota: 2, status: 'Ativada', equip_b: 'WFKA2', rota: 'COREFAKE-FKASP',
        eqpto_aprox: 'RNCFAKEVRI/02 - i-br-sp-fka-fka-hl5d-01',
      });

      const todos = await request(app).get('/api/relatorios/erbs-pendentes');
      expect(todos.status).toBe(200);
      expect(todos.body).toHaveLength(1);
      expect(todos.body[0].oe_status).toBe('À Ativar');

      const filtrado = await request(app).get('/api/relatorios/erbs-pendentes?servico=3G');
      expect(filtrado.body).toHaveLength(1);

      const semResultado = await request(app).get('/api/relatorios/erbs-pendentes?servico=5G');
      expect(semResultado.body).toHaveLength(0);
    });
  });

  describe('GET /api/relatorios/progresso-por-uf', () => {
    it('calcula progresso móvel e B2B por UF', async () => {
      await inserirEquipamento({ id_equip_trans: 1, sigla: 'i-br-sp-fka-fka-hl5d-01', status: 'Ativado', sigla_site: 'FKASP' });
      await inserirOe({
        id_rota: 1, status: 'Ativada', equip_b: 'WFKA1', rota: 'COREFAKE-FKASP',
        eqpto_aprox: 'RNCFAKEVRI/01 - i-br-sp-fka-fka-hl5d-01',
      });

      const res = await request(app).get('/api/relatorios/progresso-por-uf');
      expect(res.status).toBe(200);
      const sp = res.body.find(r => r.uf === 'SP');
      expect(sp).toBeDefined();
      expect(Number(sp.movel_com_fusion)).toBe(1);
    });
  });
});
