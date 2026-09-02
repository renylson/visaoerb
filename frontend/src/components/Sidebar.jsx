import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Upload, Radio, Settings, Layers, Network, GitFork, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const navItems = [
  { label: 'Visão ERB',        icon: Radio,    href: '/'           },
  { label: 'Visão Massiva ERB',icon: Layers,   href: '/massiva'    },
  { label: 'Topologia',        icon: Network,  href: '/topologia'  },
  { label: 'Equipamentos',     icon: GitFork,  href: '/vizinhos'   },
  {
    label: 'Relatórios', icon: BarChart3, href: '/relatorios', group: true,
    children: [
      { label: 'Qtd ERB por Equipamento',    href: '/relatorios/erb-por-equipamento'          },
      { label: 'Status Migração por ERB',    href: '/relatorios/status-migracao-erb'          },
      { label: 'Progresso por UF',           href: '/relatorios/progresso-por-uf'             },
      { label: 'ERBs Pendentes',             href: '/relatorios/erbs-pendentes'               },
      { label: 'OEs Ativas Eqptos Não Ativos', href: '/relatorios/oes-ativas-equip-nao-ativo' },
      { label: 'OEs a Ativar Eqptos Ativos', href: '/relatorios/oes-a-ativar-equip-ativo'     },
      { label: 'Serviços Legado Ativos',     href: '/relatorios/servicos-legado-ativos'       },
    ],
  },
  { label: 'Importação',       icon: Upload,   href: '/importacao' },
  { label: 'Configurações',    icon: Settings, href: '/config'     },
];

export default function Sidebar() {
  const { theme } = useTheme();
  const { pathname: current } = useLocation();

  // Abre o grupo automaticamente se algum filho está ativo
  const [abertos, setAbertos] = useState(() => {
    const init = {};
    navItems.forEach(item => {
      if (item.children?.some(c => current === c.href)) init[item.href] = true;
    });
    return init;
  });

  const toggleGrupo = (href) =>
    setAbertos(prev => ({ ...prev, [href]: !prev[href] }));

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 flex flex-col z-40"
           style={{ background: theme.sidebarGradient }}>

      {/* Logo */}
      <div className="px-4 pt-4 pb-4 border-b border-white/10 flex flex-col items-center gap-3">
        {theme.logoUrl
          ? <img src={theme.logoUrl} alt="logo"
                 style={{ width: '100%', borderRadius: 20 }}
                 className="object-cover block" />
          : (
            <div style={{ width: '100%', borderRadius: 20, aspectRatio: '2/1' }}
                 className="bg-white/20 flex items-center justify-center">
              <Radio size={36} className="text-white" />
            </div>
          )
        }
        <div className="text-center">
          <p className="text-white font-bold text-sm leading-tight">{theme.appName}</p>
          <p className="text-white/60 text-xs mt-0.5">{theme.appSubtitle}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const { label, icon: Icon, href, children } = item;
          const active     = current === href;
          const grupoAberto = abertos[href];
          const filhoAtivo  = children?.some(c => current === c.href);

          if (children) {
            return (
              <div key={href}>
                {/* Item pai com toggle */}
                <button
                  onClick={() => toggleGrupo(href)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${filhoAtivo || grupoAberto
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                  <Icon size={18} />
                  <span className="flex-1 text-left">{label}</span>
                  {grupoAberto
                    ? <ChevronDown size={14} className="opacity-60"/>
                    : <ChevronRight size={14} className="opacity-60"/>}
                </button>

                {/* Filhos */}
                {grupoAberto && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                    {children.map(child => {
                      const childActive = current === child.href;
                      return (
                        <Link key={child.href} to={child.href}
                           className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all
                             ${childActive
                               ? 'bg-white/20 text-white'
                               : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link key={href} to={href}
               className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                 ${active
                   ? 'bg-white/20 text-white shadow-sm'
                   : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-white/30 text-xs">v1.0 · Visão ERB</p>
      </div>
    </aside>
  );
}
