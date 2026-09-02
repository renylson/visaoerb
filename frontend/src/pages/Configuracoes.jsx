import { useState, useRef } from 'react';
import { Settings, Upload, RotateCcw, Save, Check, Palette, Type, Image } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../ThemeContext';

function Section({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 mb-4">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-5">
        <Icon size={15} className="text-[var(--color-primary-light)]" />
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">{label}</label>
      {hint && <p className="text-xs text-[#6B7280] mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[var(--color-border)] flex-shrink-0 cursor-pointer">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        <div className="w-full h-full rounded-lg" style={{ background: value }} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-white font-medium mb-0.5">{label}</p>
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
               className="w-full bg-[var(--color-surface2)] border border-[var(--color-border)] text-[#B3B3B3] text-xs rounded-md px-2.5 py-1.5 font-mono focus:outline-none focus:border-[var(--color-primary-light)]" />
      </div>
    </div>
  );
}

export default function Configuracoes() {
  const { theme, setTheme, resetTheme, DEFAULTS } = useTheme();
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState(theme.logoUrl || '');
  const fileRef    = useRef();
  const faviconRef = useRef();

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setLogoPreview(url);
      setTheme({ logoUrl: url });
    };
    reader.readAsDataURL(file);
  };

  const handleGradientChange = (val) => setTheme({ sidebarGradient: val });

  const gradientPresets = [
    { label: 'Roxo',        value: 'linear-gradient(180deg, #660099 0%, #7F00B2 50%, #1E1E1E 100%)' },
    { label: 'Azul Tech',   value: 'linear-gradient(180deg, #003399 0%, #0066FF 50%, #1E1E1E 100%)' },
    { label: 'Verde Rede',  value: 'linear-gradient(180deg, #065F46 0%, #059669 50%, #1E1E1E 100%)' },
    { label: 'Cinza Dark',  value: 'linear-gradient(180deg, #1F2937 0%, #374151 50%, #1E1E1E 100%)' },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: theme.colorBg }}>
      <Sidebar />

      <main className="ml-60 flex-1 flex flex-col">
        <header className="sticky top-0 z-30 backdrop-blur border-b px-8 py-4"
                style={{ background: `${theme.colorBg}e6`, borderColor: theme.colorBorder }}>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings size={18} className="text-[var(--color-primary-light)]" />
            Configurações
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">Personalize a aparência da aplicação</p>
        </header>

        <div className="flex-1 px-8 py-6 max-w-2xl">

          {/* Identidade */}
          <Section title="Identidade" icon={Type}>
            <Field label="Nome da aplicação" hint="Exibido na sidebar">
              <input type="text" value={theme.appName}
                     onChange={e => setTheme({ appName: e.target.value })}
                     className="w-full bg-[var(--color-surface2)] border border-[var(--color-border)] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[var(--color-primary-light)]" />
            </Field>
            <Field label="Título da aba (página)" hint="Texto que aparece na aba do navegador">
              <input type="text" value={theme.pageTitle || ''}
                     onChange={e => setTheme({ pageTitle: e.target.value })}
                     placeholder="Visão ERB"
                     className="w-full bg-[var(--color-surface2)] border border-[var(--color-border)] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[var(--color-primary-light)] placeholder-[#6B7280]" />
            </Field>
            <Field label="Subtítulo">
              <input type="text" value={theme.appSubtitle}
                     onChange={e => setTheme({ appSubtitle: e.target.value })}
                     className="w-full bg-[var(--color-surface2)] border border-[var(--color-border)] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[var(--color-primary-light)]" />
            </Field>
          </Section>

          {/* Logo */}
          <Section title="Logo" icon={Image}>
            <Field label="Imagem da logo" hint="PNG ou SVG com fundo transparente. Será exibida no topo da sidebar.">
              <div className="flex items-center gap-4">
                {logoPreview
                  ? <img src={logoPreview} alt="logo" className="h-12 w-auto rounded-lg object-contain bg-white/10 p-1" />
                  : <div className="w-12 h-12 rounded-lg border border-dashed border-[var(--color-border)] flex items-center justify-center">
                      <Image size={20} className="text-[#6B7280]" />
                    </div>
                }
                <div className="flex gap-2">
                  <button onClick={() => fileRef.current.click()}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-[var(--color-surface2)] border border-[var(--color-border)] hover:border-[var(--color-primary-light)] transition-colors">
                    <Upload size={13} /> Carregar
                  </button>
                  {logoPreview && (
                    <button onClick={() => { setLogoPreview(''); setTheme({ logoUrl: '' }); }}
                            className="px-3 py-2 rounded-lg text-sm text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/10 transition-colors">
                      Remover
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
            </Field>

            <Field label="Favicon" hint="Ícone da aba do navegador. Use ICO, PNG ou SVG (recomendado 32×32px).">
              <div className="flex items-center gap-4">
                {theme.faviconUrl
                  ? <img src={theme.faviconUrl} alt="favicon" className="w-8 h-8 rounded object-contain bg-white/10 p-0.5" />
                  : <div className="w-8 h-8 rounded border border-dashed border-[var(--color-border)] flex items-center justify-center">
                      <Image size={14} className="text-[#6B7280]" />
                    </div>
                }
                <div className="flex gap-2">
                  <button onClick={() => faviconRef.current.click()}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-[var(--color-surface2)] border border-[var(--color-border)] hover:border-[var(--color-primary-light)] transition-colors">
                    <Upload size={13} /> Carregar
                  </button>
                  {theme.faviconUrl && (
                    <button onClick={() => setTheme({ faviconUrl: '' })}
                            className="px-3 py-2 rounded-lg text-sm text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/10 transition-colors">
                      Remover
                    </button>
                  )}
                </div>
                <input ref={faviconRef} type="file" accept="image/*,.ico" className="hidden"
                       onChange={e => {
                         const f = e.target.files[0]; if (!f) return;
                         const reader = new FileReader();
                         reader.onload = ev => setTheme({ faviconUrl: ev.target.result });
                         reader.readAsDataURL(f);
                       }} />
              </div>
            </Field>
          </Section>

          {/* Cores */}
          <Section title="Cores" icon={Palette}>
            <div className="grid grid-cols-2 gap-4">
              <ColorPicker label="Cor primária"       value={theme.colorPrimary}      onChange={v => setTheme({ colorPrimary: v })} />
              <ColorPicker label="Cor primária clara" value={theme.colorPrimaryLight} onChange={v => setTheme({ colorPrimaryLight: v })} />
              <ColorPicker label="Fundo"              value={theme.colorBg}           onChange={v => setTheme({ colorBg: v })} />
              <ColorPicker label="Superfície"         value={theme.colorSurface}      onChange={v => setTheme({ colorSurface: v })} />
              <ColorPicker label="Superfície 2"       value={theme.colorSurface2}     onChange={v => setTheme({ colorSurface2: v })} />
              <ColorPicker label="Borda"              value={theme.colorBorder}       onChange={v => setTheme({ colorBorder: v })} />
            </div>
          </Section>

          {/* Sidebar */}
          <Section title="Sidebar" icon={Palette}>
            <Field label="Gradiente da sidebar">
              <div className="flex flex-wrap gap-2 mb-3">
                {gradientPresets.map(p => (
                  <button key={p.label} onClick={() => handleGradientChange(p.value)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                          style={{
                            border: theme.sidebarGradient === p.value ? `1px solid ${theme.colorPrimaryLight}` : '1px solid var(--color-border)',
                            color: theme.sidebarGradient === p.value ? '#fff' : '#6B7280',
                          }}>
                    <span className="w-4 h-4 rounded-sm flex-shrink-0" style={{ background: p.value }} />
                    {p.label}
                  </button>
                ))}
              </div>
              <input type="text" value={theme.sidebarGradient}
                     onChange={e => handleGradientChange(e.target.value)}
                     className="w-full bg-[var(--color-surface2)] border border-[var(--color-border)] text-[#B3B3B3] text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-[var(--color-primary-light)]" />
              <div className="mt-2 h-8 rounded-lg" style={{ background: theme.sidebarGradient }} />
            </Field>
          </Section>

          {/* Ações */}
          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
                    style={{ background: `linear-gradient(135deg, ${theme.colorPrimary}, ${theme.colorPrimaryLight})` }}>
              {saved ? <><Check size={14} /> Salvo!</> : <><Save size={14} /> Salvar alterações</>}
            </button>
            <button onClick={resetTheme}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-[#6B7280] border border-[var(--color-border)] hover:text-white hover:border-[var(--color-primary-light)] transition-colors">
              <RotateCcw size={13} /> Restaurar padrão
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
