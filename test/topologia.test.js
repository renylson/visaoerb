import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';

const app = require('../app');
const { pool, setupDatabase, limparTabelas, inserirEquipamento } = require('./dbHelper');

describe('routes/topologia', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    await limparTabelas();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/topologia', () => {
    it('cria uma relação com sucesso', async () => {
      const res = await request(app)
        .post('/api/topologia')
        .send({ equipamento: 'a-01', upstream: 'b-01' });
      expect(res.status).toBe(200);
      expect(res.body.equipamento).toBe('a-01');
      expect(res.body.upstream).toBe('b-01');
    });

    it('rejeita quando equipamento e upstream são iguais', async () => {
      const res = await request(app)
        .post('/api/topologia')
        .send({ equipamento: 'a-01', upstream: 'a-01' });
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe('equipamento e upstream não podem ser iguais');
    });

    it('rejeita quando faltam campos obrigatórios', async () => {
      const res = await request(app).post('/api/topologia').send({});
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe('equipamento e upstream são obrigatórios');
    });
  });

  describe('PATCH /api/topologia/:id e DELETE', () => {
    it('atualiza portas de uma relação existente', async () => {
      const created = await request(app)
        .post('/api/topologia')
        .send({ equipamento: 'a-01', upstream: 'b-01' });
      const id = created.body.id;

      const res = await request(app)
        .patch(`/api/topologia/${id}`)
        .send({ porta_equipamento: 'ge-0/0/1' });
      expect(res.status).toBe(200);
      expect(res.body.porta_equipamento).toBe('ge-0/0/1');
    });

    it('remove uma relação existente', async () => {
      const created = await request(app)
        .post('/api/topologia')
        .send({ equipamento: 'a-01', upstream: 'b-01' });
      const id = created.body.id;

      const del = await request(app).delete(`/api/topologia/${id}`);
      expect(del.status).toBe(200);
      expect(del.body.ok).toBe(true);

      const listar = await request(app).get('/api/topologia/listar?equipamento=a-01');
      expect(listar.body).toEqual([]);
    });
  });

  describe('GET /api/topologia/:hostname — grafo recursivo', () => {
    it('resolve a árvore de upstream/downstream com múltiplos níveis', async () => {
      await inserirEquipamento({ id_equip_trans: 1, sigla: 'a-01', sigla_site: 'FKASP' });
      await inserirEquipamento({ id_equip_trans: 2, sigla: 'b-01', sigla_site: 'FKASP' });
      await inserirEquipamento({ id_equip_trans: 3, sigla: 'c-01', sigla_site: 'FKASP' });

      // a-01 -> b-01 -> c-01 (b é upstream de a, c é upstream de b)
      await request(app).post('/api/topologia').send({ equipamento: 'a-01', upstream: 'b-01' });
      await request(app).post('/api/topologia').send({ equipamento: 'b-01', upstream: 'c-01' });

      const res = await request(app).get('/api/topologia/a-01');
      expect(res.status).toBe(200);
      const ids = res.body.nos.map(n => n.id).sort();
      expect(ids).toEqual(['a-01', 'b-01', 'c-01']);
      expect(res.body.arestas).toHaveLength(2);
    });

    it('retorna apenas o próprio hostname quando não há relações', async () => {
      const res = await request(app).get('/api/topologia/isolado-01');
      expect(res.status).toBe(200);
      expect(res.body.nos).toHaveLength(1);
      expect(res.body.nos[0].raiz).toBe(true);
    });
  });
});
