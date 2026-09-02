import { describe, it, expect } from 'vitest';
import { classificarServico, tipoEquip } from '../services/classificar.js';

describe('classificarServico', () => {
  it('retorna Outros para valor vazio ou nulo', () => {
    expect(classificarServico(null)).toBe('Outros');
    expect(classificarServico('')).toBe('Outros');
  });

  it('classifica SWA pelo padrão de 7 segmentos com "-swa-"', () => {
    expect(classificarServico('m-br-sp-fka-fka-swa-01')).toBe('SWA');
  });

  it('não classifica como SWA se o hostname não tiver 7 segmentos', () => {
    expect(classificarServico('m-br-fka-swa-01')).not.toBe('SWA');
  });

  it('classifica Gerência Fonte quando contém FCC', () => {
    expect(classificarServico('M.SP.FKA.FCC1')).toBe('Gerência Fonte');
  });

  it('classifica DCN Rádio quando contém DCN', () => {
    expect(classificarServico('PTY-FKA_DCN_RD')).toBe('DCN Rádio');
  });

  it.each([
    ['i-br-sp-fka-fka-hl5d-01', '2G'],
    ['WFKA1', '3G'],
    ['TFKA1', '4G'],
    ['SFKA1', '5G'],
    ['MFKA1', 'MULTISERVIÇO (3G+4G+5G)'],
  ])('classifica %s como %s pelo prefixo', (equipB, esperado) => {
    expect(classificarServico(equipB)).toBe(esperado);
  });

  it('retorna Outros para prefixo desconhecido', () => {
    expect(classificarServico('XFKA1')).toBe('Outros');
  });
});

describe('tipoEquip', () => {
  it('retorna outro para hostname vazio ou nulo', () => {
    expect(tipoEquip(null)).toBe('outro');
    expect(tipoEquip('')).toBe('outro');
  });

  it.each([
    ['i-br-sp-fka-fka-hl4-01', 'hl4'],
    ['i-br-sp-fka-fka-hl5d-01', 'hl5d'],
    ['i-br-sp-fka-fka-hl5g-01', 'hl5g'],
    ['m-br-sp-fka-fka-gwc-01', 'gwc'],
    ['m-br-sp-fka-fka-gwd-01', 'gwd'],
    ['m-br-sp-fka-fka-gws-01', 'gws'],
  ])('classifica %s como %s', (hostname, esperado) => {
    expect(tipoEquip(hostname)).toBe(esperado);
  });

  it('é case-insensitive', () => {
    expect(tipoEquip('I-BR-SP-FKA-FKA-HL5D-01')).toBe('hl5d');
  });

  it('retorna outro para hostname sem sufixo reconhecido', () => {
    expect(tipoEquip('WFKA1')).toBe('outro');
  });
});
