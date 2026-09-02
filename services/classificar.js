// Classifica o serviço (geração de rede / tipo de link) a partir do hostname
// do equipamento de ponta (equip_b), usando as convenções de nomenclatura
// da rede: prefixo de letra = tecnologia, sufixo "-swa-" = B2B.
function classificarServico(equipB) {
  if (!equipB) return 'Outros';
  const v = equipB.trim();
  const partes = v.split('-');
  if (partes.length === 7 && partes[5]?.toLowerCase() === 'swa') return 'SWA';
  if (v.includes('FCC')) return 'Gerência Fonte';
  if (v.includes('DCN')) return 'DCN Rádio';
  const inicial = v[0]?.toUpperCase();
  if (inicial === 'I') return '2G';
  if (inicial === 'W') return '3G';
  if (inicial === 'T') return '4G';
  if (inicial === 'S') return '5G';
  if (inicial === 'M') return 'MULTISERVIÇO (3G+4G+5G)';
  return 'Outros';
}

// Classifica o tipo de equipamento de transporte pelo sufixo do hostname.
function tipoEquip(hostname) {
  if (!hostname) return 'outro';
  const h = hostname.toLowerCase();
  if (h.includes('-hl4-')) return 'hl4';
  if (h.includes('-hl5d-')) return 'hl5d';
  if (h.includes('-hl5g-')) return 'hl5g';
  if (h.includes('-gwc-')) return 'gwc';
  if (h.includes('-gwd-')) return 'gwd';
  if (h.includes('-gws-')) return 'gws';
  return 'outro';
}

module.exports = { classificarServico, tipoEquip };
