import { MapPin, Building2, Phone, Hash, Tag, FileText, Navigation } from 'lucide-react';

const STATUS_COLORS = {
  'ativado': 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30',
  'desativado': 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30',
};

function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  const cls = STATUS_COLORS[key] || 'bg-[#6B7280]/20 text-[#6B7280] border border-[#6B7280]/30';
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{status}</span>;
}

function Field({ icon: Icon, label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-2 border border-surface-3">
      <div className="w-8 h-8 rounded-md bg-brand-subtle flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-brand-light" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm text-white font-medium mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

export default function ErbCard({ erb }) {
  if (!erb) return null;
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Building2 size={16} className="text-brand-light" />
          Cadastro do Site
        </h2>
        <StatusBadge status={erb.status} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        <Field icon={Tag}        label="Sigla"          value={erb.sigla_erb} />
        <Field icon={Navigation} label="UF"             value={erb.uf_sigla_erb} />
        <Field icon={Building2}  label="Nome do Site"   value={erb.nome_site} />
        <Field icon={Hash}       label="ID SMTX"        value={erb.id_site} />
        <Field icon={Hash}       label="ID Science"     value={erb.id_site_science} />
        <Field icon={MapPin}     label="Endereço"       value={erb.endereco} />
        <Field icon={MapPin}     label="Localidade"     value={erb.localidade} />
        <Field icon={MapPin}     label="Município"      value={erb.municipio} />
        <Field icon={Phone}      label="Cód. de Área"   value={erb.cod_area} />
        <Field icon={FileText}   label="Status"         value={erb.status} />
      </div>
    </section>
  );
}
