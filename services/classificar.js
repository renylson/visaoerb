function classificarServico(equipB) {
  if (!equipB) return 'Outros';
  const v = equipB.trim();
  const partes = v.split('-');
  if (partes.length === 7 && partes[5]?.toLowerCase() === 'swa') return 'SWA';
  if (v.includes('FCC'))  return 'Gerência Fonte';
  if (v.includes('DCN'))  return 'DCN Rádio';
  const inicial = v[0]?.toUpperCase();
  if (inicial === 'I') return '2G';
  if (inicial === 'W') return '3G';
  if (inicial === 'T') return '4G';
  if (inicial === 'S') return '5G';
  if (inicial === 'M') return 'MULTISERVIÇO (3G+4G+5G)';
  return 'Outros';
}

module.exports = { classificarServico };
