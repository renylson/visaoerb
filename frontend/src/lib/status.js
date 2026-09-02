// Classes Tailwind para badges de status/tipo, centralizadas para evitar que
// cada tabela mantenha sua própria cópia (e divirja com o tempo).

export const STATUS_OE_CLASS = {
  'ativada':  'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/25',
  'a migrar': 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/25',
  'à ativar': 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/25',
  'migrada':  'bg-[#6B7280]/15 text-[#6B7280] border-[#6B7280]/25',
};

export const STATUS_EQUIP_CLASS = {
  'ativado':    'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/25',
  'planejado':  'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/25',
  'desativado': 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/25',
};

export const STATUS_EQUIP_TEXT_CLASS = {
  'ativado':    'text-[#22C55E]',
  'planejado':  'text-[#3B82F6]',
  'desativado': 'text-[#EF4444]',
};

export const TIPO_SERVICO_CLASS = {
  '2G': 'bg-[#9C27FF]/15 text-[#9C27FF] border-[#9C27FF]/25',
  '3G': 'bg-[#9C27FF]/15 text-[#9C27FF] border-[#9C27FF]/25',
  '4G': 'bg-[#9C27FF]/15 text-[#9C27FF] border-[#9C27FF]/25',
  '5G': 'bg-[#9C27FF]/15 text-[#9C27FF] border-[#9C27FF]/25',
  'MULTISERVIÇO (3G+4G+5G)': 'bg-[#9C27FF]/15 text-[#9C27FF] border-[#9C27FF]/25',
  'SWA': 'bg-[#0066FF]/15 text-[#4D9DFF] border-[#0066FF]/25',
  'Gerência Fonte': 'bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/25',
  'DCN Rádio': 'bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/25',
  'Outros': 'bg-[#6B7280]/15 text-[#6B7280] border-[#6B7280]/25',
};

export function statusOeClass(status) {
  return STATUS_OE_CLASS[(status || '').toLowerCase()] || STATUS_OE_CLASS['migrada'];
}

export function statusEquipClass(status) {
  return STATUS_EQUIP_CLASS[(status || '').toLowerCase()] || 'bg-[#6B7280]/15 text-[#6B7280] border-[#6B7280]/25';
}

export function statusEquipTextClass(status) {
  return STATUS_EQUIP_TEXT_CLASS[(status || '').toLowerCase()] || 'text-[#6B7280]';
}

export function tipoServicoClass(tipo) {
  return TIPO_SERVICO_CLASS[tipo] || TIPO_SERVICO_CLASS['Outros'];
}

// Cores/label por tipo de equipamento de transporte (Topologia, Vizinhos).
// Espelha services/classificar.js#tipoEquip no backend — a mesma convenção de
// nomenclatura de hostname (sufixo -hl4-/-hl5d-/etc) é reaplicada aqui porque
// a UI de grafo precisa classificar hostnames vindos de respostas já
// resolvidas, sem round-trip ao servidor.
export const TIPO_EQUIP_CONFIG = {
  hl4:   { bg: '#3B0764', border: '#7C3AED', label: 'HL4',  familia: 'Fusion' },
  hl5d:  { bg: '#4C1D95', border: '#8B5CF6', label: 'HL5D', familia: 'Fusion' },
  hl5g:  { bg: '#5B21B6', border: '#A78BFA', label: 'HL5G', familia: 'Fusion' },
  gwc:   { bg: '#1E3A5F', border: '#2563EB', label: 'GWC',  familia: 'Legado' },
  gwd:   { bg: '#1D4ED8', border: '#3B82F6', label: 'GWD',  familia: 'Legado' },
  gws:   { bg: '#2563EB', border: '#60A5FA', label: 'GWS',  familia: 'Legado' },
  outro: { bg: '#374151', border: '#6B7280', label: '?',    familia: 'Outros' },
};

export function tipoEquip(hostname) {
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
