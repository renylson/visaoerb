import { createContext, useContext, useState, useEffect } from 'react';

const DEFAULTS = {
  appName:       'Visão Vivo ERB',
  appSubtitle:   'Gestão de Rede',
  pageTitle:     'Visão Vivo ERB',
  faviconUrl:    '',
  logoUrl:       '',
  colorPrimary:  '#7F00B2',
  colorPrimaryLight: '#9C27FF',
  colorBg:       '#0A0A0A',
  colorSurface:  '#121212',
  colorSurface2: '#1E1E1E',
  colorBorder:   '#2A2A2A',
  sidebarGradient: 'linear-gradient(180deg, #660099 0%, #7F00B2 50%, #1E1E1E 100%)',
};

const ThemeContext = createContext({ theme: DEFAULTS, setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('vivo_erb_theme');
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch { return DEFAULTS; }
  });

  const setTheme = (partial) => {
    setThemeState(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem('vivo_erb_theme', JSON.stringify(next));
      return next;
    });
  };

  const resetTheme = () => {
    localStorage.removeItem('vivo_erb_theme');
    setThemeState(DEFAULTS);
  };

  // Aplica as variáveis CSS no :root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-bg',        theme.colorBg);
    root.style.setProperty('--color-surface',   theme.colorSurface);
    root.style.setProperty('--color-surface2',  theme.colorSurface2);
    root.style.setProperty('--color-border',    theme.colorBorder);
    root.style.setProperty('--color-primary',   theme.colorPrimary);
    root.style.setProperty('--color-primary-light', theme.colorPrimaryLight);
    document.body.style.backgroundColor = theme.colorBg;

    // Título da aba
    document.title = theme.pageTitle || 'Visão Vivo ERB';

    // Favicon dinâmico
    if (theme.faviconUrl) {
      let link = document.querySelector("link[rel='icon']");
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = theme.faviconUrl;
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resetTheme, DEFAULTS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
