import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';

const app = require('../app');
const { pool, setupDatabase, limparTabelas, inserirErb, inserirEquipamento, inserirOe } = require('./dbHelper');

describe('routes/visao', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    await limparTabelas();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/visao/ufs', () => {
    it('retorna lista vazia quando não há ERBs', async () => {
      const res = await request(app).get('/api/visao/ufs');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('retorna UFs distintas ordenadas', async () => {
      await inserirErb({ id_site: 1, sigla_site: 'FKASP' });
      await inserirErb({ id_site: 2, sigla_site: 'FKBSP' });
      await inserirErb({ id_site: 3, sigla_site: 'FKCRJ' });

      const res = await request(app).get('/api/visao/ufs');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(['RJ', 'SP']);
    });
  });

  describe('GET /api/visao/siglas', () => {
    it('retorna 400 quando uf não é informado', async () => {
      const res = await request(app).get('/api/visao/siglas');
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe('Parâmetro uf obrigatório.');
    });

    it('retorna as siglas da UF informada', async () => {
      await inserirErb({ id_site: 1, sigla_site: 'FKASP', nome_site: 'JARDIM EXEMPLO' });
      await inserirErb({ id_site: 2, sigla_site: 'FKCRJ', nome_site: 'BAIRRO SIMULADO' });

      const res = await request(app).get('/api/visao/siglas?uf=SP');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ sigla_erb: 'FKA', nome_site: 'JARDIM EXEMPLO' }]);
    });
  });

  describe('GET /api/visao/:uf/:sigla', () => {
    it('retorna erb, oe e equipamentos cruzados corretamente', async () => {
      await inserirErb({ id_site: 1, sigla_site: 'FKASP', nome_site: 'JARDIM EXEMPLO' });
      await inserirEquipamento({ id_equip_trans: 1, sigla: 'i-br-sp-fka-fka-hl5d-01', status: 'Ativado', sigla_site: 'FKASP' });
      await inserirOe({ id_rota: 1, equip_b: 'i-fka-01', rota: 'COREFAKE-FKASP', status: 'Ativada' });

      const res = await request(app).get('/api/visao/SP/FKA');
      expect(res.status).toBe(200);
      expect(res.body.erb.sigla_erb).toBe('FKA');
      expect(res.body.oe).toHaveLength(1);
      expect(res.body.oe[0].tipo_servico).toBe('2G');
      expect(res.body.oe[0].inconsistencia.flag).toBe('ok');
      expect(res.body.equipamentos).toHaveLength(1);
    });

    it('retorna erb null quando o site não existe', async () => {
      const res = await request(app).get('/api/visao/SP/NADA');
      expect(res.status).toBe(200);
      expect(res.body.erb).toBeNull();
      expect(res.body.oe).toEqual([]);
    });
  });
});
